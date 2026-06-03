import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const appConfig = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8')

const registeredPages = [...appConfig.matchAll(/'([^']+)'/g)]
  .map((match) => `/${match[1]}`)
  .filter((page) => page.startsWith('/pages/'))

const registered = new Set(registeredPages)

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    return fullPath.endsWith('.tsx') ? [fullPath] : []
  })
}

const pageFiles = walk(path.join(root, 'pages'))
const routeEdges = []

for (const file of pageFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const route = `/${file
    .replace(`${root}${path.sep}pages${path.sep}`, 'pages/')
    .replace(/\.tsx$/, '')
    .replace(/\\/g, '/')}`

  for (const match of source.matchAll(/(?:openPage|backOrHome)\(['"]([^'"]+)['"]/g)) {
    routeEdges.push({ source: route, file, target: match[1], kind: 'navigation-helper' })
  }

  for (const match of source.matchAll(/url:\s*['"]([^'"]+)['"]/g)) {
    routeEdges.push({ source: route, file, target: match[1], kind: 'url-prop' })
  }
}

const missingTargets = routeEdges.filter((edge) => (
  edge.target.startsWith('/pages/') && !registered.has(edge.target)
))

const reachable = new Set([
  '/pages/splash/index',
  '/pages/map/index',
  '/pages/feed/index',
  '/pages/encounter/index',
  '/pages/team/index',
  '/pages/profile/index',
  '/pages/design-system/index',
])

for (const edge of routeEdges) {
  if (registered.has(edge.target)) reachable.add(edge.target)
}

const registeredButNotTargeted = registeredPages.filter((page) => !reachable.has(page))

const requiredJourneys = {
  onboarding: [
    '/pages/splash/index',
    '/pages/login/index',
    '/pages/profile/pet-form',
    '/pages/permissions/index',
    '/pages/map/index',
  ],
  encounter: [
    '/pages/encounter/index',
    '/pages/matching-radar/index',
    '/pages/match-results/index',
    '/pages/encounter-waiting/index',
    '/pages/encounter-success/index',
    '/pages/meeting-point/index',
    '/pages/encounter-ongoing/index',
    '/pages/chat/index',
    '/pages/encounter-feedback/index',
    '/pages/wallet/index',
  ],
  community: [
    '/pages/feed/index',
    '/pages/post-flow/index',
    '/pages/sticker-edit/index',
  ],
  team: [
    '/pages/team/index',
    '/pages/team-create/index',
    '/pages/team-detail/index',
  ],
  profile: [
    '/pages/profile/index',
    '/pages/trophy-wall/index',
    '/pages/settings/index',
    '/pages/safety-center/index',
    '/pages/safety-privacy/index',
    '/pages/emergency/index',
  ],
  wallet: [
    '/pages/wallet/index',
    '/pages/wallet-tasks/index',
    '/pages/reward-shop/index',
  ],
}

const missingJourneyPages = Object.entries(requiredJourneys)
  .flatMap(([journey, pages]) => pages
    .filter((page) => !registered.has(page))
    .map((page) => ({ journey, page })))

const requiredEdges = [
  ['/pages/splash/index', '/pages/login/index'],
  ['/pages/login/index', '/pages/profile/pet-form'],
  ['/pages/profile/pet-form', '/pages/permissions/index'],
  ['/pages/permissions/index', '/pages/map/index'],
  ['/pages/map/index', '/pages/pet-detail/index'],
  ['/pages/map/index', '/pages/map-filter/index'],
  ['/pages/pet-detail/index', '/pages/encounter-waiting/index'],
  ['/pages/encounter/index', '/pages/matching-radar/index'],
  ['/pages/encounter/index', '/pages/match-results/index'],
  ['/pages/matching-radar/index', '/pages/match-results/index'],
  ['/pages/match-results/index', '/pages/encounter-waiting/index'],
  ['/pages/encounter-waiting/index', '/pages/encounter-success/index'],
  ['/pages/encounter-success/index', '/pages/meeting-point/index'],
  ['/pages/meeting-point/index', '/pages/encounter-ongoing/index'],
  ['/pages/encounter-ongoing/index', '/pages/chat/index'],
  ['/pages/encounter-ongoing/index', '/pages/encounter-feedback/index'],
  ['/pages/encounter-feedback/index', '/pages/wallet/index'],
  ['/pages/feed/index', '/pages/post-flow/index'],
  ['/pages/feed/index', '/pages/sticker-edit/index'],
  ['/pages/post-flow/index', '/pages/feed/index'],
  ['/pages/team/index', '/pages/team-detail/index'],
  ['/pages/team/index', '/pages/team-create/index'],
  ['/pages/team-create/index', '/pages/team-detail/index'],
  ['/pages/profile/index', '/pages/wallet/index'],
  ['/pages/profile/index', '/pages/trophy-wall/index'],
  ['/pages/profile/index', '/pages/settings/index'],
  ['/pages/profile/index', '/pages/safety-center/index'],
  ['/pages/settings/index', '/pages/safety-privacy/index'],
  ['/pages/safety-center/index', '/pages/safety-privacy/index'],
  ['/pages/safety-center/index', '/pages/emergency/index'],
  ['/pages/wallet/index', '/pages/wallet-tasks/index'],
  ['/pages/wallet/index', '/pages/reward-shop/index'],
]

const edgeSet = new Set(routeEdges.map((edge) => `${edge.source}->${edge.target}`))
const missingJourneyEdges = requiredEdges
  .filter(([source, target]) => !edgeSet.has(`${source}->${target}`))
  .map(([source, target]) => ({ source, target }))

const report = {
  registeredPages: registeredPages.length,
  routeEdges: routeEdges.length,
  missingTargets,
  registeredButNotTargeted,
  missingJourneyPages,
  missingJourneyEdges,
}

console.log(JSON.stringify(report, null, 2))

if (missingTargets.length || registeredButNotTargeted.length || missingJourneyPages.length || missingJourneyEdges.length) {
  process.exit(1)
}
