import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { test } from 'node:test'

function collectJsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = join(dir, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) return collectJsFiles(filePath)
    return filePath.endsWith('.js') ? [filePath] : []
  })
}

function readDistText(distRoot: string, filePath: string): string {
  const absolutePath = join(distRoot, filePath)
  assert.equal(existsSync(absolutePath), true, `${filePath} must exist in dist`)
  return readFileSync(absolutePath, 'utf8')
}

function assertStyleRule(
  styles: string,
  filePath: string,
  selectorPattern: RegExp,
  declarations: Array<[RegExp, string]>
): void {
  const rules = Array.from(styles.matchAll(new RegExp(`${selectorPattern.source}[^{}]*\\{[^}]*\\}`, 'g')))
    .map((match) => match[0])
  const rule = rules.join('')

  assert.notEqual(rule, '', `${filePath}: expected ${selectorPattern.source} rule to exist`)

  for (const [declarationPattern, message] of declarations) {
    assert.match(rule, declarationPattern, `${filePath}: ${message}`)
  }
}

test('compiled WeChat runtime bundles do not reference Node process at runtime', () => {
  const distRoot = resolve(__dirname, '../../dist')

  assert.equal(existsSync(distRoot), true, 'dist must exist before runtime bundle scan')

  const offenders = collectJsFiles(distRoot).filter((filePath) => {
    const bundle = readFileSync(filePath, 'utf8')
    return /\bprocess(?:\.env)?\b/.test(bundle)
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(distRoot, filePath)),
    []
  )
})

test('compiled WeChat styles keep Stitch proportions, capsule safety, and centered icons', () => {
  const distRoot = resolve(__dirname, '../../dist')

  assert.equal(existsSync(distRoot), true, 'dist must exist before visual style scan')

  const appStyles = readDistText(distRoot, 'app-origin.wxss')

  assert.match(appStyles, /--wechat-capsule-reserve:280rpx/)
  assert.match(appStyles, /\.capsule-safe-appbar\{[^}]*padding-right:280rpx/)
  assert.match(appStyles, /\.capsule-safe-appbar\{[^}]*var\(--wechat-capsule-reserve,280rpx\)/)
  assert.match(appStyles, /--ui-icon-offset:calc\(\(100% - 38rpx\) \/ 2\)/)
  const iconOffsetRule = appStyles.match(/\.ui-icon::(?:before|after),\.ui-icon::(?:before|after)\{[^}]*\}/)?.[0] ?? ''
  assert.match(iconOffsetRule, /\.ui-icon::before/)
  assert.match(iconOffsetRule, /\.ui-icon::after/)
  assert.match(iconOffsetRule, /margin-left:var\(--ui-icon-offset\)/)
  assert.match(iconOffsetRule, /margin-top:var\(--ui-icon-offset\)/)
  assertStyleRule(appStyles, 'app-origin.wxss', /\.settings-switch/, [
    [/width:82rpx/, 'custom settings switch keeps Stitch width'],
    [/height:44rpx/, 'custom settings switch keeps Stitch height']
  ])
  assertStyleRule(appStyles, 'app-origin.wxss', /\.settings-switch__dot/, [
    [/width:32rpx/, 'custom settings switch dot keeps Stitch width'],
    [/height:32rpx/, 'custom settings switch dot keeps Stitch height']
  ])
  assertStyleRule(appStyles, 'app-origin.wxss', /\.settings-switch--active \.settings-switch__dot/, [
    [/left:44rpx/, 'custom settings switch dot slides to Stitch active position']
  ])

  const requirements: Array<{
    filePath: string
    rules: Array<{
      selectorPattern: RegExp
      declarations: Array<[RegExp, string]>
    }>
  }> = [
    {
      filePath: 'pages/feed/index.wxss',
      rules: [
        { selectorPattern: /\.feed-page__appbar/, declarations: [[/min-height:80rpx/, 'feed appbar keeps the enlarged 80rpx visual rhythm']] },
        { selectorPattern: /\.feed-page__pin,\.feed-page__search/, declarations: [[/height:80rpx/, 'feed appbar icons are 80rpx tall'], [/width:80rpx/, 'feed appbar icons are 80rpx wide']] },
        { selectorPattern: /\.feed-page__fab/, declarations: [[/display:flex/, 'feed publish FAB uses flex centering'], [/align-items:center/, 'feed publish FAB centers vertically'], [/justify-content:center/, 'feed publish FAB centers horizontally'], [/height:108rpx/, 'feed publish FAB keeps prototype height'], [/width:108rpx/, 'feed publish FAB keeps prototype width']] },
        { selectorPattern: /\.feed-page__fab-icon/, declarations: [[/height:68rpx/, 'feed publish icon keeps larger visible height'], [/width:68rpx/, 'feed publish icon keeps larger visible width'], [/transform:none/, 'feed publish icon avoids transform-based drifting']] }
      ]
    },
    {
      filePath: 'pages/invite/index.wxss',
      rules: [
        { selectorPattern: /\.invite-page__appbar/, declarations: [[/min-height:80rpx/, 'invite appbar keeps the enlarged 80rpx visual rhythm']] },
        { selectorPattern: /\.invite-page__pin,\.invite-page__search/, declarations: [[/height:80rpx/, 'invite appbar icons are 80rpx tall'], [/width:80rpx/, 'invite appbar icons are 80rpx wide']] },
        { selectorPattern: /\.invite-tab/, declarations: [[/height:76rpx/, 'invite segmented tabs keep prototype height'], [/font-size:28rpx/, 'invite segmented tabs keep prototype text scale']] }
      ]
    },
    {
      filePath: 'pages/mine/index.wxss',
      rules: [
        { selectorPattern: /\.mine-page__appbar/, declarations: [[/height:80rpx/, 'mine appbar keeps the enlarged 80rpx visual rhythm']] },
        { selectorPattern: /\.mine-page__search/, declarations: [[/height:80rpx/, 'mine search icon is 80rpx tall'], [/width:80rpx/, 'mine search icon is 80rpx wide']] },
        { selectorPattern: /\.mine-profile__badge-icon/, declarations: [[/height:44rpx/, 'mine profile badge icon keeps a full centered box'], [/width:44rpx/, 'mine profile badge icon keeps a full centered box']] },
        { selectorPattern: /\.mine-profile__location-icon/, declarations: [[/height:44rpx/, 'mine location icon keeps a full centered box'], [/width:44rpx/, 'mine location icon keeps a full centered box']] },
        { selectorPattern: /\.mine-pet-strip__active-badge/, declarations: [[/height:34rpx/, 'mine active pet badge avoids tiny text'], [/font-size:20rpx/, 'mine active pet badge keeps readable text scale']] },
        { selectorPattern: /\.mine-menu__icon/, declarations: [[/flex:0 0 80rpx/, 'mine menu icons reserve 80rpx row space'], [/height:80rpx/, 'mine menu icons are 80rpx tall'], [/width:80rpx/, 'mine menu icons are 80rpx wide']] },
        { selectorPattern: /\.mine-quick-actions__button/, declarations: [[/height:96rpx/, 'mine quick actions are not the older compact buttons']] }
      ]
    },
    {
      filePath: 'subpackages/invite/create/index.wxss',
      rules: [
        { selectorPattern: /\.create-invite__topbar/, declarations: [[/padding:88rpx 280rpx 0 40rpx/, 'invite creation topbar reserves the WeChat capsule area']] },
        { selectorPattern: /\.create-invite__back,\.create-invite__more/, declarations: [[/height:80rpx/, 'invite creation topbar controls are 80rpx tall'], [/width:80rpx/, 'invite creation topbar controls are 80rpx wide']] },
        { selectorPattern: /\.create-invite__my-pet-picker/, declarations: [[/--ui-icon-offset:17rpx/, 'invite creation selector icon uses centered offset'], [/height:72rpx/, 'invite creation selector is 72rpx tall'], [/width:72rpx/, 'invite creation selector is 72rpx wide']] },
        { selectorPattern: /\.create-invite__submit-icon/, declarations: [[/height:44rpx/, 'invite creation submit icon keeps visible height'], [/width:44rpx/, 'invite creation submit icon keeps visible width']] }
      ]
    },
    {
      filePath: 'subpackages/invite/detail/index.wxss',
      rules: [
        { selectorPattern: /\.invite-detail__topbar/, declarations: [[/padding:88rpx 280rpx 0 40rpx/, 'invite detail topbar reserves the WeChat capsule area']] },
        { selectorPattern: /\.invite-detail__back,\.invite-detail__share/, declarations: [[/height:80rpx/, 'invite detail topbar controls are 80rpx tall'], [/width:80rpx/, 'invite detail topbar controls are 80rpx wide']] },
        { selectorPattern: /\.invite-detail__info-icon/, declarations: [[/--ui-icon-offset:21rpx/, 'invite detail info icons use centered offset'], [/height:80rpx/, 'invite detail info icons are 80rpx tall'], [/width:80rpx/, 'invite detail info icons are 80rpx wide']] },
        { selectorPattern: /\.invite-detail__pet-tag/, declarations: [[/min-height:44rpx/, 'invite detail pet tags avoid tiny chip height'], [/font-size:20rpx/, 'invite detail pet tags keep readable text scale']] },
        { selectorPattern: /\.invite-detail__stat-label/, declarations: [[/font-size:20rpx/, 'invite detail stat labels avoid tiny text']] }
      ]
    },
    {
      filePath: 'subpackages/pet/detail/index.wxss',
      rules: [
        { selectorPattern: /\.pet-detail__nav/, declarations: [[/right:280rpx/, 'pet detail floating nav has hard capsule reserve'], [/var\(--wechat-capsule-reserve,280rpx\)/, 'pet detail floating nav uses shared capsule reserve']] },
        { selectorPattern: /\.pet-detail__nav-button/, declarations: [[/height:80rpx/, 'pet detail floating nav buttons are 80rpx tall'], [/width:80rpx/, 'pet detail floating nav buttons are 80rpx wide']] }
      ]
    },
    {
      filePath: 'subpackages/settings/privacy/index.wxss',
      rules: [
        { selectorPattern: /\.privacy-page__topbar/, declarations: [[/grid-template-columns:100rpx 1fr 100rpx/, 'privacy topbar uses 100rpx side columns']] },
        { selectorPattern: /\.privacy-page__back/, declarations: [[/height:80rpx/, 'privacy back control is 80rpx tall'], [/width:80rpx/, 'privacy back control is 80rpx wide']] },
        { selectorPattern: /\.privacy-safety-card__icon/, declarations: [[/height:80rpx/, 'privacy safety icon keeps card height'], [/width:80rpx/, 'privacy safety icon keeps card width']] },
        { selectorPattern: /\.privacy-shield__copy/, declarations: [[/font-size:20rpx/, 'privacy footer copy avoids tiny text']] },
        { selectorPattern: /\.privacy-shield__version/, declarations: [[/font-size:20rpx/, 'privacy version avoids tiny text']] }
      ]
    },
    {
      filePath: 'subpackages/settings/report/index.wxss',
      rules: [
        { selectorPattern: /\.report-page__topbar/, declarations: [[/grid-template-columns:100rpx 1fr 100rpx/, 'report topbar uses 100rpx side columns']] },
        { selectorPattern: /\.report-page__back/, declarations: [[/height:80rpx/, 'report back control is 80rpx tall'], [/width:80rpx/, 'report back control is 80rpx wide']] },
        { selectorPattern: /\.report-target-card__badge/, declarations: [[/height:36rpx/, 'report badge avoids tiny text height'], [/font-size:20rpx/, 'report badge keeps readable text scale']] },
        { selectorPattern: /\.report-target-card__desc/, declarations: [[/font-size:22rpx/, 'report target description keeps readable scale']] },
        { selectorPattern: /\.report-evidence__plus/, declarations: [[/height:56rpx/, 'report evidence icon keeps upload height'], [/width:56rpx/, 'report evidence icon keeps upload width']] }
      ]
    },
    {
      filePath: 'subpackages/settings/block/index.wxss',
      rules: [
        { selectorPattern: /\.block-page__topbar/, declarations: [[/grid-template-columns:100rpx 1fr 100rpx/, 'block-list topbar uses 100rpx side columns']] },
        { selectorPattern: /\.block-page__back/, declarations: [[/height:80rpx/, 'block-list back control is 80rpx tall'], [/width:80rpx/, 'block-list back control is 80rpx wide']] },
        { selectorPattern: /\.block-safety-card__icon/, declarations: [[/height:80rpx/, 'block-list safety icon keeps card height'], [/width:80rpx/, 'block-list safety icon keeps card width']] },
        { selectorPattern: /\.block-item__avatar-mask/, declarations: [[/height:56rpx/, 'block-list blocked-avatar mask is visible'], [/width:56rpx/, 'block-list blocked-avatar mask is visible']] },
        { selectorPattern: /\.block-item__status/, declarations: [[/font-size:20rpx/, 'block status chip avoids tiny text']] }
      ]
    },
    {
      filePath: 'subpackages/pet/manage/index.wxss',
      rules: [
        { selectorPattern: /\.pet-manage__topbar/, declarations: [[/grid-template-columns:100rpx 1fr 128rpx/, 'pet management topbar uses larger side columns']] },
        { selectorPattern: /\.pet-manage__back/, declarations: [[/height:80rpx/, 'pet management back control is 80rpx tall'], [/width:80rpx/, 'pet management back control is 80rpx wide']] },
        { selectorPattern: /\.pet-manage__visibility-icon/, declarations: [[/height:56rpx/, 'pet management visibility icon keeps row height'], [/width:56rpx/, 'pet management visibility icon keeps row width']] },
        { selectorPattern: /\.pet-manage__toggle/, declarations: [[/height:44rpx/, 'pet management visibility switch keeps Stitch height'], [/width:82rpx/, 'pet management visibility switch keeps Stitch width']] },
        { selectorPattern: /\.pet-manage__manage-row/, declarations: [[/min-height:62rpx/, 'pet management lightweight action row avoids oversized button bar']] }
      ]
    },
    {
      filePath: 'subpackages/pet/create/index.wxss',
      rules: [
        { selectorPattern: /\.create-pet__back,\.create-pet__spacer/, declarations: [[/height:80rpx/, 'create-pet topbar controls are 80rpx tall'], [/width:80rpx/, 'create-pet topbar controls are 80rpx wide']] },
        { selectorPattern: /\.create-pet__camera/, declarations: [[/height:72rpx/, 'create-pet camera affordance keeps avatar-control height'], [/width:72rpx/, 'create-pet camera affordance keeps avatar-control width']] }
      ]
    },
    {
      filePath: 'subpackages/pet/edit/index.wxss',
      rules: [
        { selectorPattern: /\.edit-pet__topbar/, declarations: [[/grid-template-columns:100rpx 1fr 100rpx/, 'pet edit topbar uses 100rpx side columns']] },
        { selectorPattern: /\.edit-pet__back,\.edit-pet__spacer/, declarations: [[/height:80rpx/, 'pet edit topbar controls are 80rpx tall'], [/width:80rpx/, 'pet edit topbar controls are 80rpx wide']] },
        { selectorPattern: /\.edit-pet__switch-desc/, declarations: [[/font-size:22rpx/, 'pet edit switch helper copy keeps readable scale']] }
      ]
    },
    {
      filePath: 'subpackages/post/create/index.wxss',
      rules: [
        { selectorPattern: /\.create-post__close,\.create-post__spacer/, declarations: [[/height:80rpx/, 'create-post topbar controls are 80rpx tall'], [/width:80rpx/, 'create-post topbar controls are 80rpx wide']] },
        { selectorPattern: /\.create-post__add-icon/, declarations: [[/height:56rpx/, 'create-post upload icon keeps upload height'], [/width:56rpx/, 'create-post upload icon keeps upload width']] },
        { selectorPattern: /\.create-post__submit-icon/, declarations: [[/height:48rpx/, 'create-post submit icon keeps visible height'], [/width:48rpx/, 'create-post submit icon keeps visible width']] }
      ]
    },
    {
      filePath: 'subpackages/post/detail/index.wxss',
      rules: [
        { selectorPattern: /\.post-detail__topbar/, declarations: [[/padding:88rpx 280rpx 0 40rpx/, 'post detail topbar reserves the WeChat capsule area']] },
        { selectorPattern: /\.post-detail__back,\.post-detail__more/, declarations: [[/height:80rpx/, 'post detail topbar controls are 80rpx tall'], [/width:80rpx/, 'post detail topbar controls are 80rpx wide']] }
      ]
    }
  ]

  for (const { filePath, rules } of requirements) {
    const styles = readDistText(distRoot, filePath)

    for (const { selectorPattern, declarations } of rules) {
      assertStyleRule(styles, filePath, selectorPattern, declarations)
    }
  }
})

test('compiled WeChat styles do not contain stale compact navigation measurements', () => {
  const distRoot = resolve(__dirname, '../../dist')
  const criticalFiles = [
    'app-origin.wxss',
    'pages/feed/index.wxss',
    'pages/invite/index.wxss',
    'pages/mine/index.wxss',
    'subpackages/invite/create/index.wxss',
    'subpackages/invite/detail/index.wxss',
    'subpackages/pet/detail/index.wxss',
    'subpackages/settings/privacy/index.wxss',
    'subpackages/settings/report/index.wxss',
    'subpackages/settings/block/index.wxss',
    'subpackages/pet/manage/index.wxss',
    'subpackages/pet/create/index.wxss',
    'subpackages/pet/edit/index.wxss',
    'subpackages/post/create/index.wxss',
    'subpackages/post/detail/index.wxss'
  ]

  const stalePatterns: Array<[RegExp, string]> = [
    [/padding:88rpx 232rpx/, 'old 232rpx capsule padding'],
    [/right:232rpx/, 'old 232rpx capsule right reserve'],
    [/grid-template-columns:84rpx/, 'old 84rpx secondary topbar side column'],
    [/(?:height:64rpx[^}]*width:64rpx|width:64rpx[^}]*height:64rpx)/, 'old 64rpx icon touch target']
  ]

  for (const filePath of criticalFiles) {
    const styles = readDistText(distRoot, filePath)

    for (const [pattern, message] of stalePatterns) {
      assert.doesNotMatch(styles, pattern, `${filePath} still contains ${message}`)
    }
  }
})

test('compiled Taro runtime API calls do not use callable default-import wrappers', () => {
  const distRoot = resolve(__dirname, '../../dist')

  assert.equal(existsSync(distRoot), true, 'dist must exist before runtime bundle scan')

  const runtimeApis = [
    'getStorageSync',
    'setStorageSync',
    'removeStorageSync',
    'navigateTo',
    'navigateBack',
    'switchTab',
    'reLaunch',
    'showToast',
    'login'
  ]
  const callableWrapperPattern = new RegExp(
    String.raw`\b[a-zA-Z_$][\w$]*\(\)\.(?:${runtimeApis.join('|')})\b`
  )

  const offenders = collectJsFiles(distRoot).filter((filePath) => {
    const bundle = readFileSync(filePath, 'utf8')
    return callableWrapperPattern.test(bundle)
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(distRoot, filePath)),
    []
  )
})
