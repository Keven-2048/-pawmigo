import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { test } from 'node:test'

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const filePath = join(dir, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) return collectSourceFiles(filePath)
    return /\.(ts|tsx)$/.test(filePath) ? [filePath] : []
  })
}

test('mini-program static source does not depend on Unsplash image domains', () => {
  const srcRoot = resolve(__dirname, '../../src')
  const offenders = collectSourceFiles(srcRoot).filter((filePath) =>
    readFileSync(filePath, 'utf8').includes('images.unsplash.com')
  )

  assert.deepEqual(
    offenders.map((filePath) => relative(srcRoot, filePath)),
    []
  )
})

test('compiled WeChat package includes local mock image assets', () => {
  const distRoot = resolve(__dirname, '../../dist')
  const expectedAssets = [
    'assets/mock/pet-dog-golden.jpg',
    'assets/mock/pet-cat-window.jpg',
    'assets/mock/pet-dog-home.jpg',
    'assets/mock/pet-dog-frenchie.jpg',
    'assets/mock/pet-owner.jpg',
    'assets/mock/post-golden-lawn.jpg',
    'assets/mock/post-cat-table.jpg',
    'assets/mock/post-cat-treats.jpg',
    'assets/mock/post-cat-play.jpg',
    'assets/mock/empty-puppy.jpg'
  ]

  assert.equal(existsSync(distRoot), true, 'dist must exist before asset scan')

  const missingAssets = expectedAssets.filter((assetPath) => !existsSync(join(distRoot, assetPath)))

  assert.deepEqual(missingAssets, [])
})

test('mock visual asset directories do not keep svg placeholder leftovers', () => {
  const assetRoots = [
    resolve(__dirname, '../../src/assets/mock'),
    resolve(__dirname, '../../dist/assets/mock')
  ]
  const offenders = assetRoots.flatMap((assetRoot) =>
    readdirSync(assetRoot)
      .filter((entry) => /\.svg$/.test(entry))
      .map((entry) => relative(resolve(__dirname, '../..'), join(assetRoot, entry)))
  )

  assert.deepEqual(offenders, [])
})

test('mock visual constants use local photo assets instead of svg placeholders', () => {
  const assetsSource = readFileSync(resolve(__dirname, '../../src/constants/assets.ts'), 'utf8')

  assert.equal(/MOCK_IMAGES[\s\S]*\.svg/.test(assetsSource), false)
  assert.equal(assetsSource.includes('.jpg'), true)
})

test('local mock photo assets stay below the mini-program warning threshold', () => {
  const assetRoot = resolve(__dirname, '../../src/assets/mock')
  const photoAssets = readdirSync(assetRoot).filter((entry) => /\.(jpg|jpeg|png)$/.test(entry))
  const oversized = photoAssets.filter((entry) => statSync(join(assetRoot, entry)).size > 244 * 1024)

  assert.deepEqual(oversized, [])
})

test('tabbar icons are regenerated visual assets, not placeholder targets', () => {
  const tabbarRoot = resolve(__dirname, '../../src/assets/tabbar')
  const expectedHashes: Record<string, string> = {
    'feed-stitch-v3-active.png': '68a3b048c214c1fdf7a5875b89d9339c19107db4d4a4c898a10b9d8ad51f7e3c',
    'feed-stitch-v3.png': 'b531131a0b8a43c16995d8bb99f8838a5714380d6379ac00b1c26331b8833fd0',
    'invite-stitch-v2-active.png': '639f8366d9fcec85977755a843a311657e27c1e7674ac78f6ebca410efaec4a5',
    'invite-stitch-v2.png': '6340e177d73dc2a3bf6d4a07ba8d9c6b33709942805cf16e3370ac01cc66c8fc',
    'mine-stitch-v2-active.png': '31e3cad1e21c26ce658f15c4c90d10b113a9d528a528034053fb7c2388fa2e75',
    'mine-stitch-v2.png': '27a9cd0082cf993ad7253c633a7c038387f1147ced78198b49c85f027ddad913',
    'nearby-stitch-v2-active.png': '0dd256bfcc92bcf2f13a5d0c4780d46f08e8b815a7df42fa9a1e2358e97bd83e',
    'nearby-stitch-v2.png': 'c396536652412c7a15e8f3aa7208600bd609c67adb2de18a1612ad3c9973fd7b'
  }
  const iconAssets = readdirSync(tabbarRoot).filter((entry) => /\.png$/.test(entry)).sort()
  const actualHashes = Object.fromEntries(
    iconAssets.map((entry) => [
      entry,
      createHash('sha256').update(readFileSync(join(tabbarRoot, entry))).digest('hex')
    ])
  )

  assert.deepEqual(actualHashes, expectedHashes)
})

test('tabbar icons follow Stitch pin social mail person semantics', () => {
  const tabbarRoot = resolve(__dirname, '../../src/assets/tabbar')
  const assetsSource = readFileSync(resolve(__dirname, '../../src/constants/assets.ts'), 'utf8')
  const appConfigSource = readFileSync(resolve(__dirname, '../../src/app.config.ts'), 'utf8')
  const iconAssets = readdirSync(tabbarRoot).filter((entry) => /\.png$/.test(entry)).sort()

  assert.equal(appConfigSource.includes('assets/tabbar/nearby-stitch-v2.png'), true)
  assert.equal(appConfigSource.includes('assets/tabbar/feed-stitch-v3.png'), true)
  assert.equal(appConfigSource.includes('assets/tabbar/invite-stitch-v2.png'), true)
  assert.equal(appConfigSource.includes('assets/tabbar/mine-stitch-v2.png'), true)
  assert.equal(appConfigSource.includes('assets/tabbar/nearby.png'), false)
  assert.equal(appConfigSource.includes('assets/tabbar/feed.png'), false)
  assert.equal(appConfigSource.includes('assets/tabbar/feed-stitch-v2.png'), false)
  assert.equal(appConfigSource.includes('assets/tabbar/invite.png'), false)
  assert.equal(appConfigSource.includes('assets/tabbar/mine.png'), false)
  assert.equal(assetsSource.includes('tabbarSemantics'), true)
  assert.equal(assetsSource.includes("nearby: 'pin'"), true)
  assert.equal(assetsSource.includes("feed: 'pets'"), true)
  assert.equal(assetsSource.includes("feed: 'social'"), false)
  assert.equal(assetsSource.includes("invite: 'mail'"), true)
  assert.equal(assetsSource.includes("mine: 'person'"), true)
  assert.deepEqual(iconAssets, [
    'feed-stitch-v3-active.png',
    'feed-stitch-v3.png',
    'invite-stitch-v2-active.png',
    'invite-stitch-v2.png',
    'mine-stitch-v2-active.png',
    'mine-stitch-v2.png',
    'nearby-stitch-v2-active.png',
    'nearby-stitch-v2.png'
  ])
})

test('tabbar chrome follows Stitch cream surface and visible top border', () => {
  const appConfigSource = readFileSync(resolve(__dirname, '../../src/app.config.ts'), 'utf8')

  assert.match(appConfigSource, /tabBar:\s*\{[\s\S]*backgroundColor:\s*'#f7fbed'/)
  assert.match(appConfigSource, /tabBar:\s*\{[\s\S]*borderStyle:\s*'black'/)
  assert.match(appConfigSource, /tabBar:\s*\{[\s\S]*selectedColor:\s*'#326b00'/)
  assert.match(appConfigSource, /tabBar:\s*\{[\s\S]*color:\s*'#727a68'/)
})

test('WeChat project configs point at generated mini-program packages', () => {
  const configs = [
    {
      file: '../../../../project.config.json',
      expectedRoot: 'frontend/pet-social-mini/dist/'
    },
    {
      file: '../../project.config.json',
      expectedRoot: 'dist/'
    },
    {
      file: '../../dist/project.config.json',
      expectedRoot: './'
    }
  ]

  for (const { file, expectedRoot } of configs) {
    const projectConfig = JSON.parse(readFileSync(resolve(__dirname, file), 'utf8')) as {
      miniprogramRoot?: string
      compileType?: string
    }

    assert.equal(projectConfig.miniprogramRoot, expectedRoot, file)
    assert.equal(projectConfig.compileType, 'miniprogram', file)
  }
})
