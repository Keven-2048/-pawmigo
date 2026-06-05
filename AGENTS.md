# AGENTS.md

面向在本仓库工作的自动化编码代理和协作者。执行任务前先读本文件，并以用户最新指令为最高优先级。

## 项目结构

```text
.
├── pawmigo-server/                 # Go + Gin 后端
│   ├── cmd/server/main.go          # 服务装配和启动入口
│   ├── internal/config/            # 环境变量配置
│   ├── internal/handler/           # HTTP handler 与路由
│   ├── internal/middleware/        # JWT 签发、解析和 Gin 中间件
│   ├── internal/model/             # GORM 数据模型
│   ├── internal/repository/        # MySQL / Redis 访问层
│   ├── internal/service/           # 业务逻辑
│   ├── internal/wxauth/            # 微信 code2session 客户端抽象
│   ├── migrations/                 # MySQL 初始化 SQL
│   ├── docker-compose.yml          # MySQL 8 + Redis 7 本地依赖
│   └── .env.example                # 后端环境变量示例
├── pawmigo-mini/                   # Taro 3.6 + React + TypeScript 微信小程序
│   ├── config/index.ts             # Taro 构建配置
│   ├── src/app.config.ts           # 小程序页面、tabBar、权限配置
│   ├── src/app.tsx                 # 小程序入口
│   ├── src/app.scss                # 全局样式
│   ├── src/pages/                  # 页面：地图、圈子、偶遇、组队、我的、登录、宠物表单
│   ├── src/services/               # API 与请求封装
│   └── src/store/                  # Zustand 全局状态
├── docs/superpowers/specs/         # 已确认设计文档
├── docs/superpowers/plans/         # 实施计划
└── 遛遛 Pawmigo · 功能需求文档 PRD v1.0.md
```

## 项目整体介绍

遛遛 Pawmigo 是面向宠物主人的附近遛狗、偶遇匹配、宠物圈子和兴趣组队产品。当前仓库包含：

- `pawmigo-server/`：Go + Gin 后端，负责认证、用户、宠物档案、位置状态、偶遇和社区等 API。
- `pawmigo-mini/`：Taro 3.6 + React + TypeScript 微信小程序前端，是主要用户界面。
- `docs/` 与 PRD：产品需求、设计说明和实施计划。

前端视觉基准来自 Open Design 原生 HTML 原型，整体风格为高对比新粗野主义：暖黄色画布、纯白卡片、黑色粗边框、硬阴影、亮紫/青/黄/玫红强调色、强字重标题和按压位移动效。

## 前端目录结构

```text
pawmigo-mini/src/
├── app.config.ts                  # 页面、tabBar、权限与开发预览页注册
├── app.scss                       # 全局设计令牌、基础布局、组件样式和页面样式
├── app.tsx                        # Taro 应用入口
├── components/
│   └── ui.tsx                     # AppBar、Button、Card、Input、Tag、Layout 等复用组件
├── data/
│   └── mockData.ts                # 本地演示数据
├── pages/
│   ├── design-system/index.tsx    # 设计系统预览页，仅非 production 注册
│   ├── map/index.tsx              # 地图发现
│   ├── feed/index.tsx             # 宠物圈子
│   ├── encounter/index.tsx        # 偶遇匹配
│   ├── team/index.tsx             # 兴趣组队
│   ├── profile/index.tsx          # 我的
│   ├── profile/pet-form.tsx       # 宠物档案表单
│   └── login/index.tsx            # 登录
├── services/                      # API 与请求封装
└── store/                         # Zustand 全局状态
```

## 设计系统架构

设计系统分为两层：

- 样式令牌与基础类：集中在 `pawmigo-mini/src/app.scss`，包括颜色、字体、间距、圆角、阴影、按压状态、地图图钉、卡片、表单、底部导航、Toast/Sheet 等样式。
- React 复用组件：集中在 `pawmigo-mini/src/components/ui.tsx`，通过 `variant`、`tone`、`active`、`className`、`style` 等 props 组合已有样式，不在页面中重复堆叠视觉规则。

核心设计令牌：

- 颜色：`$bg #fffbeb`、`$surface #ffffff`、`$surface-alt #f3f4f6`、`$fg #000000`、`$accent #a855f7`、`$accent-secondary #22d3ee`、`$accent-tertiary #facc15`、`$accent-quaternary #fb7185`、`$success #4ade80`、`$danger #f87171`。
- 边框与阴影：统一黑色 `2px` 边框；常规硬阴影 `4px 4px 0 #000`，小阴影 `2px 2px 0 #000`，强调阴影 `8px 8px 0 #000`。
- 圆角：按钮和标签优先 `4px`，卡片 `12px`，大头像/底部面板 `24px`，胶囊形使用 `999px`。
- 字体：微信小程序内使用系统字体栈，标题和关键控件使用 `800/900` 字重，正文和说明使用 `650/700` 字重。
- 交互：按钮、标签、卡片的 `hoverClass='button-hover'` 或 `:active` 采用 `translate(2px, 2px)` 并移除阴影，还原 HTML 原型按压状态。

## 组件复用规范

- 开发页面时，必须优先复用 `src/components/ui.tsx` 中已有组件。
- 只有在现有组件无法满足需求时，才新增组件。
- 如果已有组件可以通过 `props`、`variant`、`tone`、`active`、`className`、`style` 等方式扩展，应优先扩展，而不是重新创建相似组件。
- 新增组件必须先判断能否由 `DSButton`、`SurfaceCard`、`Field`、`Tag`、`Chip`、`AppBar`、`PageShell`、`SectionHeader` 等组合完成。
- 页面文件只处理业务状态、数据映射和导航；不要在页面内重复写颜色、阴影、边框、圆角和字体规则。
- 新增样式优先补到 `app.scss` 的设计系统区域，并使用现有令牌变量；不要在 JSX inline style 中硬编码新的品牌色或阴影。
- 非交互标签使用 `Tag` 或 `.tag`，交互筛选使用 `Chip` 或 `.chip`，两者不要混用阴影语义。
- 新增开发验证内容放在 `pages/design-system/index.tsx`，该页面仅用于开发环境查看，不进入生产页面列表。

## 运行方式

### 后端

```bash
cd pawmigo-server
cp .env.example .env
docker compose up -d
go run ./cmd/server
```

`.env.example` 中的默认本地配置为：

```text
PORT=8080
MYSQL_DSN=pawmigo:pawmigo@tcp(localhost:3306)/pawmigo?charset=utf8mb4&parseTime=true&loc=Local
REDIS_ADDR=localhost:6379
JWT_SECRET=change-me-in-prod
WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret
```

没有 Docker 时，可手动准备 MySQL 与 Redis，并确保 `MYSQL_DSN`、`REDIS_ADDR` 指向可用实例。当前登录接口会真实调用微信 `code2session`，本地无有效 `WX_APPID` / `WX_SECRET` 时，登录冒烟会返回微信侧错误；这说明链路到外部服务已经走通，不代表内部路由失败。

### 小程序

```bash
cd pawmigo-mini
npm install
npm run dev:weapp
```

微信开发者工具导入 `pawmigo-mini/dist`。本地联调时勾选“不校验合法域名”，并保持后端监听 `http://localhost:8080`。生产域名上线前需要替换 `src/services/request.ts` 中的 `BASE_URL`。

## 测试、构建和检查命令

### 后端

```bash
cd pawmigo-server
go test ./...
go build ./...
go vet ./...
```

仓储和 handler 测试使用 SQLite 内存库，不依赖本地 MySQL。只有运行真实服务时才需要 MySQL / Redis。

### 小程序

```bash
cd pawmigo-mini
npm run typecheck
npm run build:weapp
```

`npm run build:weapp` 会生成 `pawmigo-mini/dist/`，并可能创建 `.swc/`、Taro/SWC 用户级缓存。构建产物和缓存不要提交。

### Lint 状态

当前仓库尚未配置 ESLint、Prettier 或 Go lint 聚合命令。不要在未确认范围时引入新的 lint 工具链。需要静态检查时先使用现有命令：后端 `go vet ./...`，前端 `npm run typecheck`。

## 代码规范

### Go 后端

- 使用 `gofmt` / `go test` 驱动修改；提交前保持 `go test ./...` 通过。
- 保持现有分层：`handler -> service -> repository -> model`。
- handler 只负责 HTTP 绑定、鉴权上下文、状态码和响应；业务规则放在 service。
- repository 只封装持久化访问，不放业务决策。
- 依赖通过构造函数注入；外部服务使用 interface 抽象，便于测试中替换 fake。
- 新增受保护路由必须挂在 JWT middleware 后，并从 `middleware.CtxUserID` 读取用户身份。
- 错误处理要返回明确状态码；权限错误使用 403，未认证使用 401，输入错误使用 400。
- 新增数据库字段时，同步更新 GORM model、migration、相关测试和 API 响应约定。

### Taro 小程序

- 使用 React 函数组件和 TypeScript。
- API 调用统一经过 `src/services/request.ts`，业务接口集中在 `src/services/api.ts`。
- 登录态、用户、宠物列表等跨页面状态放在 Zustand store。
- 页面保持轻量：页面层处理交互和导航，复杂数据逻辑下沉到 services/store，视觉结构优先复用 `src/components/ui.tsx`。
- tab 页面必须在 `src/app.config.ts` 的 `pages` 和 `tabBar.list` 中保持一致。
- 开发环境的“设计系统预览”页面通过 `src/app.config.ts` 条件注册，不要加入 tabBar，不要用于生产业务入口。
- 小程序端不要硬编码真实生产密钥、微信密钥或用户隐私数据。
- 当前 Taro 3.6.34 依赖树需要 `webpack@5.88.2` override；不要随意升级 webpack/Taro，除非重新跑通 `npm run build:weapp`。

## 后续开发注意事项

- 修改视觉风格时，先更新 `app.scss` 令牌或通用组件，再让页面自然继承。
- 设计系统预览页是视觉回归的第一检查点：新增按钮、卡片、表单、标签、布局模式后，应补充一个对应示例。
- 保持 Open Design 原型的视觉语言：高对比、粗边框、硬阴影、强字重、明亮强调色和明确按压反馈。
- 不要引入与当前设计语言冲突的圆角大卡片、弱阴影、低对比灰色按钮或大面积单色渐变。
- 页面响应式优先依赖 Taro 设计宽度转换、flex/grid、固定控件尺寸和可滚动容器，避免使用随视口线性缩放的字体。
- 生产页面不要依赖 `pages/design-system/index.tsx` 的示例数据或开发文案。

## 约束

- 不要提交 `node_modules/`、`dist/`、`.swc/`、`.env`、日志或机器本地缓存。
- 不要覆盖用户未提交的改动；编辑前查看 `git status --short`，只改任务相关文件。
- 网络、依赖安装、Docker、GUI 或用户目录缓存写入可能需要权限；失败后按工具提示申请授权，不要绕过。
- 本项目涉及微信登录和位置能力。不要把 `openid`、`session_key`、真实坐标、JWT secret、微信密钥写入日志、测试快照或提交文件。
- 位置隐私遵循设计文档：真实坐标只用于匹配，不写 MySQL；对外展示必须脱敏。
- 现有 `.codegraph/` 若未初始化，不要假设可用。需要结构化代码检索时，先询问是否运行 `codegraph init -i`。
- 未经用户确认，不要引入大型重构、替换框架、改变公共 API 或改变数据库 schema。

## 完成标准

一个任务完成前至少满足：

- 需求范围内的代码、配置或文档已落地，且无明显占位符、TODO 或未解释的临时实现。
- 后端相关改动通过 `go test ./...`，必要时通过 `go build ./...` 和 `go vet ./...`。
- 小程序相关改动通过 `npm run typecheck`，涉及构建配置或页面入口时通过 `npm run build:weapp`。
- 新增或变更行为有相应测试，或在最终说明中明确无法自动化验证的原因和人工验证路径。
- 本地运行方式、环境变量或依赖变化已同步到文档。
- `git status --short` 中只剩预期变更；生成产物、缓存和密钥未进入版本控制。
- 最终回复说明改了什么、验证了什么、还有哪些未完成或受环境限制的事项。
