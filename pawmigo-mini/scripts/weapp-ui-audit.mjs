import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = process.cwd()
const rawArgs = process.argv.slice(2)
const args = new Set(rawArgs)
const waitArg = rawArgs.find((arg) => arg.startsWith('--wait='))
const captureArg = rawArgs.find((arg) => arg.startsWith('--capture='))
const outArg = rawArgs.find((arg) => arg.startsWith('--out='))
const findingArgs = rawArgs
  .filter((arg) => arg.startsWith('--finding='))
  .map((arg) => arg.split('=').slice(1).join('=').trim())
  .filter(Boolean)
const waitSeconds = Number(waitArg?.split('=')[1] ?? 6)
const shouldOpenDevTools = args.has('--open')
const rawCaptureName = captureArg?.split('=').slice(1).join('=')
  || (args.has('--capture') ? 'manual-capture' : '')
const captureName = sanitizeFileSegment(rawCaptureName)
const shouldScreenshot = args.has('--screenshot') || Boolean(captureName)
const shouldBuild = !args.has('--skip-build')
const shouldCheckRoutes = !args.has('--skip-routes')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const auditRoot = outArg
  ? path.resolve(projectRoot, outArg.split('=').slice(1).join('='))
  : path.join(projectRoot, 'audit', 'weapp-ui', timestamp)
const reportPath = path.join(auditRoot, 'report.md')
const screenshotsDir = path.join(auditRoot, 'screenshots')
const findingsPath = path.join(auditRoot, 'findings.md')
const screenshotFileName = `${captureName || 'wechat-devtools'}.png`
const screenshotPath = path.join(captureName ? screenshotsDir : auditRoot, screenshotFileName)

const devtoolsCli = process.env.WECHAT_DEVTOOLS_CLI
  || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

function sanitizeFileSegment(value) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
    throw new Error(`${command} ${commandArgs.join(' ')} failed${output ? `\n${output}` : ''}`)
  }

  return result
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join('\n')
}

function markdownTable(rows) {
  if (!rows.length) return '暂无截图。'

  return [
    '| 截图 | 文件 |',
    '| --- | --- |',
    ...rows.map((row) => `| ${row.name} | \`${row.path}\` |`),
  ].join('\n')
}

function existingScreenshots() {
  if (!fs.existsSync(screenshotsDir)) return []

  return fs.readdirSync(screenshotsDir)
    .filter((file) => file.endsWith('.png'))
    .sort()
    .map((file) => ({
      name: file.replace(/\.png$/, ''),
      path: path.join(screenshotsDir, file),
    }))
}

function existingFindings() {
  if (!fs.existsSync(findingsPath)) return []

  return fs.readFileSync(findingsPath, 'utf8')
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
}

function extractJson(output) {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    return output.trim()
  }

  return output.slice(start, end + 1)
}

fs.mkdirSync(auditRoot, { recursive: true })

if (shouldScreenshot) {
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true })
}

let routeCheckJson = ''

if (shouldBuild) {
  run('npm', ['run', 'build:weapp'])
}

if (shouldCheckRoutes) {
  const routeCheck = run('npm', ['run', 'check:routes'], { capture: true })
  routeCheckJson = extractJson(routeCheck.stdout)
}

const projectConfigPath = path.join(projectRoot, 'project.config.json')
const appJsonPath = path.join(projectRoot, 'dist', 'app.json')
const projectConfig = readJson(projectConfigPath)
const appJson = readJson(appJsonPath)

const findings = []
const checks = []
const screenshotRows = []

if (findingArgs.length) {
  fs.appendFileSync(findingsPath, `${findingArgs.map((finding) => `- ${finding}`).join('\n')}\n`)
}

checks.push(`微信开发者工具导入目录：\`${projectRoot}\``)
checks.push(`\`project.config.json\` 的 \`miniprogramRoot\`：\`${projectConfig.miniprogramRoot}\``)
checks.push(`构建产物：\`dist/app.json\` 已生成，注册页面 ${appJson.pages.length} 个`)
if (shouldBuild) {
  checks.push('构建检查：`npm run build:weapp` 通过')
} else {
  checks.push('构建检查：本次跳过，用于不中断当前模拟器页面的追加截图')
}

if (shouldCheckRoutes) {
  checks.push('路由检查：`npm run check:routes` 通过')
} else {
  checks.push('路由检查：本次跳过')
}

if (projectConfig.miniprogramRoot !== 'dist/') {
  findings.push('`project.config.json` 的 `miniprogramRoot` 不是 `dist/`，微信开发者工具可能找不到构建后的 `app.json`。')
}

if (!fs.existsSync(devtoolsCli)) {
  findings.push(`未找到微信开发者工具 CLI：\`${devtoolsCli}\`。可通过 \`WECHAT_DEVTOOLS_CLI=/path/to/cli\` 指定。`)
}

for (const finding of existingFindings()) {
  findings.push(finding)
}

if (shouldOpenDevTools) {
  if (!fs.existsSync(devtoolsCli)) {
    throw new Error(`WeChat DevTools CLI not found: ${devtoolsCli}`)
  }

  run(devtoolsCli, ['open', '--project', projectRoot, '--lang', 'zh', '--disable-gpu'])
  checks.push('微信开发者工具：已打开当前项目')
}

if (shouldScreenshot) {
  if (Number.isFinite(waitSeconds) && waitSeconds > 0) {
    sleep(waitSeconds * 1000)
  }

  run('screencapture', ['-x', screenshotPath])
  screenshotRows.push({ name: captureName || '微信开发者工具当前窗口', path: screenshotPath })
  checks.push(`桌面截图：\`${screenshotPath}\``)
}

for (const screenshot of existingScreenshots()) {
  if (!screenshotRows.some((row) => row.path === screenshot.path)) {
    screenshotRows.push(screenshot)
  }
}

const report = `# 微信小程序 UI 审核报告

生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}

## 构建与入口

${markdownList(checks)}

> 重要：微信开发者工具请导入 \`pawmigo-mini\` 目录，不要导入仓库根目录。当前项目通过 \`project.config.json\` 指向 \`dist/\`，\`app.json\` 会在 \`npm run build:weapp\` 后生成到 \`dist/app.json\`。

## 页面流转基线

| 旅程 | 审核路径 |
| --- | --- |
| 新用户进入 | 启动页 -> 登录/注册 -> 创建宠物档案 -> 权限说明 -> 附近地图 |
| 附近发现 | 附近地图 -> 宠物详情 -> 等待回应 -> 匹配成功 -> 集合点确认 -> 偶遇进行中 |
| 偶遇收尾 | 偶遇进行中 -> 消息沟通 -> 反馈 -> 钱包 |
| 圈子内容 | 圈子 -> 发帖 -> 贴纸编辑 -> 回到圈子 |
| 组队 | 组队列表 -> 队伍详情 -> 创建队伍 -> 队伍详情 |
| 我的与安全 | 我的 -> 钱包 / 奖杯墙 / 设置 / 安全中心 -> 隐私安全 / 紧急求助 |

## 设计师视角检查项

- 信息层级：首屏主行动是否唯一、标题与状态是否一眼可扫。
- 触控体验：主要按钮和图标热区是否接近 44px 以上，按钮间距是否防误触。
- 视觉一致性：粗边框、硬阴影、亮色强调和按压反馈是否延续当前设计系统。
- 内容承接：跨页面宠物名、地点、距离、奖励和状态文案是否一致。
- 边界状态：空态、加载态、错误态、权限拒绝态是否有可恢复出口。
- 截图证据：每个核心旅程至少保留入口、决策页、结果页三类截图。

## 截图索引

${markdownTable(screenshotRows)}

## 路由检查输出

${routeCheckJson ? `\
\`\`\`json
${routeCheckJson}
\`\`\`` : '本次未执行路由检查。'}

## 当前发现

${findings.length ? markdownList(findings) : '- 暂无阻断项。'}
`

fs.writeFileSync(reportPath, report)

console.log(`UI audit report written to ${reportPath}`)
if (shouldScreenshot) {
  console.log(`Screenshot written to ${screenshotPath}`)
}
