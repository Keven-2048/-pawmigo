import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { test } from 'node:test'

function collectFiles(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = join(dir, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) return collectFiles(filePath, pattern)
    return pattern.test(filePath) ? [filePath] : []
  })
}

function stripUseMockCalls(source: string) {
  let output = ''
  let index = 0

  while (index < source.length) {
    if (source.startsWith('useMock(', index)) {
      index += 'useMock('.length
      let depth = 1

      while (index < source.length && depth > 0) {
        const char = source[index]
        if (char === '(') depth += 1
        if (char === ')') depth -= 1
        index += 1
      }

      output += 'useMock()'
      continue
    }

    output += source[index]
    index += 1
  }

  return output
}

function findMissingHardVisualFallbacks(filePath: string): string[] {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  const tokenDeclarationPattern =
    /^\s*(color|background|background-color|box-shadow|border|border-color|border-top|border-bottom|border-left|border-right|border-top-color|border-bottom-color|border-left-color|border-right-color):\s*.*var\(--(?:color|shadow)-/

  return lines.flatMap((line, index) => {
    const match = line.match(tokenDeclarationPattern)
    if (!match) return []

    const property = match[1]
    let previousIndex = index - 1
    while (previousIndex >= 0 && lines[previousIndex].trim() === '') previousIndex -= 1

    const previous = previousIndex >= 0 ? lines[previousIndex] : ''
    const previousDeclaration = previous.trim()
    const hasHardFallback =
      previousDeclaration.startsWith(`${property}:`) &&
      !previousDeclaration.includes('var(') &&
      previousDeclaration.endsWith(';')

    return hasHardFallback ? [] : [`${filePath}:${index + 1} ${line.trim()}`]
  })
}

test('pages and stores depend on service layer instead of mock internals', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const checkedRoots = ['pages', 'subpackages', 'store'].map((dir) => join(srcRoot, dir))
  const offenders = checkedRoots
    .flatMap((dir) => collectFiles(dir, /\.(ts|tsx)$/))
    .filter((filePath) => {
      const source = readFileSync(filePath, 'utf8')
      return /services\/mock|mockApi|from ['"]@\/services\/mock/.test(source)
    })

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
})

test('service layer switches between mock and remote adapters only at the service boundary', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const source = readFileSync(join(srcRoot, 'services/index.ts'), 'utf8')
  const mockAdapter = readFileSync(join(srcRoot, 'services/mock/index.ts'), 'utf8')
  const remoteAdapter = readFileSync(join(srcRoot, 'services/remote/index.ts'), 'utf8')

  assert.match(source, /createServicesForMode/)
  assert.match(source, /mode === 'mock'[\s\S]*createMockServices\(\)/)
  assert.match(source, /mode === 'remote'[\s\S]*createRemoteServices\(createRemoteClient\(baseUrl\)\)/)
  assert.match(source, /Unsupported TARO_APP_API_MODE/)
  assert.equal(stripUseMockCalls(source).includes('mockApi.'), false)
  assert.match(mockAdapter, /mockApi\./)
  assert.match(remoteAdapter, /\/api\/v1|\/auth\/wechat-login|\/nearby\/pets/)
})

test('protected pages install the shared auth guard', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const pageFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.tsx$/),
    ...collectFiles(join(srcRoot, 'subpackages'), /index\.tsx$/)
  ]
  const publicPages = new Set([
    'pages/login/index.tsx'
  ])
  const offenders = pageFiles.filter((filePath) => {
    const pagePath = relative(srcRoot, filePath)
    if (publicPages.has(pagePath)) return false
    return !readFileSync(filePath, 'utf8').includes('useAuthGuard')
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
})

test('all rendered MVP pages use custom navigation to avoid duplicate WeChat top bars', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const appConfigSource = readFileSync(join(srcRoot, 'app.config.ts'), 'utf8')
  const configFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.config\.ts$/),
    ...collectFiles(join(srcRoot, 'subpackages'), /index\.config\.ts$/)
  ]
  const offenders = configFiles.filter((filePath) => {
    const source = readFileSync(filePath, 'utf8')
    return !source.includes("navigationStyle: 'custom'")
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
  assert.equal(appConfigSource.includes("navigationStyle: 'custom'"), true)
})

test('handoff README reflects implemented MVP instead of stale scaffold state', () => {
  const repoRoot = resolve(__dirname, '../../../..')
  const readmeSource = readFileSync(join(repoRoot, 'README.md'), 'utf8')

  assert.equal(readmeSource.includes('## Current Development State'), true)
  assert.equal(readmeSource.includes('The Taro mini-program MVP has been scaffolded'), true)
  assert.equal(readmeSource.includes('The next product implementation step is to scaffold'), false)
})

test('pages with service or store mutations expose user-friendly error handling', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const pageFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.tsx$/),
    ...collectFiles(join(srcRoot, 'subpackages'), /index\.tsx$/)
  ]
  const mutationPattern = /\.(create|update|delete|setDefault|like|unlike|accept|reject|cancel|createComment|deleteComment|updatePrivacy|createBlock)\(/
  const offenders = pageFiles.filter((filePath) => {
    const source = readFileSync(filePath, 'utf8')
    if (!mutationPattern.test(source)) return false
    return !source.includes('catch (error)') || !source.includes('showToast(error instanceof Error ? error.message')
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
})

test('high-risk page actions keep explicit failure feedback paths', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/post/detail/index.tsx',
      patterns: [
        /const toggleLike = async \(\) => \{[\s\S]*catch \(error\)[\s\S]*showToast\(error instanceof Error \? error\.message : '操作失败'\)[\s\S]*\}/,
        /const deletePost = async \(\) => \{[\s\S]*catch \(error\)[\s\S]*showToast\(error instanceof Error \? error\.message : '删除失败'\)[\s\S]*\}/
      ]
    },
    {
      file: 'subpackages/pet/manage/index.tsx',
      patterns: [
        /const makeDefault = async \(id: number\) => \{[\s\S]*catch \(error\)[\s\S]*showToast\(error instanceof Error \? error\.message : '设置失败'\)[\s\S]*\}/
      ]
    },
    {
      file: 'subpackages/settings/privacy/index.tsx',
      patterns: [
        /const save = async \(\) => \{[\s\S]*catch \(error\)[\s\S]*showToast\(error instanceof Error \? error\.message : '保存失败'\)[\s\S]*\}/
      ]
    },
    {
      file: 'subpackages/settings/block/index.tsx',
      patterns: [
        /blockService\.list\(\)[\s\S]*catch \(error\)[\s\S]*showToast\(error instanceof Error \? error\.message : '黑名单加载失败'\)/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('page bootstrap data loads keep explicit failure feedback paths', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/nearby/index.tsx',
      patterns: [
        /loadPets\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '宠物档案加载失败'\)/
      ]
    },
    {
      file: 'pages/mine/index.tsx',
      patterns: [
        /hydrate\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '用户信息加载失败'\)/,
        /loadPets\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '宠物档案加载失败'\)/
      ]
    },
    {
      file: 'subpackages/post/create/index.tsx',
      patterns: [
        /loadPets\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '宠物档案加载失败'\)/
      ]
    },
    {
      file: 'subpackages/pet/manage/index.tsx',
      patterns: [
        /loadPets\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '宠物档案加载失败'\)/
      ]
    },
    {
      file: 'subpackages/settings/privacy/index.tsx',
      patterns: [
        /hydrate\(\)[\s\S]*catch[\s\S]*error[\s\S]*showToast\(error instanceof Error \? error\.message : '隐私设置加载失败'\)/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('form submit pages guard against duplicate submissions with loading state', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const submitPages: Array<{ file: string; flag: 'submitting' | 'saving'; disabledPattern?: RegExp }> = [
    { file: 'pages/login/index.tsx', flag: 'submitting', disabledPattern: /ui-button--disabled/ },
    { file: 'subpackages/pet/create/index.tsx', flag: 'submitting' },
    { file: 'subpackages/pet/edit/index.tsx', flag: 'saving' },
    { file: 'subpackages/post/create/index.tsx', flag: 'submitting' },
    { file: 'subpackages/invite/create/index.tsx', flag: 'submitting' },
    { file: 'subpackages/settings/report/index.tsx', flag: 'submitting' },
    { file: 'subpackages/settings/privacy/index.tsx', flag: 'saving' }
  ]
  const offenders = submitPages.filter(({ file, flag, disabledPattern }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return !source.includes(`if (${flag}) return`) || !(disabledPattern || new RegExp(`disabled=\\{${flag}\\}`)).test(source)
  })

  assert.deepEqual(offenders.map(({ file }) => file), [])
})

test('invite action pages guard against duplicate processing with disabled buttons', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/invite/index.tsx',
      patterns: [
        /const \[processingId, setProcessingId\] = useState<number \| undefined>/,
        /if \(processingId\) return/,
        /processing=\{processingId === invite\.id\}/
      ]
    },
    {
      file: 'subpackages/invite/detail/index.tsx',
      patterns: [
        /const \[processing, setProcessing\] = useState\(false\)/,
        /if \(processing\) return/,
        /disabled=\{processing\}/
      ]
    },
    {
      file: 'subpackages/pet/manage/index.tsx',
      patterns: [
        /const removePet = async \(id: number\) => \{[\s\S]*if \(busyId\) return/,
        /disabled=\{busyId === pet\.id\}/,
        /const toggleVisibility = async \(pet: Pet\) => \{[\s\S]*if \(busyId\) return/
      ]
    },
    {
      file: 'components/InviteCard/index.tsx',
      patterns: [
        /processing\?: boolean/,
        /ui-button--disabled/,
        /if \(!processing\)/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('post detail comment submission guards against duplicate sends', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const source = readFileSync(join(srcRoot, 'subpackages/post/detail/index.tsx'), 'utf8')
  const style = readFileSync(join(srcRoot, 'subpackages/post/detail/index.scss'), 'utf8')

  assert.equal(source.includes('const [commenting, setCommenting] = useState(false)'), true)
  assert.match(source, /const submitComment = async \(\) => \{[\s\S]*if \(commenting\) return/)
  assert.equal(source.includes('setCommenting(true)'), true)
  assert.equal(source.includes('setCommenting(false)'), true)
  assert.equal(source.includes("comment-input__send--disabled"), true)
  assert.match(style, /\.comment-input__send--disabled\s*\{[\s\S]*pointer-events:\s*none/)
})

test('app imports only the NutUI component styles used by the MVP', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const appSource = readFileSync(join(srcRoot, 'app.tsx'), 'utf8')

  assert.equal(appSource.includes('@nutui/nutui-react-taro/dist/style.css'), false)
  assert.equal(appSource.includes('@nutui/nutui-react-taro/dist/es/packages/button/style/css'), true)
  assert.equal(appSource.includes('@nutui/nutui-react-taro/dist/es/packages/popup/style/css'), true)
})

test('app code imports NutUI components through the local wrapper', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const sourceFiles = collectFiles(srcRoot, /\.(ts|tsx)$/)
  const offenders = sourceFiles.filter((filePath) => {
    const source = readFileSync(filePath, 'utf8')
    return /from ['"]@nutui\/nutui-react-taro['"]/.test(source)
  })

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
})

test('shared component styles are imported once from app stylesheet', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const appStyle = readFileSync(join(srcRoot, 'app.scss'), 'utf8')
  const componentStyleFiles = collectFiles(join(srcRoot, 'components'), /index\.scss$/)
  const componentTsxFiles = collectFiles(join(srcRoot, 'components'), /index\.tsx$/)

  const missingGlobalImports = componentStyleFiles.filter((filePath) => {
    const importPath = `@use './${relative(srcRoot, filePath).replace(/\\/g, '/')}' as *;`
    return !appStyle.includes(importPath)
  })
  const localStyleImports = componentTsxFiles.filter((filePath) =>
    readFileSync(filePath, 'utf8').includes("import './index.scss'")
  )

  assert.deepEqual(
    {
      missingGlobalImports: missingGlobalImports.map((filePath) => relative(srcRoot, filePath)),
      localStyleImports: localStyleImports.map((filePath) => relative(srcRoot, filePath))
    },
    {
      missingGlobalImports: [],
      localStyleImports: []
    }
  )
})

test('css minimizer skips calc optimization for NutUI rpx css variables', () => {
  const configSource = readFileSync(resolve(__dirname, '../../config/index.ts'), 'utf8')

  assert.match(configSource, /csso:\s*\{[\s\S]*config:\s*\{[\s\S]*calc:\s*false/)
})

test('pages parse route params through shared route utilities', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const pageFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.tsx$/),
    ...collectFiles(join(srcRoot, 'subpackages'), /index\.tsx$/)
  ]
  const numberRouteOffenders = pageFiles.filter((filePath) => {
    const source = readFileSync(filePath, 'utf8')
    return /Number\(router\.params/.test(source)
  })
  const reportSource = readFileSync(join(srcRoot, 'subpackages/settings/report/index.tsx'), 'utf8')

  assert.deepEqual(numberRouteOffenders.map((filePath) => relative(srcRoot, filePath)), [])
  assert.equal(reportSource.includes('isReportTargetType'), true)
})

test('core MVP screens keep Stitch prototype alignment anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')
  const loginSource = readFileSync(join(srcRoot, 'pages/login/index.tsx'), 'utf8')
  const createPetSource = readFileSync(join(srcRoot, 'subpackages/pet/create/index.tsx'), 'utf8')
  const nearbySource = readFileSync(join(srcRoot, 'pages/nearby/index.tsx'), 'utf8')
  const petCardSource = readFileSync(join(srcRoot, 'components/PetCard/index.tsx'), 'utf8')

  assert.match(themeSource, /--font-display:\s*"Plus Jakarta Sans"/)
  assert.match(themeSource, /--font-body:\s*"Be Vietnam Pro"/)
  assert.match(themeSource, /--shadow-card:\s*0 8px 40px rgba\(118,\s*185,\s*71,\s*0\.08\)/)

  assert.equal(loginSource.includes('login-page__brand-mark'), true)
  assert.equal(loginSource.includes('login-page__montage'), true)
  assert.equal(loginSource.includes('login-page__floating-tag'), true)
  assert.equal(loginSource.includes('login-page__agreement'), true)
  assert.equal(loginSource.includes('agreeProtocol'), true)
  assert.equal(loginSource.includes('请先阅读并同意用户服务协议与隐私政策'), true)

  assert.equal(createPetSource.includes('create-pet__topbar'), true)
  assert.equal(createPetSource.includes('create-pet__avatar-upload'), true)
  assert.equal(createPetSource.includes('create-pet__camera ui-icon ui-icon--camera'), true)
  assert.equal(createPetSource.includes('create-pet__field-grid'), true)
  assert.equal(createPetSource.includes('体重 (kg)'), true)
  assert.equal(createPetSource.includes('form-section-title__icon ui-icon ui-icon--face'), true)
  assert.equal(createPetSource.includes('form-section-title__icon ui-icon ui-icon--star'), true)
  assert.equal(createPetSource.includes('create-pet__sticky-submit'), true)
  assert.equal(createPetSource.includes('submit-button__icon ui-icon ui-icon--rocket'), true)

  assert.equal(nearbySource.includes('nearby-page__location-bar'), true)
  assert.equal(nearbySource.includes('nearby-search'), true)
  assert.equal(nearbySource.includes('nearby-quick-filters'), true)
  assert.equal(nearbySource.includes('搜索宠物名字或品种'), true)

  assert.equal(petCardSource.includes('pet-card__status'), true)
  assert.equal(petCardSource.includes('pet-card__view'), true)
})

test('pet profile and invite creation keep Stitch flow alignment anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const petDetailSource = readFileSync(join(srcRoot, 'subpackages/pet/detail/index.tsx'), 'utf8')
  const createPostSource = readFileSync(join(srcRoot, 'subpackages/post/create/index.tsx'), 'utf8')
  const createInviteSource = readFileSync(join(srcRoot, 'subpackages/invite/create/index.tsx'), 'utf8')

  assert.equal(petDetailSource.includes('pet-detail__nav'), true)
  assert.equal(petDetailSource.includes('pet-detail__floating-avatar'), true)
  assert.equal(petDetailSource.includes('pet-detail__owner-strip'), true)
  assert.equal(petDetailSource.includes('pet-detail__metric-grid'), true)
  assert.equal(petDetailSource.includes('pet-detail__bottom-actions'), true)
  assert.equal(petDetailSource.includes('发起邀请'), true)
  assert.equal(petDetailSource.includes('getPetDetailActions'), true)
  assert.equal(petDetailSource.includes('/subpackages/post/create/index?petId=${pet.id}'), true)
  assert.equal(createPostSource.includes('parseRouteId(router.params.petId)'), true)
  assert.equal(createPostSource.includes('pickCurrentPet(routePetId)'), true)
  assert.equal(createPostSource.includes('pets.some((pet) => pet.id === routePetId)'), true)

  assert.equal(createInviteSource.includes('create-invite__topbar'), true)
  assert.equal(createInviteSource.includes('create-invite__target-card'), true)
  assert.equal(createInviteSource.includes('create-invite__my-pet-card'), true)
  assert.equal(createInviteSource.includes('create-invite__type-grid'), true)
  assert.equal(createInviteSource.includes("const inviteTypes: InviteType[] = ['walk', 'play', 'park', 'coffee', 'custom']"), true)
  assert.equal(createInviteSource.includes("custom: '自定义'"), true)
  assert.equal(createInviteSource.includes('create-invite__schedule-card'), true)
  assert.equal(createInviteSource.includes('create-invite__safety'), true)
  assert.equal(createInviteSource.includes('create-invite__safety-icon ui-icon ui-icon--shield'), true)
  assert.equal(createInviteSource.includes('create-invite__sticky-submit'), true)
  assert.equal(createInviteSource.includes('create-invite__submit-icon ui-icon ui-icon--send'), true)
  assert.equal(createInviteSource.includes('安全贴士'), true)
  assert.equal(createInviteSource.includes('/subpackages/settings/report/index?targetType=pet&targetId=${toPetId}'), true)
})

test('invite list and detail keep Stitch transaction alignment anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const inviteListSource = readFileSync(join(srcRoot, 'pages/invite/index.tsx'), 'utf8')
  const inviteDetailSource = readFileSync(join(srcRoot, 'subpackages/invite/detail/index.tsx'), 'utf8')
  const inviteCardSource = readFileSync(join(srcRoot, 'components/InviteCard/index.tsx'), 'utf8')

  assert.equal(inviteListSource.includes('invite-page__appbar'), true)
  assert.equal(inviteListSource.includes('invite-filter-chips'), true)
  assert.equal(inviteListSource.includes('statusFilter'), true)

  assert.equal(inviteCardSource.includes('invite-card__avatars'), true)
  assert.equal(inviteCardSource.includes('invite-card__schedule'), true)
  assert.equal(inviteCardSource.includes('invite-card__detail-button'), true)
  assert.equal(inviteCardSource.includes('接受邀请'), true)

  assert.equal(inviteDetailSource.includes('invite-detail__topbar'), true)
  assert.equal(inviteDetailSource.includes('invite-detail__status-strip'), true)
  assert.equal(inviteDetailSource.includes('invite-detail__match-card'), true)
  assert.equal(inviteDetailSource.includes('invite-detail__arrangement'), true)
  assert.equal(inviteDetailSource.includes('invite-detail__safety-card'), true)
  assert.equal(inviteDetailSource.includes('invite-detail__bottom-actions'), true)
  assert.equal(inviteDetailSource.includes('宠友安全提示'), true)
})

test('feed and post flow keep Stitch social alignment anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const feedSource = readFileSync(join(srcRoot, 'pages/feed/index.tsx'), 'utf8')
  const postCardSource = readFileSync(join(srcRoot, 'components/PostCard/index.tsx'), 'utf8')
  const createPostSource = readFileSync(join(srcRoot, 'subpackages/post/create/index.tsx'), 'utf8')
  const postDetailSource = readFileSync(join(srcRoot, 'subpackages/post/detail/index.tsx'), 'utf8')

  assert.equal(feedSource.includes('feed-page__appbar'), true)
  assert.equal(feedSource.includes('feed-tabs--underline'), true)
  assert.equal(feedSource.includes('feed-page__fab'), true)
  assert.equal(feedSource.includes('ChongYouQuan'), true)

  assert.equal(postCardSource.includes('post-card__more'), true)
  assert.equal(postCardSource.includes('post-card__location-pill'), true)
  assert.equal(postCardSource.includes('post-card__share'), true)
  assert.equal(postCardSource.includes('分享'), true)

  assert.equal(createPostSource.includes('create-post__topbar'), true)
  assert.equal(createPostSource.includes('create-post__identity-card'), true)
  assert.equal(createPostSource.includes('create-post__identity-avatar-wrap'), true)
  assert.equal(createPostSource.includes('create-post__identity-badge ui-icon ui-icon--swap'), true)
  assert.equal(createPostSource.includes('create-post__photo-grid'), true)
  assert.equal(createPostSource.includes('create-post__utility-row'), true)
  assert.equal(createPostSource.includes('create-post__utility-input'), true)
  assert.equal(createPostSource.includes('create-post__visibility-grid'), true)
  assert.equal(createPostSource.includes("public: 'globe'"), true)
  assert.equal(createPostSource.includes('create-post__visibility-title-icon ui-icon ui-icon--visibility'), true)
  assert.equal(createPostSource.includes('create-post__utility-icon ui-icon ui-icon--tag'), true)
  assert.equal(createPostSource.includes('create-post__visibility-icon ui-icon'), true)
  assert.equal(createPostSource.includes('visibilityIcons'), true)
  assert.equal(createPostSource.includes('ui-icon--send'), true)
  assert.equal(createPostSource.includes('正在以宠物身份发布'), true)

  assert.equal(postDetailSource.includes('post-detail__topbar'), true)
  assert.equal(postDetailSource.includes('post-detail__article-card'), true)
  assert.equal(postDetailSource.includes('post-detail__image-grid'), true)
  assert.equal(postDetailSource.includes('post-detail__comment-bubble'), true)
  assert.equal(postDetailSource.includes('post-detail__bottom-input'), true)
  assert.equal(postDetailSource.includes('说点友好的回应'), true)
  assert.equal(postDetailSource.includes('postService, blockService'), true)
  assert.equal(postDetailSource.includes('const blockAuthor = async () =>'), true)
  assert.equal(postDetailSource.includes("await blockService.create(post.userId, '不想再看到该作者内容')"), true)
  assert.equal(postDetailSource.includes('拉黑作者'), true)
  assert.equal(postDetailSource.includes('举报评论'), true)
  assert.equal(postDetailSource.includes('/subpackages/settings/report/index?targetType=comment&targetId=${comment.id}'), true)
  assert.equal(postDetailSource.includes('<Text>回应</Text>'), false)
  assert.equal(postDetailSource.includes('<Text>喜欢</Text>'), false)
})

test('mine, pet management, privacy, and report keep Stitch account anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const mineSource = readFileSync(join(srcRoot, 'pages/mine/index.tsx'), 'utf8')
  const petManageSource = readFileSync(join(srcRoot, 'subpackages/pet/manage/index.tsx'), 'utf8')
  const privacySource = readFileSync(join(srcRoot, 'subpackages/settings/privacy/index.tsx'), 'utf8')
  const reportSource = readFileSync(join(srcRoot, 'subpackages/settings/report/index.tsx'), 'utf8')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')

  assert.equal(mineSource.includes('mine-page__appbar'), true)
  assert.equal(mineSource.includes('ChongYouQuan'), true)
  assert.equal(mineSource.includes('mine-stats'), true)
  assert.equal(mineSource.includes('mine-pet-strip'), true)
  assert.equal(mineSource.includes('mine-quick-actions'), true)
  assert.equal(mineSource.includes('我的萌宠'), true)
  assert.equal(mineSource.includes('关注'), true)
  assert.equal(mineSource.includes('粉丝'), true)
  assert.equal(mineSource.includes('邀请'), true)
  assert.equal(mineSource.includes('获赞'), false)
  assert.equal(mineSource.includes('邀约'), false)
  assert.equal(mineSource.includes('mine-pet-strip__active-badge'), true)
  assert.equal(mineSource.includes('ACTIVE'), true)
  assert.equal(mineSource.includes('切换主宠'), true)
  assert.equal(mineSource.includes('宠书管理'), true)
  assert.equal(mineSource.includes('我的爱宠清单'), true)
  assert.equal(mineSource.includes('宠圈精彩动态'), true)
  assert.equal(mineSource.includes('特别关注列表'), true)
  assert.equal(mineSource.includes('消息与通知中心'), true)
  assert.equal(mineSource.includes('退出当前账号'), true)
  assert.equal(mineSource.includes('status?: string'), true)
  assert.equal(mineSource.includes("status: '即将开放'"), true)
  assert.equal(mineSource.includes('mine-menu__item--static'), true)
  assert.equal(mineSource.includes('item.url || item.tabUrl'), true)
  assert.equal(mineSource.includes('item.status ? <Text className="mine-menu__status">{item.status}</Text> : null'), true)
  assert.match(mineSource, /\{item\.url \|\| item\.tabUrl \? <View className="mine-menu__arrow ui-icon ui-icon--chevron" \/> : null\}/)
  assert.equal(mineSource.includes('ui-icon--near-me'), true)
  assert.equal(mineSource.includes("icon: 'pets'"), true)
  assert.equal(mineSource.includes("icon: 'sparkle'"), true)
  assert.equal(mineSource.includes("icon: 'group'"), true)
  assert.equal(mineSource.includes("icon: 'lock'"), true)
  assert.equal(mineSource.includes("tabUrl: '/pages/feed/index'"), true)
  assert.equal(mineSource.includes('switchTab({ url: item.tabUrl })'), true)
  assert.equal(themeSource.includes('.ui-icon--pets::before'), true)
  assert.equal(themeSource.includes('.ui-icon--sparkle::before'), true)
  assert.equal(themeSource.includes('.ui-icon--group::before'), true)
  assert.equal(themeSource.includes('.ui-icon--lock::before'), true)
  assert.equal(mineSource.includes('ui-icon--swap'), true)
  assert.equal(mineSource.includes('记录生活'), false)
  assert.equal(mineSource.includes('退出登录'), false)

  assert.equal(petManageSource.includes('pet-manage__topbar'), true)
  assert.equal(petManageSource.includes('pet-manage__summary'), true)
  assert.equal(petManageSource.includes('pet-manage__visibility'), true)
  assert.equal(petManageSource.includes('pet-manage__toggle'), true)
  assert.equal(petManageSource.includes('toggleVisibility'), true)
  assert.equal(petManageSource.includes('updatePet(pet.id, toPetPayload(pet, !pet.visible))'), true)
  assert.equal(petManageSource.includes('pet-manage__manage-row'), true)
  assert.equal(petManageSource.includes('pet-manage__row-actions'), true)
  assert.equal(petManageSource.includes('pet-manage__actions'), false)
  assert.equal(petManageSource.includes('设为默认'), false)
  assert.equal(petManageSource.includes('添加'), true)
  assert.equal(petManageSource.includes(' 只萌宠'), true)

  assert.equal(privacySource.includes('privacy-page__topbar'), true)
  assert.equal(privacySource.includes('privacy-safety-card'), true)
  assert.equal(privacySource.includes('privacy-group'), true)
  assert.equal(privacySource.includes('privacy-entry'), true)
  assert.equal(privacySource.includes('黑名单管理'), true)
  assert.equal(privacySource.includes('在“附近”可见'), true)
  assert.equal(privacySource.includes('允许其他宠物主在地图上发现你'), true)
  assert.equal(privacySource.includes('非好友可向您发起遛狗邀约'), true)
  assert.equal(privacySource.includes('在宠友圈显示您的个性昵称'), true)
  assert.equal(privacySource.includes('宠友圈竭力保障您的个人信息安全'), true)
  assert.equal(privacySource.includes('Version 2.4.0 (Build 82)'), true)
  assert.equal(privacySource.includes("icon: 'person-add'"), true)
  assert.equal(privacySource.includes("icon: 'badge'"), true)
  assert.equal(privacySource.includes("icon: 'map'"), true)
  assert.equal(themeSource.includes('.ui-icon--person-add::before'), true)
  assert.equal(themeSource.includes('.ui-icon--badge::before'), true)
  assert.equal(themeSource.includes('.ui-icon--map::before'), true)

  assert.equal(reportSource.includes('report-page__topbar'), true)
  assert.equal(reportSource.includes('report-target-card'), true)
  assert.equal(reportSource.includes('report-target-card__image'), true)
  assert.equal(reportSource.includes('MOCK_IMAGES.dog'), true)
  assert.equal(reportSource.includes('report-reason-grid'), true)
  assert.equal(reportSource.includes('report-evidence'), true)
  assert.equal(reportSource.includes('请先选择一个举报理由'), true)
  assert.equal(reportSource.includes('举报详情 (选填)'), true)
  assert.equal(reportSource.includes('证据截图 (最多3张)'), true)
  assert.equal(reportSource.includes('ui-icon--badge'), true)
  assert.equal(reportSource.includes('ui-icon--flag'), true)
  assert.equal(reportSource.includes('ui-icon--camera'), true)
  assert.equal(reportSource.includes('提交举报'), true)
})

test('secondary Stitch visual vocabulary stays aligned with prototype copy and icons', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const optionsSource = readFileSync(join(srcRoot, 'constants/options.ts'), 'utf8')
  const domainSource = readFileSync(join(srcRoot, 'types/domain.ts'), 'utf8')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')

  assert.equal(domainSource.includes("export type PostVisibility = 'public' | 'nearby' | 'followers' | 'private'"), true)
  assert.equal(optionsSource.includes("public: '公开'"), true)
  assert.equal(optionsSource.includes("nearby: '附近'"), true)
  assert.equal(optionsSource.includes("followers: '粉丝'"), true)
  assert.equal(optionsSource.includes("private: '私密'"), true)
  assert.equal(optionsSource.includes("'骚扰侮辱'"), true)
  assert.equal(optionsSource.includes("'营销广告'"), true)
  assert.equal(optionsSource.includes("'低俗色情'"), true)
  assert.equal(optionsSource.includes("'虐待动物'"), true)

  for (const icon of ['person-add', 'badge', 'map', 'tag', 'send', 'walk', 'face', 'star', 'rocket', 'globe']) {
    assert.equal(themeSource.includes(`.ui-icon--${icon}::before`), true)
  }
})

test('pet edit and block list keep Stitch secondary account anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const petEditSource = readFileSync(join(srcRoot, 'subpackages/pet/edit/index.tsx'), 'utf8')
  const blockSource = readFileSync(join(srcRoot, 'subpackages/settings/block/index.tsx'), 'utf8')
  const privacySource = readFileSync(join(srcRoot, 'subpackages/settings/privacy/index.tsx'), 'utf8')

  assert.equal(petEditSource.includes('edit-pet__topbar'), true)
  assert.equal(petEditSource.includes('edit-pet__avatar-card'), true)
  assert.equal(petEditSource.includes('edit-pet__field-grid'), true)
  assert.equal(petEditSource.includes('edit-pet__sticky-submit'), true)
  assert.equal(petEditSource.includes('ui-icon--back'), true)
  assert.equal(petEditSource.includes('ui-icon--camera'), true)

  assert.equal(blockSource.includes('block-page__topbar'), true)
  assert.equal(blockSource.includes('block-safety-card'), true)
  assert.equal(blockSource.includes('block-item__avatar'), true)
  assert.equal(blockSource.includes('block-item__avatar-image'), true)
  assert.equal(blockSource.includes('block-item__avatar-mask ui-icon ui-icon--block'), true)
  assert.equal(blockSource.includes('MOCK_IMAGES.owner'), true)
  assert.equal(blockSource.includes('block-item__avatar-letter'), false)
  assert.equal(blockSource.includes('用户 #'), false)
  assert.equal(blockSource.includes('block-item__status'), true)
  assert.equal(blockSource.includes('ui-icon--back'), true)
  assert.equal(blockSource.includes('ui-icon--block'), true)
  assert.equal(privacySource.includes('提交申请后将进入人工安全校验流程'), true)
  assert.equal(privacySource.includes('该能力当前仅作为设置入口展示'), false)
})

test('nearby empty state and filter sheet keep Stitch discovery anchors', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const nearbySource = readFileSync(join(srcRoot, 'pages/nearby/index.tsx'), 'utf8')

  assert.equal(nearbySource.includes('nearby-empty'), true)
  assert.equal(nearbySource.includes('nearby-empty__illustration'), true)
  assert.equal(nearbySource.includes('去社交圈看看'), true)
  assert.equal(nearbySource.includes('重新定位'), true)
  assert.equal(nearbySource.includes('/pages/feed/index'), true)

  assert.equal(nearbySource.includes('filter-sheet__handle'), true)
  assert.equal(nearbySource.includes('filter-sheet__close'), true)
  assert.equal(nearbySource.includes('filter-section'), true)
  assert.equal(nearbySource.includes('filter-switch-row'), true)
  assert.equal(nearbySource.includes('仅看接受邀请的'), true)
  assert.equal(nearbySource.includes('重置'), true)
  assert.equal(nearbySource.includes('显示结果'), true)
})

test('primary visual surfaces avoid placeholder icon text and emoji art', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const checkedFiles = [
    'pages/login/index.tsx',
    'pages/nearby/index.tsx',
    'pages/feed/index.tsx',
    'pages/invite/index.tsx',
    'pages/mine/index.tsx',
    'subpackages/invite/create/index.tsx',
    'subpackages/invite/detail/index.tsx',
    'subpackages/pet/manage/index.tsx',
    'subpackages/pet/edit/index.tsx',
    'subpackages/post/create/index.tsx',
    'subpackages/settings/privacy/index.tsx',
    'subpackages/settings/block/index.tsx',
    'components/PetCard/index.tsx',
    'components/PostCard/index.tsx',
    'components/InviteCard/index.tsx',
    'components/EmptyState/index.tsx'
  ]
  const placeholderPattern = /🐾|📍|⌖|⌕|◷|♡|···|[×›]|>[\s]*(‹|⌄|✎|◉|◎|!)[\s]*<|Paw|__icon">[A-Z]</
  const offenders = checkedFiles.filter((file) => placeholderPattern.test(readFileSync(join(srcRoot, file), 'utf8')))

  assert.deepEqual(offenders, [])
})

test('mini-program UI copy stays localized and pet-social in visible surfaces', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const checkedFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.tsx$/),
    ...collectFiles(join(srcRoot, 'subpackages'), /index\.tsx$/),
    ...collectFiles(join(srcRoot, 'components'), /index\.tsx$/)
  ]
  const englishPlaceholderPattern =
    /Go to Social Circle|Relocate|Moment Detail|Follow|Comments \(|Reply|Say something friendly|Share your fur kid|Mochi/
  const offenders = checkedFiles
    .filter((filePath) => englishPlaceholderPattern.test(readFileSync(filePath, 'utf8')))
    .map((filePath) => relative(srcRoot, filePath))

  assert.deepEqual(offenders, [])
})

test('primary visual buttons use local ui-button classes instead of NutUI buttons', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations: Array<{ file: string; selectors: string[] }> = [
    { file: 'pages/login/index.tsx', selectors: ['login-page__button ui-button'] },
    { file: 'pages/nearby/index.tsx', selectors: ['nearby-permission__primary ui-button', 'filter-submit ui-button'] },
    { file: 'components/PetCard/index.tsx', selectors: ['pet-card__invite ui-button', 'pet-card__view ui-button'] },
    { file: 'components/InviteCard/index.tsx', selectors: ['invite-card__button ui-button', 'invite-card__detail-button ui-button'] },
    { file: 'pages/mine/index.tsx', selectors: ['mine-quick-actions__button ui-button'] }
  ]

  const offenders = expectations.filter(({ file, selectors }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return selectors.some((selector) => !source.includes(selector))
  })

  assert.deepEqual(offenders.map(({ file }) => file), [])
})

test('NutUI buttons keep Stitch color overrides for remaining form actions', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const appStyle = readFileSync(join(srcRoot, 'app.scss'), 'utf8')

  assert.equal(appStyle.includes('.nut-button.submit-button'), true)
  assert.equal(appStyle.includes('.nut-button.create-post__submit'), true)
  assert.equal(appStyle.includes('.nut-button.privacy-save'), true)
  assert.equal(appStyle.includes('.nut-button.invite-detail__ghost'), true)
  assert.equal(appStyle.includes('.nut-button.post-detail__danger'), true)
  assert.equal(appStyle.includes('background: var(--color-primary, #326b00);'), true)
  assert.equal(appStyle.includes('background: var(--color-primary-soft, rgba(118, 185, 71, 0.12));'), true)
})

test('shared visual primitives keep WeChat-safe hard color fallbacks', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')

  assert.match(themeSource, /\.ui-button--primary\s*\{[\s\S]*background-color:\s*#326b00/)
  assert.match(themeSource, /\.ui-button--primary\s*\{[\s\S]*background-color:\s*var\(--color-primary,\s*#326b00\)/)
  assert.match(themeSource, /\.ui-button--secondary\s*\{[\s\S]*background-color:\s*rgba\(118,\s*185,\s*71,\s*0\.12\)/)
  assert.match(themeSource, /\.ui-button--warm\s*\{[\s\S]*background-color:\s*#feb246/)
  assert.match(themeSource, /\.ui-button--disabled\s*\{[\s\S]*background-color:\s*#e0e4d7/)
})

test('main visual actions use CSS-drawn icons instead of text glyph placeholders', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    { file: 'pages/login/index.tsx', selectors: ['ui-icon--check'] },
    { file: 'pages/feed/index.tsx', selectors: ['ui-icon--add'] },
    { file: 'pages/mine/index.tsx', selectors: ['ui-icon--check', 'ui-icon--add', 'ui-icon--chevron'] },
    { file: 'components/PostCard/index.tsx', selectors: ['ui-icon--more', 'ui-icon--heart', 'ui-icon--comment', 'ui-icon--share'] },
    { file: 'components/InviteCard/index.tsx', selectors: ['ui-icon--heart'] }
  ]

  const offenders = expectations.filter(({ file, selectors }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return selectors.some((selector) => !source.includes(selector))
  })

  assert.deepEqual(offenders.map(({ file }) => file), [])
})

test('secondary topbar controls use CSS-drawn icons instead of text glyphs', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    { file: 'subpackages/pet/create/index.tsx', selectors: ['ui-icon--back'] },
    { file: 'subpackages/pet/manage/index.tsx', selectors: ['ui-icon--back', 'ui-icon--edit', 'ui-icon--visibility'] },
    { file: 'subpackages/pet/detail/index.tsx', selectors: ['ui-icon--back', 'ui-icon--info'] },
    { file: 'subpackages/invite/create/index.tsx', selectors: ['ui-icon--back', 'ui-icon--chevron'] },
    { file: 'subpackages/invite/detail/index.tsx', selectors: ['ui-icon--back'] },
    { file: 'subpackages/post/detail/index.tsx', selectors: ['ui-icon--back'] },
    { file: 'subpackages/settings/privacy/index.tsx', selectors: ['ui-icon--back'] },
    { file: 'subpackages/settings/report/index.tsx', selectors: ['ui-icon--back'] },
    { file: 'subpackages/settings/block/index.tsx', selectors: ['ui-icon--back', 'ui-icon--block'] },
    { file: 'subpackages/pet/edit/index.tsx', selectors: ['ui-icon--back', 'ui-icon--camera'] }
  ]

  const offenders = expectations.filter(({ file, selectors }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return selectors.some((selector) => !source.includes(selector))
  })

  assert.deepEqual(offenders.map(({ file }) => file), [])
})

test('secondary form toggles use Stitch-scale custom switches instead of native WeChat switches', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    'subpackages/pet/create/index.tsx',
    'subpackages/pet/edit/index.tsx',
    'subpackages/settings/privacy/index.tsx'
  ]
  const offenders = expectations.filter((file) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return source.includes('<Switch') || !source.includes('settings-switch') || !source.includes('settings-switch__dot')
  })

  assert.deepEqual(offenders, [])
})

test('WeChat visual theme tokens are bound to page for reliable mini-program rendering', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')

  assert.match(themeSource, /:root,\s*page\s*\{[\s\S]*--color-bg:\s*#f7fbed/)
  assert.match(themeSource, /:root,\s*page\s*\{[\s\S]*--color-primary:\s*#326b00/)
  assert.match(themeSource, /:root,\s*page\s*\{[\s\S]*--radius-pill:\s*999px/)
})

test('screenshot-reported primary screens keep hard Stitch colors and softened type', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/login/index.scss',
      patterns: [
        /\.login-page\s*\{[\s\S]*background:\s*#f7fbed/,
        /\.login-page__button\s*\{[\s\S]*background:\s*#326b00/,
        /\.login-page__brand\s*\{[\s\S]*color:\s*#191d15/
      ]
    },
    {
      file: 'pages/nearby/index.scss',
      patterns: [
        /\.nearby-page\s*\{[\s\S]*background:\s*#f7fbed/,
        /\.nearby-permission\s*\{[\s\S]*background:\s*#fff/,
        /\.nearby-permission__primary\s*\{[\s\S]*background:\s*#326b00/
      ]
    },
    {
      file: 'pages/feed/index.scss',
      patterns: [
        /\.feed-page\s*\{[\s\S]*background:\s*#f7fbed/,
        /\.feed-page__title\s*\{[\s\S]*font-weight:\s*600/,
        /\.feed-page__fab\s*\{[\s\S]*background:\s*#76b947/
      ]
    },
    {
      file: 'pages/invite/index.scss',
      patterns: [
        /\.invite-page\s*\{[\s\S]*background:\s*#f7fbed/,
        /\.invite-tabs\s*\{[\s\S]*background:\s*#f2f5e7/,
        /\.invite-filter-chip--active\s*\{[\s\S]*background:\s*#326b00/
      ]
    },
    {
      file: 'pages/mine/index.scss',
      patterns: [
        /\.mine-page\s*\{[\s\S]*background:\s*#f7fbed/,
        /\.mine-stats\s*\{[\s\S]*background:\s*#fff/,
        /\.mine-menu__title\s*\{[\s\S]*font-weight:\s*500/,
        /\.mine-pet-strip__active-badge\s*\{[\s\S]*font-weight:\s*600/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('screenshot-reported shared cards avoid gray wireframe fallback styling', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'components/PostCard/index.scss',
      patterns: [
        /\.post-card\s*\{[\s\S]*background:\s*#fff/,
        /\.post-card\s*\{[\s\S]*box-shadow:\s*0 8px 40px rgba\(118,\s*185,\s*71,\s*0\.08\)/,
        /\.post-card__content\s*\{[\s\S]*font-weight:\s*400/
      ]
    },
    {
      file: 'components/InviteCard/index.scss',
      patterns: [
        /\.invite-card\s*\{[\s\S]*background:\s*#fff/,
        /\.invite-card__button\.ui-button--primary\s*\{[\s\S]*background:\s*#326b00/,
        /\.invite-card__title\s*\{[\s\S]*font-weight:\s*600/
      ]
    },
    {
      file: 'components/PetCard/index.scss',
      patterns: [
        /\.pet-card\s*\{[\s\S]*background:\s*#fff/,
        /\.pet-card__invite\s*\{[\s\S]*background:\s*#326b00/,
        /\.pet-card__view\s*\{[\s\S]*background:\s*rgba\(118,\s*185,\s*71,\s*0\.12\)/
      ]
    },
    {
      file: 'components/EmptyState/index.scss',
      patterns: [
        /\.empty-state\s*\{[\s\S]*border:\s*1px solid rgba\(193,\s*201,\s*181,\s*0\.28\)/,
        /\.empty-state__button\s*\{[\s\S]*background:\s*#326b00/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('secondary MVP pages keep WeChat-safe Stitch color fallbacks', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const styleFiles = collectFiles(join(srcRoot, 'subpackages'), /index\.scss$/)
  const bareVariablePattern = /(?:background|color):\s*var\(--color-[^,)]+?\);|box-shadow:\s*var\(--shadow-[^,)]+?\);|border:\s*(?:1px|2px|3px)\s+(?:solid|dashed)\s+var\(--color-[^,)]+?\);/
  const offenders = styleFiles
    .filter((filePath) => bareVariablePattern.test(readFileSync(filePath, 'utf8')))
    .map((filePath) => relative(srcRoot, filePath))

  assert.deepEqual(offenders, [])
})

test('secondary MVP pages pair Stitch token declarations with hard visual fallbacks', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const styleFiles = collectFiles(join(srcRoot, 'subpackages'), /index\.scss$/)

  const offenders = styleFiles.flatMap((filePath) =>
    findMissingHardVisualFallbacks(filePath).map((offender) =>
      offender.replace(`${srcRoot}/`, '')
    )
  )

  assert.deepEqual(offenders, [])
})

test('main pages and shared components keep WeChat-safe Stitch visual fallbacks', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const styleFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.scss$/),
    ...collectFiles(join(srcRoot, 'components'), /index\.scss$/)
  ]
  const bareVariablePattern =
    /(?:background|color):\s*var\(--color-[^,)]+?\);|box-shadow:\s*var\(--shadow-[^,)]+?\);|border:\s*(?:1px|2px|3px)\s+(?:solid|dashed)\s+var\(--color-[^,)]+?\);|border-(?:color|left-color|bottom-color):\s*var\(--color-[^,)]+?\);/
  const offenders = styleFiles
    .filter((filePath) => bareVariablePattern.test(readFileSync(filePath, 'utf8')))
    .map((filePath) => relative(srcRoot, filePath))

  assert.deepEqual(offenders, [])
})

test('main pages and shared components pair Stitch token declarations with hard visual fallbacks', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const styleFiles = [
    ...collectFiles(join(srcRoot, 'pages'), /index\.scss$/),
    ...collectFiles(join(srcRoot, 'components'), /index\.scss$/)
  ]

  const offenders = styleFiles.flatMap((filePath) =>
    findMissingHardVisualFallbacks(filePath).map((offender) =>
      offender.replace(`${srcRoot}/`, '')
    )
  )

  assert.deepEqual(offenders, [])
})

test('screenshot-reported surfaces avoid bare wireframe controls', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/nearby/index.scss',
      absent: [
        /border:\s*3px\s+solid\s+var\(--color-outline\);/,
        /background:\s*var\(--color-outline\);/
      ]
    },
    {
      file: 'pages/mine/index.scss',
      absent: [
        /color:\s*var\(--color-text\);/,
        /background:\s*var\(--color-danger\);/,
        /border:\s*2px\s+dashed\s+#c1c9b5;/
      ]
    }
  ]
  const offenders = expectations.flatMap(({ file, absent }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return absent.some((pattern) => pattern.test(source)) ? [file] : []
  })

  assert.deepEqual(offenders, [])
})

test('secondary detail actions avoid hard outline ghost buttons', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/pet/detail/index.scss',
      absent: [/\.pet-detail__follow\s*\{[\s\S]*border:\s*2px\s+solid\s+var\(--color-outline,\s*#c1c9b5\)/]
    },
    {
      file: 'subpackages/invite/detail/index.scss',
      absent: [/\.invite-detail__ghost,\s*[\s\S]*\.invite-detail__report\s*\{[\s\S]*border:\s*2px\s+solid\s+var\(--color-outline,\s*#c1c9b5\)/]
    },
    {
      file: 'subpackages/invite/create/index.scss',
      absent: [/\.create-invite__title-input,\s*[\s\S]*\.create-invite__textarea\s*\{[\s\S]*border:\s*2px\s+solid\s+var\(--color-outline,\s*#c1c9b5\)/]
    }
  ]
  const offenders = expectations.flatMap(({ file, absent }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return absent.some((pattern) => pattern.test(source)) ? [file] : []
  })

  assert.deepEqual(offenders, [])
})

test('screenshot-reported pages keep Stitch-scale custom navigation proportions', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/post/create/index.scss',
      patterns: [
        /\.create-post\s*\{[\s\S]*padding:\s*192px 40px 164px/,
        /\.create-post__topbar\s*\{[\s\S]*height:\s*176px/,
        /\.create-post__topbar\s*\{[\s\S]*padding:\s*88px 40px 0/,
        /\.create-post__submit\s*\{[\s\S]*width:\s*100%/
      ]
    },
    {
      file: 'subpackages/invite/create/index.scss',
      patterns: [
        /\.create-invite\s*\{[\s\S]*padding:\s*192px 40px 164px/,
        /\.create-invite__topbar\s*\{[\s\S]*height:\s*176px/,
        /\.create-invite__topbar\s*\{[\s\S]*padding:\s*88px 280px 0 40px/,
        /\.create-invite__topbar\s*\{[\s\S]*padding:\s*88px var\(--wechat-capsule-reserve,\s*280px\) 0 40px/,
        /\.create-invite__submit\s*\{[\s\S]*width:\s*100%/
      ]
    },
    {
      file: 'subpackages/pet/manage/index.scss',
      patterns: [
        /\.pet-manage\s*\{[\s\S]*padding-top:\s*96px/,
        /\.pet-manage__back\s*\{[\s\S]*transform:\s*none/,
        /\.pet-manage__edit\s*\{[\s\S]*transform:\s*none/
      ]
    },
    {
      file: 'subpackages/pet/detail/index.scss',
      patterns: [
        /\.pet-detail\s*\{[\s\S]*padding:\s*0 40px 148px/,
        /\.pet-detail__nav\s*\{[\s\S]*top:\s*88px/,
        /\.pet-detail__nav-button\s*\{[\s\S]*transform:\s*none/,
        /\.pet-detail__hero\s*\{[\s\S]*margin:\s*0 -40px 82px/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('main tab appbars reserve WeChat capsule space for right actions', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')
  const expectations = [
    {
      file: 'pages/feed/index.tsx',
      selectors: ['feed-page__appbar capsule-safe-appbar', 'feed-page__search capsule-safe-appbar__action']
    },
    {
      file: 'pages/invite/index.tsx',
      selectors: ['invite-page__appbar capsule-safe-appbar', 'invite-page__search capsule-safe-appbar__action']
    },
    {
      file: 'pages/mine/index.tsx',
      selectors: ['mine-page__appbar capsule-safe-appbar', 'mine-page__search capsule-safe-appbar__action']
    }
  ]

  assert.match(themeSource, /--wechat-capsule-reserve:\s*280px/)
  assert.match(themeSource, /\.capsule-safe-appbar\s*\{[\s\S]*padding-right:\s*280px/)
  assert.match(themeSource, /\.capsule-safe-appbar\s*\{[\s\S]*padding-right:\s*var\(--wechat-capsule-reserve,\s*280px\)/)
  assert.match(themeSource, /\.capsule-safe-appbar__action\s*\{[\s\S]*margin-right:\s*0/)

  const offenders = expectations.filter(({ file, selectors }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return selectors.some((selector) => !source.includes(selector))
  })

  assert.deepEqual(offenders.map(({ file }) => file), [])
})

test('secondary topbar right controls reserve WeChat capsule space', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/post/detail/index.scss',
      patterns: [
        /\.post-detail__topbar\s*\{[\s\S]*padding:\s*88px 280px 0 40px/,
        /\.post-detail__topbar\s*\{[\s\S]*padding:\s*88px var\(--wechat-capsule-reserve,\s*280px\) 0 40px/
      ]
    },
    {
      file: 'subpackages/invite/create/index.scss',
      patterns: [
        /\.create-invite__topbar\s*\{[\s\S]*padding:\s*88px 280px 0 40px/,
        /\.create-invite__topbar\s*\{[\s\S]*padding:\s*88px var\(--wechat-capsule-reserve,\s*280px\) 0 40px/
      ]
    },
    {
      file: 'subpackages/invite/detail/index.scss',
      patterns: [
        /\.invite-detail__topbar\s*\{[\s\S]*padding:\s*88px 280px 0 40px/,
        /\.invite-detail__topbar\s*\{[\s\S]*padding:\s*88px var\(--wechat-capsule-reserve,\s*280px\) 0 40px/
      ]
    },
    {
      file: 'subpackages/pet/detail/index.scss',
      patterns: [
        /\.pet-detail__nav\s*\{[\s\S]*right:\s*280px/,
        /\.pet-detail__nav\s*\{[\s\S]*right:\s*var\(--wechat-capsule-reserve,\s*280px\)/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('screenshot-reported primary surfaces keep prototype-scale typography and icons', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/mine/index.scss',
      patterns: [
        /\.mine-page__appbar\s*\{[\s\S]*height:\s*80px/,
        /\.mine-profile__avatar\s*\{[\s\S]*width:\s*176px/,
        /\.mine-stats\s*\{[\s\S]*padding:\s*30px 12px/,
        /\.mine-stats__value\s*\{[\s\S]*font-size:\s*40px/,
        /\.mine-pet-strip__avatar-wrap,\s*[\s\S]*\.mine-pet-strip__add\s*\{[\s\S]*width:\s*154px/,
        /\.mine-pet-strip__avatar-wrap--active\s*\{[\s\S]*border:\s*4px solid #326b00/,
        /\.mine-pet-strip__avatar\s*\{[\s\S]*border-radius:\s*50%/,
        /\.mine-pet-strip__active-badge\s*\{[\s\S]*background:\s*#326b00/,
        /\.mine-pet-strip__active-badge\s*\{[\s\S]*height:\s*34px[\s\S]*font-size:\s*20px/,
        /\.mine-quick-actions__button\s*\{[\s\S]*height:\s*96px/,
        /\.mine-profile__location\s*\{[\s\S]*justify-content:\s*center/,
        /\.mine-profile__badge-icon\s*\{[\s\S]*width:\s*44px[\s\S]*height:\s*44px/,
        /\.mine-profile__location-icon\s*\{[\s\S]*width:\s*44px[\s\S]*height:\s*44px/,
        /\.mine-menu__item\s*\{[\s\S]*min-height:\s*128px/,
        /\.mine-menu__icon\s*\{[\s\S]*width:\s*80px/,
        /\.mine-menu__icon\s*\{[\s\S]*transform:\s*none/,
        /\.mine-menu__title\s*\{[\s\S]*font-size:\s*32px/,
        /\.mine-logout\s*\{[\s\S]*min-height:\s*76px/
      ]
    },
    {
      file: 'pages/feed/index.scss',
      patterns: [
        /\.feed-page__appbar\s*\{[\s\S]*min-height:\s*80px/,
        /\.feed-page__brand-name\s*\{[\s\S]*font-size:\s*38px/,
        /\.feed-page__title\s*\{[\s\S]*font-size:\s*44px/,
        /\.feed-tab\s*\{[\s\S]*height:\s*76px/,
        /\.feed-tab\s*\{[\s\S]*font-size:\s*30px/,
        /\.feed-page__fab\s*\{[\s\S]*display:\s*flex[\s\S]*align-items:\s*center[\s\S]*justify-content:\s*center/,
        /\.feed-page__fab-icon\s*\{[\s\S]*width:\s*68px[\s\S]*height:\s*68px[\s\S]*transform:\s*none/
      ]
    },
    {
      file: 'components/PostCard/index.scss',
      patterns: [
        /\.post-card\s*\{[\s\S]*padding:\s*30px/,
        /\.post-card__avatar\s*\{[\s\S]*width:\s*108px/,
        /\.post-card__name\s*\{[\s\S]*font-size:\s*32px/,
        /\.post-card__content\s*\{[\s\S]*font-size:\s*30px/,
        /\.post-card__more\s*\{[\s\S]*width:\s*72px/,
        /\.post-card__more\s*\{[\s\S]*transform:\s*none/,
        /\.post-card__action-icon\s*\{[\s\S]*transform:\s*none/
      ]
    }
  ]
  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('primary flow styles do not shrink clickable icon containers below prototype scale', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const checkedFiles = [
    'pages/login/index.scss',
    'pages/nearby/index.scss',
    'pages/feed/index.scss',
    'pages/invite/index.scss',
    'pages/mine/index.scss',
    'components/PostCard/index.scss',
    'components/InviteCard/index.scss',
    'subpackages/pet/manage/index.scss',
    'subpackages/pet/edit/index.scss',
    'subpackages/post/create/index.scss',
    'subpackages/post/detail/index.scss',
    'subpackages/invite/create/index.scss',
    'subpackages/invite/detail/index.scss',
    'subpackages/settings/privacy/index.scss',
    'subpackages/settings/report/index.scss',
    'subpackages/settings/block/index.scss'
  ]
  const offenders = checkedFiles.filter((file) => /transform:\s*(?:scale\(0\.|translate\(-50%,\s*-50%\)\s*scale)/.test(readFileSync(join(srcRoot, file), 'utf8')))

  assert.deepEqual(offenders, [])
})

test('shared icon primitives preserve centered drawing inside scaled containers', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')
  const postCardSource = readFileSync(join(srcRoot, 'components/PostCard/index.scss'), 'utf8')
  const appSource = readFileSync(join(srcRoot, 'app.scss'), 'utf8')

  assert.match(themeSource, /\.ui-icon\s*\{[\s\S]*display:\s*inline-flex[\s\S]*align-items:\s*center[\s\S]*justify-content:\s*center[\s\S]*width:\s*44px[\s\S]*min-width:\s*44px[\s\S]*height:\s*44px[\s\S]*min-height:\s*44px/)
  assert.match(themeSource, /\.ui-icon\s*\{[\s\S]*--ui-icon-offset:\s*calc\(\(100% - 38px\) \/ 2\)/)
  assert.match(themeSource, /\.ui-icon::before,\s*[\s\S]*\.ui-icon::after\s*\{[\s\S]*margin-left:\s*var\(--ui-icon-offset\)/)
  assert.match(postCardSource, /\.post-card__action-icon\s*\{[\s\S]*transform-origin:\s*center/)
  assert.match(appSource, /\.nut-button\.create-invite__submit,\s*[\s\S]*\.nut-button\.pet-detail__invite\s*\{[\s\S]*width:\s*100%/)
  assert.equal(appSource.includes('.nut-button.comment-input__button'), false)
})

test('CSS-drawn ui-icons remain centered in common icon-only controls', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'pages/login/index.scss',
      selectors: ['.login-page__checkbox-icon']
    },
    {
      file: 'pages/mine/index.scss',
      selectors: ['.mine-profile__badge-icon', '.mine-pet-strip__add-icon', '.mine-menu__icon', '.mine-menu__arrow']
    },
    {
      file: 'components/InviteCard/index.scss',
      selectors: ['.invite-card__heart', '.invite-card__line-icon.ui-icon']
    },
    {
      file: 'subpackages/settings/privacy/index.scss',
      selectors: ['.privacy-page__back', '.privacy-entry__icon', '.privacy-entry__arrow']
    },
    {
      file: 'subpackages/settings/report/index.scss',
      selectors: ['.report-page__back', '.report-evidence__plus']
    },
    {
      file: 'subpackages/settings/block/index.scss',
      selectors: ['.block-page__back', '.block-safety-card__icon']
    }
  ]

  const offenders = expectations.flatMap(({ file, selectors }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return selectors.filter((selector) => {
      const escaped = selector.replace(/\./g, '\\.')
      return !new RegExp(`${escaped}\\s*\\{[\\s\\S]*display:\\s*flex[\\s\\S]*align-items:\\s*center[\\s\\S]*justify-content:\\s*center`).test(source)
    }).map((selector) => `${file}:${selector}`)
  })

  assert.deepEqual(offenders, [])
})

test('shared card metadata icons avoid left-biased alignment origins', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'components/InviteCard/index.scss',
      patterns: [
        /\.invite-card__line-icon\.ui-icon\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/,
        /\.invite-card__line-icon\.ui-icon\s*\{[\s\S]*transform-origin:\s*center/
      ],
      absent: [/transform-origin:\s*left center/]
    },
    {
      file: 'components/PetCard/index.scss',
      patterns: [
        /\.pet-card__line-icon\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px[\s\S]*transform-origin:\s*center/
      ],
      absent: [/transform-origin:\s*left center/]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns, absent }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    const missing = patterns.some((pattern) => !pattern.test(source))
    const forbidden = absent.some((pattern) => pattern.test(source))
    return missing || forbidden ? [file] : []
  })

  assert.deepEqual(offenders, [])
})

test('post action rows use dedicated centered icon geometry', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const themeSource = readFileSync(join(srcRoot, 'assets/styles/theme.scss'), 'utf8')
  const postCardSource = readFileSync(join(srcRoot, 'components/PostCard/index.tsx'), 'utf8')
  const postCardStyle = readFileSync(join(srcRoot, 'components/PostCard/index.scss'), 'utf8')
  const postDetailSource = readFileSync(join(srcRoot, 'subpackages/post/detail/index.tsx'), 'utf8')
  const postDetailStyle = readFileSync(join(srcRoot, 'subpackages/post/detail/index.scss'), 'utf8')

  for (const source of [postCardSource, postDetailSource]) {
    assert.equal(source.includes('post-action-icon post-action-icon--heart ui-icon ui-icon--heart'), true)
    assert.equal(source.includes('post-action-icon post-action-icon--comment ui-icon ui-icon--comment'), true)
    assert.equal(source.includes('post-action-icon post-action-icon--share ui-icon ui-icon--share'), true)
  }

  assert.doesNotMatch(themeSource, /\.ui-icon--heart::before,\s*[\s\S]*\.ui-icon--heart::after\s*\{[\s\S]*height:\s*24px[\s\S]*border-radius:\s*17px/)
  assert.match(themeSource, /\.ui-icon--heart::before\s*\{[\s\S]*transform:\s*rotate\(-45deg\)/)
  assert.match(themeSource, /\.ui-icon--heart::after\s*\{[\s\S]*box-shadow:\s*10px 0 0 currentColor/)
  const commentIconBlock = themeSource.match(/\.ui-icon--comment::after\s*\{[^}]*\}/)?.[0] || ''
  assert.doesNotMatch(commentIconBlock, /(^|\n)\s*bottom:\s*3px/)
  assert.match(commentIconBlock, /top:\s*23px/)

  assert.match(postCardStyle, /\.post-card__action-icon\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/)
  assert.match(postDetailStyle, /\.post-detail__count-icon\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/)
  assert.match(postDetailStyle, /\.post-detail__counts\s*\{[\s\S]*align-items:\s*center/)
})

test('secondary detail layouts avoid screenshot-reported crowding and bottom composer stretch', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const postDetailSource = readFileSync(join(srcRoot, 'subpackages/post/detail/index.tsx'), 'utf8')
  const postDetailStyle = readFileSync(join(srcRoot, 'subpackages/post/detail/index.scss'), 'utf8')
  const petDetailSource = readFileSync(join(srcRoot, 'subpackages/pet/detail/index.tsx'), 'utf8')
  const petDetailStyle = readFileSync(join(srcRoot, 'subpackages/pet/detail/index.scss'), 'utf8')
  const inviteDetailStyle = readFileSync(join(srcRoot, 'subpackages/invite/detail/index.scss'), 'utf8')

  assert.equal(postDetailSource.includes('comment-input__send ui-button ui-button--primary'), true)
  assert.equal(postDetailSource.includes('comment-input__button'), false)
  assert.match(postDetailStyle, /\.post-detail__bottom-input\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) 128px/)
  assert.match(postDetailStyle, /\.comment-input__send\s*\{[\s\S]*height:\s*76px[\s\S]*border-radius:\s*999px/)

  assert.equal(petDetailSource.includes('pet-detail__identity-copy'), true)
  assert.equal(petDetailSource.includes('pet-detail__owner-copy'), true)
  assert.match(petDetailStyle, /\.pet-detail__identity\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/)
  assert.match(petDetailStyle, /\.pet-detail__meta,\s*[\s\S]*\.pet-detail__desc\s*\{[\s\S]*display:\s*block/)
  assert.match(petDetailStyle, /\.pet-detail__owner-copy\s*\{[\s\S]*min-width:\s*0/)
  assert.match(petDetailStyle, /\.pet-detail__metric\s*\{[\s\S]*display:\s*flex[\s\S]*align-items:\s*center/)

  assert.match(inviteDetailStyle, /\.invite-detail__status\s*\{[\s\S]*min-height:\s*58px[\s\S]*font-size:\s*24px[\s\S]*line-height:\s*58px/)
  assert.match(inviteDetailStyle, /\.invite-detail__status-icon\s*\{[\s\S]*width:\s*34px[\s\S]*height:\s*34px/)
})

test('main tab appbar icons use shared centered prototype-scale controls', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      tsx: 'pages/nearby/index.tsx',
      scss: 'pages/nearby/index.scss',
      selectors: [
        'nearby-page__pin ui-icon ui-icon--pin',
        'nearby-page__refresh ui-icon ui-icon--refresh',
        'nearby-search__icon ui-icon ui-icon--search'
      ],
      stylePatterns: [
        /\.nearby-page__pin,\s*[\s\S]*\.nearby-page__refresh,\s*[\s\S]*\.nearby-search__icon\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px[\s\S]*display:\s*flex/,
        /\.nearby-page__filter-button\s*\{[\s\S]*height:\s*72px[\s\S]*font-size:\s*24px[\s\S]*line-height:\s*72px/
      ]
    },
    {
      tsx: 'pages/feed/index.tsx',
      scss: 'pages/feed/index.scss',
      selectors: ['feed-page__pin ui-icon ui-icon--pin', 'feed-page__search capsule-safe-appbar__action ui-icon ui-icon--search'],
      stylePatterns: [
        /\.feed-page__pin,\s*[\s\S]*\.feed-page__search\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px[\s\S]*display:\s*flex/
      ]
    },
    {
      tsx: 'pages/invite/index.tsx',
      scss: 'pages/invite/index.scss',
      selectors: ['invite-page__pin ui-icon ui-icon--pin', 'invite-page__search capsule-safe-appbar__action ui-icon ui-icon--search'],
      stylePatterns: [
        /\.invite-page__pin,\s*[\s\S]*\.invite-page__search\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px[\s\S]*display:\s*flex/
      ]
    },
    {
      tsx: 'pages/mine/index.tsx',
      scss: 'pages/mine/index.scss',
      selectors: ['mine-page__search capsule-safe-appbar__action ui-icon ui-icon--search'],
      stylePatterns: [
        /\.mine-page__search\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px[\s\S]*display:\s*flex/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ tsx, scss, selectors, stylePatterns }) => {
    const source = readFileSync(join(srcRoot, tsx), 'utf8')
    const style = readFileSync(join(srcRoot, scss), 'utf8')
    const missingSelectors = selectors.some((selector) => !source.includes(selector))
    const missingStyles = stylePatterns.some((pattern) => !pattern.test(style))
    return missingSelectors || missingStyles ? [tsx] : []
  })

  assert.deepEqual(offenders, [])
})

test('secondary settings topbars keep Stitch-scale touch targets', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/settings/privacy/index.scss',
      patterns: [
        /\.privacy-page__topbar\s*\{[\s\S]*grid-template-columns:\s*100px 1fr 100px/,
        /\.privacy-page__topbar\s*\{[\s\S]*min-height:\s*96px/,
        /\.privacy-page__back\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/settings/report/index.scss',
      patterns: [
        /\.report-page__topbar\s*\{[\s\S]*grid-template-columns:\s*100px 1fr 100px/,
        /\.report-page__topbar\s*\{[\s\S]*min-height:\s*96px/,
        /\.report-page__back\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/settings/block/index.scss',
      patterns: [
        /\.block-page__topbar\s*\{[\s\S]*grid-template-columns:\s*100px 1fr 100px/,
        /\.block-page__topbar\s*\{[\s\S]*min-height:\s*96px/,
        /\.block-page__back\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/pet/manage/index.scss',
      patterns: [
        /\.pet-manage__topbar\s*\{[\s\S]*grid-template-columns:\s*100px 1fr 128px/,
        /\.pet-manage__topbar\s*\{[\s\S]*min-height:\s*96px/,
        /\.pet-manage__back\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.pet-manage__add\s*\{[\s\S]*height:\s*80px[\s\S]*line-height:\s*80px/
      ]
    },
    {
      file: 'subpackages/pet/edit/index.scss',
      patterns: [
        /\.edit-pet__topbar\s*\{[\s\S]*grid-template-columns:\s*100px 1fr 100px/,
        /\.edit-pet__topbar\s*\{[\s\S]*padding:\s*88px 40px 0/,
        /\.edit-pet__back,\s*[\s\S]*\.edit-pet__spacer\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/pet/create/index.scss',
      patterns: [
        /\.create-pet__back,\s*[\s\S]*\.create-pet__spacer\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.create-pet__camera\s*\{[\s\S]*width:\s*72px[\s\S]*height:\s*72px/
      ]
    },
    {
      file: 'subpackages/post/create/index.scss',
      patterns: [
        /\.create-post__close,\s*[\s\S]*\.create-post__spacer\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/post/detail/index.scss',
      patterns: [
        /\.post-detail__back,\s*[\s\S]*\.post-detail__more\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    },
    {
      file: 'subpackages/invite/create/index.scss',
      patterns: [
        /\.create-invite__back,\s*[\s\S]*\.create-invite__more\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.create-invite__my-pet-picker\s*\{[\s\S]*width:\s*72px[\s\S]*height:\s*72px/,
        /\.create-invite__type-icon\s*\{[\s\S]*width:\s*48px[\s\S]*height:\s*48px/,
        /\.create-invite__schedule-icon\s*\{[\s\S]*width:\s*56px[\s\S]*height:\s*56px/,
        /\.create-invite__safety-icon\s*\{[\s\S]*width:\s*72px[\s\S]*height:\s*72px/
      ]
    },
    {
      file: 'subpackages/invite/detail/index.scss',
      patterns: [
        /\.invite-detail__back,\s*[\s\S]*\.invite-detail__share\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.invite-detail__info-icon\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.invite-detail__shield\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('secondary settings content avoids undersized controls from screenshot feedback', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const expectations = [
    {
      file: 'subpackages/settings/privacy/index.scss',
      patterns: [
        /\.privacy-safety-card__icon\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.privacy-entry\s*\{[\s\S]*min-height:\s*104px/,
        /\.privacy-entry__icon\s*\{[\s\S]*width:\s*72px[\s\S]*height:\s*72px/,
        /\.privacy-entry__title\s*\{[\s\S]*font-size:\s*27px/,
        /\.privacy-shield__copy\s*\{[\s\S]*font-size:\s*20px/,
        /\.privacy-shield__version\s*\{[\s\S]*font-size:\s*20px/,
        /\.privacy-save\s*\{[\s\S]*right:\s*40px[\s\S]*left:\s*40px[\s\S]*height:\s*88px/
      ]
    },
    {
      file: 'subpackages/settings/report/index.scss',
      patterns: [
        /\.report-target-card__avatar\s*\{[\s\S]*width:\s*112px[\s\S]*height:\s*112px/,
        /\.report-target-card__badge\s*\{[\s\S]*height:\s*36px[\s\S]*font-size:\s*20px[\s\S]*line-height:\s*36px/,
        /\.report-target-card__desc\s*\{[\s\S]*font-size:\s*22px/,
        /\.report-reason-grid__item\s*\{[\s\S]*height:\s*84px[\s\S]*font-size:\s*24px/,
        /\.report-card__textarea\s*\{[\s\S]*min-height:\s*240px[\s\S]*font-size:\s*25px/,
        /\.report-evidence\s*\{[\s\S]*width:\s*152px[\s\S]*height:\s*152px/,
        /\.report-evidence__copy,\s*[\s\S]*\.report-section__hint\s*\{[\s\S]*font-size:\s*20px/,
        /\.report-submit\s*\{[\s\S]*right:\s*40px[\s\S]*left:\s*40px[\s\S]*height:\s*88px/
      ]
    },
    {
      file: 'subpackages/settings/block/index.scss',
      patterns: [
        /\.block-safety-card__icon\s*\{[\s\S]*width:\s*80px[\s\S]*height:\s*80px/,
        /\.block-item\s*\{[\s\S]*min-height:\s*128px/,
        /\.block-item__avatar\s*\{[\s\S]*width:\s*88px[\s\S]*height:\s*88px/,
        /\.block-item__avatar-image\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%/,
        /\.block-item__avatar-mask\s*\{[\s\S]*width:\s*56px[\s\S]*height:\s*56px/,
        /\.block-item__status\s*\{[\s\S]*min-height:\s*44px[\s\S]*font-size:\s*20px/,
        /\.block-item__desc\s*\{[\s\S]*font-size:\s*23px/
      ]
    }
  ]

  const offenders = expectations.flatMap(({ file, patterns }) => {
    const source = readFileSync(join(srcRoot, file), 'utf8')
    return patterns.every((pattern) => pattern.test(source)) ? [] : [file]
  })

  assert.deepEqual(offenders, [])
})

test('secondary form pages keep prototype icon placement refinements', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const createPostStyle = readFileSync(join(srcRoot, 'subpackages/post/create/index.scss'), 'utf8')
  const reportStyle = readFileSync(join(srcRoot, 'subpackages/settings/report/index.scss'), 'utf8')
  const privacyStyle = readFileSync(join(srcRoot, 'subpackages/settings/privacy/index.scss'), 'utf8')

  assert.match(createPostStyle, /\.create-post__identity-badge\s*\{[\s\S]*position:\s*absolute/)
  assert.match(createPostStyle, /\.create-post__submit \.nut-button-children\s*\{[\s\S]*align-items:\s*center[\s\S]*justify-content:\s*center/)
  assert.match(createPostStyle, /\.create-post__visibility-title-icon\s*\{[\s\S]*color:\s*#41493a/)
  assert.match(reportStyle, /\.report-target-card__image\s*\{[\s\S]*width:\s*100%[\s\S]*height:\s*100%/)
  assert.equal(/\.privacy-shield__mark\s*\{[\s\S]*transform:\s*scale/.test(privacyStyle), false)
  assert.match(privacyStyle, /\.privacy-shield__mark\s*\{[\s\S]*transform:\s*none/)
})
