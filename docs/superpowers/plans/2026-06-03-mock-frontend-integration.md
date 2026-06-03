# Mock Front-End Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 33 `pawmigo-mini` pages dynamic and interactive off a persisted, simulated data layer, while keeping the real-backend swap a one-line flag flip.

**Architecture:** Four layers — Pages → per-domain Zustand stores (persisted to Taro storage) → a mock API that mimics a REST backend (async, latency) → a single seeded in-memory DB. `services/api.ts` routes mock-vs-real via `USE_MOCK`. Spec: `docs/superpowers/specs/2026-06-03-mock-frontend-integration-design.md`.

**Tech Stack:** Taro 3.6 + React + TypeScript, Zustand 4.5.5 (with `zustand/middleware` `persist`), existing `src/components/ui.tsx` design system. No path aliases — use relative imports.

---

## Conventions for every task

- **Verification per task** (this project has no UI unit-test harness; the spec keeps automated tests light): after each task run from `pawmigo-mini/`:
  - `npm run typecheck` → expected: exits 0, no errors.
  - For mock-logic tasks (Phase B) that include a `*.test.ts`, run that test file too.
- **Commit** at the end of each task with the message shown.
- **Never** hardcode brand colors/shadows in JSX (see `AGENTS.md`); reuse `app.scss` tokens and `ui.tsx`.
- All new domain types live in `src/services/api.ts` so both mock and real implementations share them.

---

## File Structure

**Create**
- `src/mock/delay.ts` — `delay(ms)`, `maybeFail(rate)`.
- `src/mock/seed.ts` — pure seed dataset (extends today's `src/data/mockData.ts`).
- `src/mock/db.ts` — mutable DB object, hydrate-from-storage / `persistDb()` / `resetDb()`.
- `src/services/mockApi.ts` — full async API over `db`.
- `src/services/realApi.ts` — real endpoints over `request.ts` (implemented ones + throwing stubs).
- `src/store/taroStorage.ts` — `persist` storage adapter for Taro.
- `src/store/sessionStore.ts`, `walkStore.ts`, `encounterStore.ts`, `feedStore.ts`, `teamStore.ts`, `walletStore.ts`, `chatStore.ts`, `profileStore.ts`.

**Modify**
- `src/services/api.ts` — full typed interface + `USE_MOCK` routing.
- All data-driven pages under `src/pages/**`.

**Delete**
- `src/store/appStore.ts`, `src/store/authStore.ts` (merged into new stores).
- `src/data/mockData.ts` (content moves to `src/mock/seed.ts`).

---

## PHASE A — Foundation

### Task A1: Simulated latency helpers

**Files:** Create `src/mock/delay.ts`

- [ ] **Step 1: Write the file**

```ts
// Centralized timings so "real-time" simulations are tunable in one place.
export const TIMINGS = {
  fast: 280,
  normal: 600,
  scan: 2200,
  autoAccept: 3200,
  chatReply: 1800,
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Returns true ~rate of the time (0..1). Default 0 keeps demos clean;
// raise locally to exercise error states.
export function maybeFail(rate = 0): boolean {
  return Math.random() < rate
}
```

- [ ] **Step 2: Verify** — `npm run typecheck` → exits 0.
- [ ] **Step 3: Commit**

```bash
git add src/mock/delay.ts
git commit -m "feat(mini): add mock latency helpers"
```

---

### Task A2: Domain types in api.ts

**Files:** Modify `src/services/api.ts`

Replace the file's type section so every domain type is declared here (mock + real share them). Keep the existing `User`, `Pet`, `PetInput`, `LoginResult` exactly, and ADD the rest. Do **not** wire routing yet (Task A6).

- [ ] **Step 1: Add these exported types** (append after the existing `LoginResult`):

```ts
export type DogSize = '小型' | '中型' | '大型'
export type MediaTone = 'park' | 'sunset' | 'river' | 'studio'
export type TeamType = '品种团' | '性格团' | '地点团'

export interface NearbyPet {
  id: number
  name: string
  breed: string
  avatar: string
  owner: string
  distance: string
  minutes: number
  size: DogSize
  personality: string[]
  route: string
  lng: number
  lat: number
}

export interface MapFilter {
  size?: DogSize | '全部'
  personality?: string | '全部'
}

export interface Comment {
  id: number
  postId: number
  author: string
  text: string
  time: string
}

export interface FeedPost {
  id: number
  petName: string
  breed: string
  location: string
  caption: string
  mediaTone: MediaTone
  stickers: string[]
  likes: number
  bones: number
  comments: number
  liked: boolean
}

export interface PostInput {
  caption: string
  location: string
  mediaTone: MediaTone
  stickers: string[]
}

export interface Team {
  id: number
  name: string
  type: TeamType
  tag: string
  members: number
  activity: string
  schedule: string
  vibe: string
  joined: boolean
}

export interface TeamInput {
  name: string
  type: TeamType
  tag: string
  schedule: string
}

export interface EncounterCandidate {
  id: number
  name: string
  breed: string
  distance: string
  score: number
  reason: string
  meetup: string
  window: string
}

export type EncounterStatus = 'waiting' | 'accepted' | 'meeting' | 'ongoing' | 'done'
export type EncounterMode = 'radar' | 'lasso' | 'swipe'

export interface Encounter {
  id: number
  targetId: number
  targetName: string
  status: EncounterStatus
  meetingPoint: string
  distanceLeft: number
  createdAt: number
}

export interface WalletTxn {
  id: number
  title: string
  amount: number // +earn / -spend
  time: string
}

export interface WalletTask {
  id: number
  title: string
  reward: number
  done: boolean
}

export interface ShopItem {
  id: number
  name: string
  cost: number
  tag: string
}

export interface ChatMessage {
  id: number
  peerId: number
  side: 'left' | 'right'
  name: string
  text: string
  time: string
}

export interface Trophy {
  id: number
  name: string
  desc: string
  unlocked: boolean
}

export interface SafetyItem {
  title: string
  meta: string
  ok: boolean
}

export interface AppNotification {
  id: number
  kind: 'encounter' | 'team' | 'bone' | 'system'
  text: string
  time: string
  read: boolean
}

export interface Settings {
  notifications: boolean
  preciseLocation: boolean
  camera: boolean
}
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0 (the existing `api` object still compiles; new types are unused for now).
- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat(mini): declare full domain types for mock+real api"
```

---

### Task A3: Seed dataset

**Files:** Create `src/mock/seed.ts` (move + extend `src/data/mockData.ts`)

- [ ] **Step 1: Create `src/mock/seed.ts`** importing types from `../services/api`. Port today's `demoUser`, `demoPets`, `nearbyPets`, `feedPosts`, `teams`, `encounterCandidates`, `stickerPacks` from `src/data/mockData.ts`, adapting to the new type shape (add `liked:false` to posts, `joined` to teams). Then add the missing collections. Full file:

```ts
import {
  AppNotification, ChatMessage, Comment, EncounterCandidate, FeedPost, NearbyPet,
  Pet, SafetyItem, Settings, ShopItem, Team, Trophy, User, WalletTask, WalletTxn,
} from '../services/api'

export interface SeedShape {
  user: User
  pets: Pet[]
  nearby: NearbyPet[]
  posts: FeedPost[]
  comments: Comment[]
  teams: Team[]
  candidates: EncounterCandidate[]
  wallet: WalletTxn[]
  walletTasks: WalletTask[]
  shop: ShopItem[]
  chats: ChatMessage[]
  trophies: Trophy[]
  safety: SafetyItem[]
  notifications: AppNotification[]
  settings: Settings
  stickerPacks: { name: string; status: string; count: number }[]
}

export function makeSeed(): SeedShape {
  return {
    user: { id: 1, nickname: '毛孩子主人', avatar: '', boneBalance: 128 },
    pets: [
      { id: 101, ownerId: 1, name: '豆豆', breed: '柯基', gender: '男', age: 3,
        personality: ['社牛', '短腿飞毛腿'], bio: '喜欢草坪、飞盘和所有路过的朋友。', boneCount: 86 },
      { id: 102, ownerId: 1, name: '雪球', breed: '萨摩耶', gender: '女', age: 2,
        personality: ['运动健将', '亲人'], bio: '微笑天使，傍晚固定滨江路线。', boneCount: 64 },
    ],
    nearby: [
      { id: 201, name: '阿黄', breed: '柴犬', avatar: '柴', owner: '林同学', distance: '260m', minutes: 18, size: '中型', personality: ['慢热', '爱闻草'], route: '梧桐道北段', lng: 121.478, lat: 31.232 },
      { id: 202, name: '奶盖', breed: '比熊', avatar: '比', owner: '小周', distance: '410m', minutes: 9, size: '小型', personality: ['社牛', '贴贴怪'], route: '口袋公园环线', lng: 121.481, lat: 31.229 },
      { id: 203, name: '黑糖', breed: '拉布拉多', avatar: '拉', owner: 'Mia', distance: '680m', minutes: 31, size: '大型', personality: ['运动健将', '球控'], route: '滨江慢跑道', lng: 121.474, lat: 31.226 },
      { id: 204, name: '饼干', breed: '柯基', avatar: '柯', owner: '许先生', distance: '820m', minutes: 12, size: '小型', personality: ['社牛', '短腿飞毛腿'], route: '社区花园', lng: 121.485, lat: 31.234 },
    ],
    posts: [
      { id: 301, petName: '奶盖', breed: '比熊', location: '口袋公园', caption: '今天主动学会把球叼回来了，奖励一整圈草坪巡逻。', mediaTone: 'park', stickers: ['比熊专属', '今日上墙'], likes: 48, bones: 19, comments: 7, liked: false },
      { id: 302, petName: '黑糖', breed: '拉布拉多', location: '滨江慢跑道', caption: '5 公里陪跑结束，回家前还想再找朋友玩十分钟。', mediaTone: 'river', stickers: ['运动健将', '骨头补给'], likes: 73, bones: 34, comments: 12, liked: false },
      { id: 303, petName: '饼干', breed: '柯基', location: '社区花园', caption: '短腿天团集合成功，今日队形：三角形。', mediaTone: 'sunset', stickers: ['短腿天团', '社牛'], likes: 62, bones: 27, comments: 9, liked: false },
    ],
    comments: [
      { id: 3001, postId: 301, author: '小周', text: '太棒了！下次一起遛', time: '10分钟前' },
      { id: 3002, postId: 301, author: 'Mia', text: '奶盖好乖', time: '5分钟前' },
      { id: 3003, postId: 302, author: '林同学', text: '体力真好', time: '1小时前' },
    ],
    teams: [
      { id: 401, name: '短腿天团', type: '品种团', tag: '柯基', members: 128, activity: '周三草坪短跑赛', schedule: '19:00 · 口袋公园', vibe: '低重心，高能量', joined: false },
      { id: 402, name: '社牛飞盘队', type: '性格团', tag: '社牛', members: 92, activity: '飞盘接力和新朋友破冰', schedule: '周六 16:30 · 滨江慢跑道', vibe: '见面三秒就开玩', joined: true },
      { id: 403, name: '滨江晚风团', type: '地点团', tag: '滨江', members: 214, activity: '日落路线打卡', schedule: '每天 18:40 · 亲水平台', vibe: '路线稳定，节奏轻松', joined: false },
    ],
    candidates: [
      { id: 501, name: '奶盖', breed: '比熊', distance: '410m', score: 96, reason: '同样社牛，体型接近，最近路线重叠 3 次', meetup: '口袋公园东门', window: '18:45-19:10' },
      { id: 502, name: '饼干', breed: '柯基', distance: '820m', score: 91, reason: '同品种，短跑偏好一致', meetup: '社区花园喷泉旁', window: '19:00-19:20' },
      { id: 503, name: '阿黄', breed: '柴犬', distance: '260m', score: 88, reason: '距离最近，活跃时间吻合', meetup: '梧桐道北段入口', window: '18:30-19:00' },
    ],
    wallet: [
      { id: 6001, title: '完成一次偶遇反馈', amount: 12, time: '今天 18:20' },
      { id: 6002, title: '给大福投喂骨头', amount: -8, time: '昨天 20:12' },
      { id: 6003, title: '队伍周任务奖励', amount: 30, time: '05/28 09:10' },
    ],
    walletTasks: [
      { id: 7001, title: '完成今日首遛打卡', reward: 5, done: false },
      { id: 7002, title: '发布一条宠物动态', reward: 8, done: false },
      { id: 7003, title: '完成一次偶遇反馈', reward: 12, done: false },
    ],
    shop: [
      { id: 8001, name: '限定品种贴纸包', cost: 60, tag: '贴纸' },
      { id: 8002, name: '偶遇加速卡', cost: 40, tag: '权益' },
      { id: 8003, name: '主页炫彩边框', cost: 120, tag: '装扮' },
    ],
    chats: [
      { id: 9001, peerId: 501, side: 'left', name: '奶盖家长', text: '我们已经到口袋公园东门啦。', time: '18:42' },
      { id: 9002, peerId: 501, side: 'right', name: '我', text: '收到，我还有 120m。', time: '18:43' },
    ],
    trophies: [
      { id: 1101, name: '初次偶遇', desc: '完成第一次偶遇遛', unlocked: true },
      { id: 1102, name: '社交达人', desc: '累计偶遇 10 次', unlocked: true },
      { id: 1103, name: '骨头富翁', desc: '骨头余额超过 100', unlocked: true },
      { id: 1104, name: '人气王', desc: '单帖获赞超过 50', unlocked: true },
      { id: 1105, name: '常驻玩家', desc: '连续 7 天活跃', unlocked: true },
      { id: 1106, name: '夜遛侠', desc: '完成 5 次夜间偶遇', unlocked: false },
    ],
    safety: [
      { title: '实名认证', meta: '已完成', ok: true },
      { title: '疫苗记录', meta: '2026.05 已更新', ok: true },
      { title: '位置脱敏', meta: '200m 模糊展示', ok: true },
      { title: '黑名单与屏蔽', meta: '0 个风险对象', ok: true },
    ],
    notifications: [
      { id: 1201, kind: 'encounter', text: '奶盖 接受了你的偶遇邀约', time: '5分钟前', read: false },
      { id: 1202, kind: 'bone', text: '黑糖 给你投喂了 3 根骨头', time: '1小时前', read: false },
      { id: 1203, kind: 'team', text: '社牛飞盘队 发布了新活动', time: '昨天', read: true },
    ],
    settings: { notifications: true, preciseLocation: true, camera: true },
    stickerPacks: [
      { name: '短腿天团', status: '已解锁', count: 12 },
      { name: '微笑天使', status: '待解锁', count: 9 },
      { name: '飞盘火花', status: '活动兑换', count: 6 },
    ],
  }
}
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit**

```bash
git add src/mock/seed.ts
git commit -m "feat(mini): add full seed dataset"
```

---

### Task A4: Mutable mock DB with persistence

**Files:** Create `src/mock/db.ts`

- [ ] **Step 1: Write the file**

```ts
import Taro from '@tarojs/taro'
import { makeSeed, SeedShape } from './seed'

const DB_KEY = 'pawmigo:db'

function load(): SeedShape {
  try {
    const raw = Taro.getStorageSync<string>(DB_KEY)
    if (raw) return JSON.parse(raw) as SeedShape
  } catch {
    // fall through to seed
  }
  return makeSeed()
}

export const db: SeedShape = load()

export function persistDb(): void {
  try {
    Taro.setStorageSync(DB_KEY, JSON.stringify(db))
  } catch {
    // best-effort; ignore quota/serialization issues in mock
  }
}

export function resetDb(): void {
  const fresh = makeSeed()
  ;(Object.keys(fresh) as (keyof SeedShape)[]).forEach((k) => {
    // mutate in place so the exported `db` reference stays valid
    ;(db as Record<string, unknown>)[k as string] = fresh[k]
  })
  persistDb()
}

// Monotonic id generator for new mock records.
let counter = Date.now()
export function nextId(): number {
  counter += 1
  return counter
}
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit**

```bash
git add src/mock/db.ts
git commit -m "feat(mini): add persisted mutable mock db"
```

---

### Task A5: Taro storage adapter for Zustand persist

**Files:** Create `src/store/taroStorage.ts`

- [ ] **Step 1: Write the file**

```ts
import Taro from '@tarojs/taro'
import { StateStorage } from 'zustand/middleware'

export const taroStorage: StateStorage = {
  getItem: (name) => {
    try {
      return Taro.getStorageSync<string>(name) || null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      Taro.setStorageSync(name, value)
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      Taro.removeStorageSync(name)
    } catch {
      // ignore
    }
  },
}
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit**

```bash
git add src/store/taroStorage.ts
git commit -m "feat(mini): add Taro storage adapter for zustand persist"
```

---

## PHASE B — Mock API

### Task B1: Mock API implementation

**Files:** Create `src/services/mockApi.ts`, `src/services/mockApi.test.ts`

- [ ] **Step 1: Write the failing test** `src/services/mockApi.test.ts`

```ts
import { resetDb } from '../mock/db'
import { mockApi } from './mockApi'

describe('mockApi', () => {
  beforeEach(() => resetDb())

  it('wxLogin returns a token and user', async () => {
    const res = await mockApi.wxLogin('code')
    expect(res.token).toBeTruthy()
    expect(res.user.id).toBe(1)
  })

  it('createPet appends a pet returned by me()', async () => {
    const pet = await mockApi.createPet({ name: '测试宠', breed: '柯基' })
    expect(pet.name).toBe('测试宠')
    const { pets } = await mockApi.me()
    expect(pets.some((p) => p.id === pet.id)).toBe(true)
  })

  it('tipBone debits wallet and credits the post', async () => {
    const before = (await mockApi.getWallet()).balance
    const post = (await mockApi.getFeed('附近'))[0]
    const updated = await mockApi.tipBone(post.id, 5)
    expect(updated.bones).toBe(post.bones + 5)
    expect((await mockApi.getWallet()).balance).toBe(before - 5)
  })

  it('redeem blocks when balance insufficient', async () => {
    await expect(mockApi.redeem(8003, 999999)).rejects.toThrow()
  })

  it('encounter flow advances status to done', async () => {
    const e = await mockApi.createEncounter(501)
    expect(e.status).toBe('waiting')
    await mockApi.acceptEncounter(e.id)
    await mockApi.confirmMeetingPoint(e.id, '口袋公园东门')
    const done = await mockApi.submitFeedback(e.id, 5, ['守时'])
    expect(done.status).toBe('done')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/mockApi.test.ts` (or `npm test` if configured)
Expected: FAIL — `Cannot find module './mockApi'`.

> Note: if no Jest is configured in `pawmigo-mini`, skip the automated test (`rm` the test file) and instead verify this task with `npm run typecheck` only. Record which path you took in the commit body.

- [ ] **Step 3: Write `src/services/mockApi.ts`**

```ts
import { db, nextId, persistDb } from '../mock/db'
import { delay, maybeFail, TIMINGS } from '../mock/delay'
import {
  AppNotification, ChatMessage, Comment, Encounter, EncounterCandidate, EncounterMode,
  FeedPost, LoginResult, MapFilter, NearbyPet, Pet, PetInput, PostInput, Settings,
  ShopItem, Team, TeamInput, Trophy, User, WalletTask, WalletTxn,
} from './api'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

// Active in-progress encounter kept in module memory (not persisted).
let activeEncounter: Encounter | null = null

export const mockApi = {
  // --- auth / pet ---
  async wxLogin(_code: string): Promise<LoginResult> {
    await delay(TIMINGS.normal)
    return { token: `mock.${nextId()}`, user: clone(db.user) }
  },
  async me(): Promise<{ user: User; pets: Pet[] }> {
    await delay(TIMINGS.fast)
    return { user: clone(db.user), pets: clone(db.pets) }
  },
  async getPet(id: number): Promise<Pet> {
    await delay(TIMINGS.fast)
    const pet = db.pets.find((p) => p.id === id) || db.pets[0]
    return clone(pet)
  },
  async createPet(input: PetInput): Promise<Pet> {
    await delay(TIMINGS.normal)
    const pet: Pet = {
      id: nextId(), ownerId: db.user.id, name: input.name || '我的宝贝',
      breed: input.breed || '未知', gender: input.gender || '男', age: input.age ?? 1,
      personality: input.personality || [], bio: input.bio || '', boneCount: 0,
    }
    db.pets.unshift(pet)
    persistDb()
    return clone(pet)
  },
  async updatePet(id: number, input: PetInput): Promise<Pet> {
    await delay(TIMINGS.normal)
    const pet = db.pets.find((p) => p.id === id)
    if (!pet) throw new Error('宠物不存在')
    Object.assign(pet, input)
    persistDb()
    return clone(pet)
  },

  // --- map / walk ---
  async getNearbyWalkers(filter?: MapFilter): Promise<NearbyPet[]> {
    await delay(TIMINGS.normal)
    if (maybeFail()) throw new Error('附近信号弱，请重试')
    let list = db.nearby
    if (filter?.size && filter.size !== '全部') list = list.filter((p) => p.size === filter.size)
    if (filter?.personality && filter.personality !== '全部') {
      list = list.filter((p) => p.personality.includes(filter.personality as string))
    }
    return clone(list)
  },
  async setWalkingStatus(on: boolean): Promise<{ walking: boolean }> {
    await delay(TIMINGS.fast)
    return { walking: on }
  },

  // --- encounter ---
  async getCandidates(_mode: EncounterMode): Promise<EncounterCandidate[]> {
    await delay(TIMINGS.scan)
    return clone(db.candidates)
  },
  async createEncounter(targetId: number): Promise<Encounter> {
    await delay(TIMINGS.fast)
    const target = db.candidates.find((c) => c.id === targetId)
    activeEncounter = {
      id: nextId(), targetId, targetName: target?.name || '伙伴',
      status: 'waiting', meetingPoint: target?.meetup || '附近公园', distanceLeft: 120,
      createdAt: Date.now(),
    }
    return clone(activeEncounter)
  },
  async acceptEncounter(id: number): Promise<Encounter> {
    await delay(TIMINGS.fast)
    if (!activeEncounter || activeEncounter.id !== id) throw new Error('邀约已失效')
    activeEncounter.status = 'accepted'
    return clone(activeEncounter)
  },
  async confirmMeetingPoint(id: number, point: string): Promise<Encounter> {
    await delay(TIMINGS.fast)
    if (!activeEncounter || activeEncounter.id !== id) throw new Error('邀约已失效')
    activeEncounter.status = 'meeting'
    activeEncounter.meetingPoint = point
    return clone(activeEncounter)
  },
  async submitFeedback(id: number, rating: number, _tags: string[]): Promise<Encounter> {
    await delay(TIMINGS.normal)
    if (!activeEncounter || activeEncounter.id !== id) throw new Error('邀约已失效')
    activeEncounter.status = 'done'
    const reward = 12
    db.wallet.unshift({ id: nextId(), title: '完成一次偶遇反馈', amount: reward, time: '刚刚' })
    db.user.boneBalance += reward
    persistDb()
    const result = clone(activeEncounter)
    activeEncounter = null
    return result
  },

  // --- feed ---
  async getFeed(_tab: string): Promise<FeedPost[]> {
    await delay(TIMINGS.normal)
    return clone(db.posts)
  },
  async likePost(id: number): Promise<FeedPost> {
    await delay(TIMINGS.fast)
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('动态不存在')
    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1
    persistDb()
    return clone(post)
  },
  async tipBone(id: number, amount: number): Promise<FeedPost> {
    await delay(TIMINGS.fast)
    const post = db.posts.find((p) => p.id === id)
    if (!post) throw new Error('动态不存在')
    if (db.user.boneBalance < amount) throw new Error('骨头余额不足')
    post.bones += amount
    db.user.boneBalance -= amount
    db.wallet.unshift({ id: nextId(), title: `给 ${post.petName} 投喂骨头`, amount: -amount, time: '刚刚' })
    persistDb()
    return clone(post)
  },
  async getComments(postId: number): Promise<Comment[]> {
    await delay(TIMINGS.fast)
    return clone(db.comments.filter((c) => c.postId === postId))
  },
  async addComment(postId: number, text: string): Promise<Comment> {
    await delay(TIMINGS.fast)
    const c: Comment = { id: nextId(), postId, author: '我', text, time: '刚刚' }
    db.comments.push(c)
    const post = db.posts.find((p) => p.id === postId)
    if (post) post.comments += 1
    persistDb()
    return clone(c)
  },
  async createPost(input: PostInput): Promise<FeedPost> {
    await delay(TIMINGS.normal)
    const pet = db.pets[0]
    const post: FeedPost = {
      id: nextId(), petName: pet?.name || '我的宝贝', breed: pet?.breed || '',
      location: input.location, caption: input.caption, mediaTone: input.mediaTone,
      stickers: input.stickers, likes: 0, bones: 0, comments: 0, liked: false,
    }
    db.posts.unshift(post)
    persistDb()
    return clone(post)
  },

  // --- teams ---
  async getTeams(query?: string): Promise<Team[]> {
    await delay(TIMINGS.normal)
    let list = db.teams
    if (query) list = list.filter((t) => t.name.includes(query) || t.tag.includes(query))
    return clone(list)
  },
  async getTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id) || db.teams[0]
    return clone(t)
  },
  async joinTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id)
    if (!t) throw new Error('队伍不存在')
    if (!t.joined) { t.joined = true; t.members += 1 }
    persistDb()
    return clone(t)
  },
  async leaveTeam(id: number): Promise<Team> {
    await delay(TIMINGS.fast)
    const t = db.teams.find((x) => x.id === id)
    if (!t) throw new Error('队伍不存在')
    if (t.joined) { t.joined = false; t.members -= 1 }
    persistDb()
    return clone(t)
  },
  async createTeam(input: TeamInput): Promise<Team> {
    await delay(TIMINGS.normal)
    const t: Team = {
      id: nextId(), name: input.name, type: input.type, tag: input.tag,
      members: 1, activity: '新队伍招募中', schedule: input.schedule, vibe: '刚刚成立', joined: true,
    }
    db.teams.unshift(t)
    persistDb()
    return clone(t)
  },

  // --- wallet ---
  async getWallet(): Promise<{ balance: number; ledger: WalletTxn[] }> {
    await delay(TIMINGS.fast)
    return { balance: db.user.boneBalance, ledger: clone(db.wallet) }
  },
  async getWalletTasks(): Promise<WalletTask[]> {
    await delay(TIMINGS.fast)
    return clone(db.walletTasks)
  },
  async claimTask(id: number): Promise<{ balance: number; tasks: WalletTask[] }> {
    await delay(TIMINGS.fast)
    const task = db.walletTasks.find((t) => t.id === id)
    if (!task) throw new Error('任务不存在')
    if (!task.done) {
      task.done = true
      db.user.boneBalance += task.reward
      db.wallet.unshift({ id: nextId(), title: task.title, amount: task.reward, time: '刚刚' })
    }
    persistDb()
    return { balance: db.user.boneBalance, tasks: clone(db.walletTasks) }
  },
  async getShop(): Promise<ShopItem[]> {
    await delay(TIMINGS.fast)
    return clone(db.shop)
  },
  async redeem(itemId: number, costOverride?: number): Promise<{ balance: number }> {
    await delay(TIMINGS.normal)
    const item = db.shop.find((s) => s.id === itemId)
    const cost = costOverride ?? item?.cost ?? 0
    if (db.user.boneBalance < cost) throw new Error('骨头余额不足')
    db.user.boneBalance -= cost
    db.wallet.unshift({ id: nextId(), title: `兑换 ${item?.name || '权益'}`, amount: -cost, time: '刚刚' })
    persistDb()
    return { balance: db.user.boneBalance }
  },

  // --- chat ---
  async getChat(peerId: number): Promise<ChatMessage[]> {
    await delay(TIMINGS.fast)
    return clone(db.chats.filter((m) => m.peerId === peerId))
  },
  async sendMessage(peerId: number, text: string): Promise<ChatMessage> {
    await delay(TIMINGS.fast)
    const msg: ChatMessage = { id: nextId(), peerId, side: 'right', name: '我', text, time: now() }
    db.chats.push(msg)
    persistDb()
    return clone(msg)
  },
  async simulateReply(peerId: number): Promise<ChatMessage> {
    await delay(TIMINGS.chatReply)
    const reply: ChatMessage = { id: nextId(), peerId, side: 'left', name: '对方', text: '好的，路上注意安全～', time: now() }
    db.chats.push(reply)
    persistDb()
    return clone(reply)
  },

  // --- profile ---
  async getTrophies(): Promise<Trophy[]> {
    await delay(TIMINGS.fast)
    return clone(db.trophies)
  },
  async getSafety(): Promise<{ score: number; items: typeof db.safety }> {
    await delay(TIMINGS.fast)
    return { score: 98, items: clone(db.safety) }
  },
  async getNotifications(): Promise<AppNotification[]> {
    await delay(TIMINGS.fast)
    return clone(db.notifications)
  },
  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    await delay(TIMINGS.fast)
    Object.assign(db.settings, patch)
    persistDb()
    return clone(db.settings)
  },
}

export type MockApi = typeof mockApi
```

- [ ] **Step 4: Run test to verify it passes** (if Jest present)

Run: `npx jest src/services/mockApi.test.ts`
Expected: PASS (5 tests). Otherwise: `npm run typecheck` → 0.

- [ ] **Step 5: Commit**

```bash
git add src/services/mockApi.ts src/services/mockApi.test.ts
git commit -m "feat(mini): implement full mock api over seeded db"
```

---

### Task B2: Real API stub + USE_MOCK routing

**Files:** Create `src/services/realApi.ts`; Modify `src/services/api.ts`

- [ ] **Step 1: Create `src/services/realApi.ts`**

```ts
import { request } from './request'
import { LoginResult, MockApi, Pet, PetInput, User } from './api'
import { mockApi } from './mockApi'

// Only these endpoints exist on the Go backend today. Everything else falls
// back to the mock implementation so the app still runs end-to-end.
const realImpl = {
  wxLogin: (code: string) => request<LoginResult>('POST', '/auth/wx-login', { code }),
  me: () => request<{ user: User; pets: Pet[] }>('GET', '/me'),
  createPet: (input: PetInput) => request<Pet>('POST', '/pets', input),
  updatePet: (id: number, input: PetInput) => request<Pet>('PUT', `/pets/${id}`, input),
}

// Compose: real where implemented, mock for the rest. Keeps a single api shape.
export const realApi: MockApi = { ...mockApi, ...realImpl }
```

- [ ] **Step 2: Modify `src/services/api.ts`** — at the very bottom, replace the existing `export const api = { ... }` object with the routing export. Keep ALL type declarations above untouched.

```ts
import { mockApi } from './mockApi'
import { realApi } from './realApi'

// Flip to false to use the real backend (where endpoints are implemented).
export const USE_MOCK = true

export const api = USE_MOCK ? mockApi : realApi
```

> Remove the old inline `api` object and its `import { request } from './request'` (now used only by `realApi.ts`). `request` import stays in `realApi.ts`.

- [ ] **Step 3: Verify** — `npm run typecheck` → 0. Confirm `api.wxLogin`, `api.me`, `api.createPet`, `api.updatePet` still resolve (used by stores next).
- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts src/services/realApi.ts
git commit -m "feat(mini): route api via USE_MOCK flag (mock+real composition)"
```

---

## PHASE C — Stores

> Each store uses `persist` with the `taroStorage` adapter and a unique key. Pattern for every store:
> ```ts
> import { create } from 'zustand'
> import { persist, createJSONStorage } from 'zustand/middleware'
> import { taroStorage } from './taroStorage'
> ```
> Wrap only the **persisted** slice; transient flags (loading/error) use `partialize` to stay out of storage.

### Task C1: sessionStore (replaces authStore)

**Files:** Create `src/store/sessionStore.ts`

- [ ] **Step 1: Write the file**

```ts
import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { taroStorage } from './taroStorage'
import { resetDb } from '../mock/db'
import { api } from '../services/api'
import { Pet, PetInput, User } from '../services/api'

interface SessionState {
  user: User | null
  pets: Pet[]
  activePetId: number | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  refreshMe: () => Promise<void>
  createPet: (input: PetInput) => Promise<Pet>
  setActivePet: (id: number) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      pets: [],
      activePetId: null,
      loading: false,
      error: null,
      login: async () => {
        set({ loading: true, error: null })
        try {
          const { code } = await Taro.login()
          const res = await api.wxLogin(code)
          Taro.setStorageSync('jwt', res.token)
          set({ user: res.user })
          await get().refreshMe()
        } catch (e) {
          set({ error: (e as Error).message })
          throw e
        } finally {
          set({ loading: false })
        }
      },
      refreshMe: async () => {
        const { user, pets } = await api.me()
        set({ user, pets, activePetId: get().activePetId ?? pets[0]?.id ?? null })
      },
      createPet: async (input) => {
        const pet = await api.createPet(input)
        set((s) => ({ pets: [pet, ...s.pets], activePetId: pet.id }))
        return pet
      },
      setActivePet: (id) => set({ activePetId: id }),
      logout: () => {
        Taro.removeStorageSync('jwt')
        resetDb()
        set({ user: null, pets: [], activePetId: null, error: null })
      },
    }),
    {
      name: 'pawmigo:session',
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({ user: s.user, pets: s.pets, activePetId: s.activePetId }),
    },
  ),
)
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/sessionStore.ts && git commit -m "feat(mini): add persisted sessionStore"`

---

### Task C2: walkStore

**Files:** Create `src/store/walkStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { taroStorage } from './taroStorage'
import { api, MapFilter, NearbyPet } from '../services/api'

interface WalkState {
  walking: boolean
  walkEndsAt: number | null // epoch ms when the 60-min session times out
  filter: MapFilter
  nearby: NearbyPet[]
  loading: boolean
  error: string | null
  loadNearby: () => Promise<void>
  setFilter: (filter: MapFilter) => Promise<void>
  toggleWalking: () => Promise<void>
}

const WALK_MS = 60 * 60 * 1000

export const useWalkStore = create<WalkState>()(
  persist(
    (set, get) => ({
      walking: false,
      walkEndsAt: null,
      filter: { size: '全部', personality: '全部' },
      nearby: [],
      loading: false,
      error: null,
      loadNearby: async () => {
        set({ loading: true, error: null })
        try {
          const nearby = await api.getNearbyWalkers(get().filter)
          set({ nearby })
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },
      setFilter: async (filter) => {
        set({ filter })
        await get().loadNearby()
      },
      toggleWalking: async () => {
        const next = !get().walking
        await api.setWalkingStatus(next)
        set({ walking: next, walkEndsAt: next ? Date.now() + WALK_MS : null })
      },
    }),
    {
      name: 'pawmigo:walk',
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({ walking: s.walking, walkEndsAt: s.walkEndsAt, filter: s.filter }),
    },
  ),
)
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/walkStore.ts && git commit -m "feat(mini): add walkStore with 我在遛 timeout"`

---

### Task C3: encounterStore

**Files:** Create `src/store/encounterStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { api, Encounter, EncounterCandidate, EncounterMode } from '../services/api'
import { delay, TIMINGS } from '../mock/delay'

interface EncounterState {
  mode: EncounterMode
  candidates: EncounterCandidate[]
  swipeIndex: number
  active: Encounter | null
  scanning: boolean
  loading: boolean
  error: string | null
  setMode: (mode: EncounterMode) => void
  scan: () => Promise<void>
  nextSwipe: () => void
  invite: (targetId: number) => Promise<Encounter>
  waitForAccept: () => Promise<Encounter> // simulated auto-accept
  acceptNow: () => Promise<Encounter> // manual shortcut
  confirmPoint: (point: string) => Promise<Encounter>
  finish: (rating: number, tags: string[]) => Promise<Encounter>
  reset: () => void
}

export const useEncounterStore = create<EncounterState>((set, get) => ({
  mode: 'radar',
  candidates: [],
  swipeIndex: 0,
  active: null,
  scanning: false,
  loading: false,
  error: null,
  setMode: (mode) => set({ mode }),
  scan: async () => {
    set({ scanning: true, error: null })
    try {
      const candidates = await api.getCandidates(get().mode)
      set({ candidates, swipeIndex: 0 })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ scanning: false })
    }
  },
  nextSwipe: () => set((s) => ({ swipeIndex: s.swipeIndex + 1 })),
  invite: async (targetId) => {
    const active = await api.createEncounter(targetId)
    set({ active })
    return active
  },
  waitForAccept: async () => {
    await delay(TIMINGS.autoAccept)
    const id = get().active?.id
    if (!id) throw new Error('邀约已失效')
    const active = await api.acceptEncounter(id)
    set({ active })
    return active
  },
  acceptNow: async () => {
    const id = get().active?.id
    if (!id) throw new Error('邀约已失效')
    const active = await api.acceptEncounter(id)
    set({ active })
    return active
  },
  confirmPoint: async (point) => {
    const id = get().active?.id
    if (!id) throw new Error('邀约已失效')
    const active = await api.confirmMeetingPoint(id, point)
    set({ active })
    return active
  },
  finish: async (rating, tags) => {
    const id = get().active?.id
    if (!id) throw new Error('邀约已失效')
    const active = await api.submitFeedback(id, rating, tags)
    set({ active })
    return active
  },
  reset: () => set({ active: null, candidates: [], swipeIndex: 0 }),
}))
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/encounterStore.ts && git commit -m "feat(mini): add encounterStore with simulated accept flow"`

---

### Task C4: feedStore

**Files:** Create `src/store/feedStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { api, Comment, FeedPost, PostInput } from '../services/api'

interface FeedState {
  tab: string
  posts: FeedPost[]
  comments: Record<number, Comment[]>
  loading: boolean
  error: string | null
  setTab: (tab: string) => Promise<void>
  load: () => Promise<void>
  like: (id: number) => Promise<void>
  tip: (id: number, amount: number) => Promise<void>
  loadComments: (postId: number) => Promise<void>
  comment: (postId: number, text: string) => Promise<void>
  publish: (input: PostInput) => Promise<FeedPost>
}

export const useFeedStore = create<FeedState>((set, get) => ({
  tab: '附近',
  posts: [],
  comments: {},
  loading: false,
  error: null,
  setTab: async (tab) => { set({ tab }); await get().load() },
  load: async () => {
    set({ loading: true, error: null })
    try {
      set({ posts: await api.getFeed(get().tab) })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },
  like: async (id) => {
    const updated = await api.likePost(id)
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? updated : p)) }))
  },
  tip: async (id, amount) => {
    const updated = await api.tipBone(id, amount)
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? updated : p)) }))
  },
  loadComments: async (postId) => {
    const list = await api.getComments(postId)
    set((s) => ({ comments: { ...s.comments, [postId]: list } }))
  },
  comment: async (postId, text) => {
    const c = await api.addComment(postId, text)
    set((s) => ({
      comments: { ...s.comments, [postId]: [...(s.comments[postId] || []), c] },
      posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)),
    }))
  },
  publish: async (input) => {
    const post = await api.createPost(input)
    set((s) => ({ posts: [post, ...s.posts] }))
    return post
  },
}))
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/feedStore.ts && git commit -m "feat(mini): add feedStore"`

---

### Task C5: teamStore

**Files:** Create `src/store/teamStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { api, Team, TeamInput } from '../services/api'

interface TeamState {
  teams: Team[]
  query: string
  loading: boolean
  error: string | null
  load: () => Promise<void>
  search: (query: string) => Promise<void>
  toggleJoin: (id: number) => Promise<void>
  create: (input: TeamInput) => Promise<Team>
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  query: '',
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null })
    try {
      set({ teams: await api.getTeams(get().query) })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },
  search: async (query) => { set({ query }); await get().load() },
  toggleJoin: async (id) => {
    const team = get().teams.find((t) => t.id === id)
    const updated = team?.joined ? await api.leaveTeam(id) : await api.joinTeam(id)
    set((s) => ({ teams: s.teams.map((t) => (t.id === id ? updated : t)) }))
  },
  create: async (input) => {
    const team = await api.createTeam(input)
    set((s) => ({ teams: [team, ...s.teams] }))
    return team
  },
}))
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/teamStore.ts && git commit -m "feat(mini): add teamStore"`

---

### Task C6: walletStore

**Files:** Create `src/store/walletStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { api, ShopItem, WalletTask, WalletTxn } from '../services/api'

interface WalletState {
  balance: number
  ledger: WalletTxn[]
  tasks: WalletTask[]
  shop: ShopItem[]
  loading: boolean
  error: string | null
  load: () => Promise<void>
  loadTasks: () => Promise<void>
  claim: (id: number) => Promise<void>
  loadShop: () => Promise<void>
  redeem: (itemId: number) => Promise<void>
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  ledger: [],
  tasks: [],
  shop: [],
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null })
    try {
      const { balance, ledger } = await api.getWallet()
      set({ balance, ledger })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ loading: false })
    }
  },
  loadTasks: async () => set({ tasks: await api.getWalletTasks() }),
  claim: async (id) => {
    const { balance, tasks } = await api.claimTask(id)
    set({ balance, tasks })
  },
  loadShop: async () => set({ shop: await api.getShop() }),
  redeem: async (itemId) => {
    const { balance } = await api.redeem(itemId)
    set({ balance })
  },
}))
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/walletStore.ts && git commit -m "feat(mini): add walletStore ledger"`

---

### Task C7: chatStore

**Files:** Create `src/store/chatStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { api, ChatMessage } from '../services/api'
import { mockApi } from '../services/mockApi'

interface ChatState {
  peerId: number | null
  messages: ChatMessage[]
  loading: boolean
  open: (peerId: number) => Promise<void>
  send: (text: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  peerId: null,
  messages: [],
  loading: false,
  open: async (peerId) => {
    set({ peerId, loading: true })
    try {
      set({ messages: await api.getChat(peerId) })
    } finally {
      set({ loading: false })
    }
  },
  send: async (text) => {
    const peerId = get().peerId
    if (!peerId) return
    const msg = await api.sendMessage(peerId, text)
    set((s) => ({ messages: [...s.messages, msg] }))
    // Simulated reply (mock-only helper).
    mockApi.simulateReply(peerId).then((reply) => {
      if (get().peerId === peerId) set((s) => ({ messages: [...s.messages, reply] }))
    })
  },
}))
```

> Note: `simulateReply` is a mock-only affordance, so this store imports `mockApi` directly. When the real backend lands, replace with a websocket/poll.

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/chatStore.ts && git commit -m "feat(mini): add chatStore with simulated reply"`

---

### Task C8: profileStore

**Files:** Create `src/store/profileStore.ts`

- [ ] **Step 1: Write the file**

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { taroStorage } from './taroStorage'
import { api, AppNotification, SafetyItem, Settings, Trophy } from '../services/api'

interface ProfileState {
  trophies: Trophy[]
  safetyScore: number
  safety: SafetyItem[]
  notifications: AppNotification[]
  settings: Settings
  loadTrophies: () => Promise<void>
  loadSafety: () => Promise<void>
  loadNotifications: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      trophies: [],
      safetyScore: 0,
      safety: [],
      notifications: [],
      settings: { notifications: true, preciseLocation: true, camera: true },
      loadTrophies: async () => set({ trophies: await api.getTrophies() }),
      loadSafety: async () => {
        const { score, items } = await api.getSafety()
        set({ safetyScore: score, safety: items })
      },
      loadNotifications: async () => set({ notifications: await api.getNotifications() }),
      updateSettings: async (patch) => set({ settings: await api.updateSettings(patch) }),
    }),
    {
      name: 'pawmigo:profile',
      storage: createJSONStorage(() => taroStorage),
      partialize: (s) => ({ settings: s.settings }),
    },
  ),
)
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/store/profileStore.ts && git commit -m "feat(mini): add profileStore"`

---

### Task C9: Delete legacy stores + mockData

**Files:** Delete `src/store/appStore.ts`, `src/store/authStore.ts`, `src/data/mockData.ts`

- [ ] **Step 1:** Confirm no remaining imports: run `grep -rn "appStore\|authStore\|data/mockData" src/`. The only hits should be the page files rewired in Phase D+. If any page still imports them at this point, that page is wired in a later task — leave the legacy file until Phase D begins, OR rewire those references now if doing Phase C standalone.
- [ ] **Step 2:** Delete the three files once Phase D rewiring removes their last importers. (Map currently imports `appStore`; encounter uses local state. Defer deletion to Task D-map / end of Phase D.)
- [ ] **Step 3: Commit** (after Phase D) — `git rm src/store/appStore.ts src/store/authStore.ts src/data/mockData.ts && git commit -m "chore(mini): remove legacy stores and mockData"`

---

## PHASE D — Page wiring

> **Wiring pattern (applies to every page below).** Each page task means: open the existing page file, remove its hardcoded array/object, import the relevant store + types, read state via selectors, call actions in `onClick`, and add the three states:
> - **loading:** while `store.loading` is true and no data yet, render a simple centered `<Text className='muted'>加载中…</Text>` inside the existing content container.
> - **empty:** when the loaded list is empty, render a friendly line (e.g. `<Text className='muted'>附近暂时没有在遛的伙伴，换个筛选或稍后再来～</Text>`).
> - **error:** when `store.error` is set, render it + a retry `DSButton` that re-calls the load action.
> Trigger initial loads with `Taro.useDidShow(() => store.load())` (import `{ useDidShow }` from `@tarojs/taro`) so data refreshes when navigating back. Read route params with `getCurrentInstance().router?.params`.
> Keep ALL existing JSX/styling otherwise — only data and handlers change.

### Task D1: Onboarding & auth (splash, login, pet-form, permissions)

**Files:** Modify `src/pages/login/index.tsx`, `src/pages/profile/pet-form.tsx`, `src/pages/permissions/index.tsx` (splash needs no data change)

- [ ] **Step 1 — login:** Replace the three "navigate to pet-form" onClicks. The primary "进入宠物世界" button and the WeChat icon button call:

```tsx
import { useSessionStore } from '../../store/sessionStore'
// inside component:
const login = useSessionStore((s) => s.login)
const loading = useSessionStore((s) => s.loading)
const onLogin = async () => {
  try {
    await login()
    openPage('/pages/profile/pet-form', { replace: true })
  } catch {
    Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
  }
}
```
Wire `onLogin` to the primary and WeChat buttons; disable while `loading`. Keep phone/SMS inputs visually but they are not required for mock login.

- [ ] **Step 2 — pet-form:** Make it a real form with `useState` for name/breed/selected personality tags, validate name+breed non-empty, and on "下一步":

```tsx
import { useSessionStore } from '../../store/sessionStore'
const createPet = useSessionStore((s) => s.createPet)
// tags: const [selected, setSelected] = useState<string[]>([])
const onNext = async () => {
  if (!name.trim() || !breed.trim()) { Taro.showToast({ title: '请填写昵称和品种', icon: 'none' }); return }
  await createPet({ name, breed, personality: selected })
  openPage('/pages/permissions/index', { replace: true })
}
```
Make each personality tag toggle membership in `selected` (replace the hardcoded `index === 0` active class with `selected.includes(tag)`).

- [ ] **Step 3 — permissions:** On "全部允许并继续" persist settings then go to map:

```tsx
import { useProfileStore } from '../../store/profileStore'
const updateSettings = useProfileStore((s) => s.updateSettings)
const goMap = async () => {
  await updateSettings({ notifications: true, preciseLocation: true, camera: true })
  openPage('/pages/map/index', { replace: true })
}
```
"暂不开启" sets all three false then navigates.

- [ ] **Step 4: Verify** — `npm run typecheck` → 0; build not required yet.
- [ ] **Step 5: Commit** — `git add src/pages/login src/pages/profile/pet-form.tsx src/pages/permissions && git commit -m "feat(mini): wire onboarding+auth to sessionStore"`

---

### Task D2: Map + map-filter

**Files:** Modify `src/pages/map/index.tsx`, `src/pages/map-filter/index.tsx`

- [ ] **Step 1 — map:** Remove the hardcoded `markers` array and the `useAppStore` import. Use `walkStore`:

```tsx
import { useWalkStore } from '../../store/walkStore'
const { nearby, walking, walkEndsAt, loading, error, loadNearby, toggleWalking } = useWalkStore()
useDidShow(() => { loadNearby() })
```
Render one `.marker` per `nearby[i]` (map index→position using the existing four `top/left` coordinates, falling back to a deterministic layout for >4). Each marker shows `p.distance` and navigates `openPage('/pages/pet-detail/index?id=' + p.id)`. The "我在遛" toggle calls `toggleWalking`; the hint shows remaining minutes from `walkEndsAt` when walking. Add loading/empty/error per the pattern.

- [ ] **Step 2 — map-filter:** Replace static filter UI with controls bound to `walkStore.filter`; "应用" calls `setFilter({ size, personality })` then `backOrHome('/pages/map/index')`. Use `Chip` from `ui.tsx` for size (全部/小型/中型/大型) and personality options.

- [ ] **Step 3: Verify** — `npm run typecheck` → 0.
- [ ] **Step 4: Commit** — `git add src/pages/map src/pages/map-filter && git commit -m "feat(mini): wire map + filter to walkStore"`

---

### Task D3: Pet detail

**Files:** Modify `src/pages/pet-detail/index.tsx`

- [ ] **Step 1:** Read `id` from route params; load via `api.getPet(id)` into local state (or a small selector off `walkStore.nearby`/`sessionStore.pets`). Render that pet's name/breed/personality/bio/distance instead of hardcoded "大福". The "邀请偶遇"/primary action navigates `openPage('/pages/encounter-waiting/index?targetId=' + id)` **after** calling `useEncounterStore.getState().invite(id)` — or route to `encounter` if no candidate context. Add loading state.

```tsx
import { getCurrentInstance } from '@tarojs/taro'
const id = Number(getCurrentInstance().router?.params?.id) || 201
```

- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/pages/pet-detail && git commit -m "feat(mini): wire pet-detail to route param + api"`

---

### Task D4: Encounter entry + radar + match-results

**Files:** Modify `src/pages/encounter/index.tsx`, `src/pages/matching-radar/index.tsx`, `src/pages/match-results/index.tsx`

- [ ] **Step 1 — encounter:** Replace local `mode` state with `encounterStore.mode`/`setMode`. "一键匹配" → 开始扫描 navigates to `matching-radar`. The swipe card renders `candidates[swipeIndex]` (load via `scan()` on show if empty); "再见" calls `nextSwipe()`, "打招呼/超级喜欢" calls `invite(candidate.id)` then `openPage('/pages/encounter-waiting/index')`. "地图圈选" 开始圈选 → `scan()` then `match-results`.

```tsx
import { useEncounterStore } from '../../store/encounterStore'
const { mode, setMode, candidates, swipeIndex, scan, nextSwipe, invite } = useEncounterStore()
useDidShow(() => { if (!candidates.length) scan() })
```

- [ ] **Step 2 — matching-radar:** On mount call `scan()`; show the existing radar animation while `scanning`; when done `openPage('/pages/match-results/index', { replace: true })`.
- [ ] **Step 3 — match-results:** Render `candidates` list (name/breed/distance/score/reason). Each "邀请" calls `invite(c.id)` then `openPage('/pages/encounter-waiting/index')`. Empty state if none.
- [ ] **Step 4: Verify** — `npm run typecheck` → 0.
- [ ] **Step 5: Commit** — `git add src/pages/encounter src/pages/matching-radar src/pages/match-results && git commit -m "feat(mini): wire encounter entry + radar + results"`

---

### Task D5: Encounter flow (waiting → success → meeting-point → ongoing → feedback)

**Files:** Modify `src/pages/encounter-waiting/index.tsx`, `encounter-success/index.tsx`, `meeting-point/index.tsx`, `encounter-ongoing/index.tsx`, `encounter-feedback/index.tsx`

- [ ] **Step 1 — waiting:** Read `active` from `encounterStore`. Show `active.targetName` (not "布丁"). Start a **real countdown** with `useState`+`setInterval` from 180s. On mount kick off `waitForAccept()`; when it resolves, `openPage('/pages/encounter-success/index', { replace: true })`. Keep "模拟接受邀约" button → `acceptNow()` then same navigation. Clear interval on unmount.
- [ ] **Step 2 — success:** Show `active.targetName` accepted + `active.meetingPoint`. "确认集合点" → `meeting-point`.
- [ ] **Step 3 — meeting-point:** Show `active.meetingPoint`. "确认并出发" → `confirmPoint(active.meetingPoint)` then `openPage('/pages/encounter-ongoing/index', { replace: true })`. "换一个" sets an alternate point string.
- [ ] **Step 4 — ongoing:** Show `active.targetName & 我的宠物名` and a **distance countdown** (`useState` from `active.distanceLeft`, decrement every second via interval to 0). "发消息" → `openPage('/pages/chat/index?peerId=' + active.targetId)`. "完成偶遇" → `encounter-feedback`.
- [ ] **Step 5 — feedback:** `useState` rating (1-5 stars selectable) + toggleable tags. "提交反馈" → `finish(rating, tags)` then `openPage('/pages/wallet/index', { replace: true })`. The "+12 骨头" copy now reflects the real reward credited by the store.
- [ ] **Step 6: Verify** — `npm run typecheck` → 0.
- [ ] **Step 7: Commit** — `git add src/pages/encounter-waiting src/pages/encounter-success src/pages/meeting-point src/pages/encounter-ongoing src/pages/encounter-feedback && git commit -m "feat(mini): wire full encounter flow to encounterStore"`

---

### Task D6: Feed + post-flow + sticker-edit

**Files:** Modify `src/pages/feed/index.tsx`, `src/pages/post-flow/index.tsx`, `src/pages/sticker-edit/index.tsx`

- [ ] **Step 1 — feed:** Replace the single hardcoded post with `feedStore.posts.map(...)`. `useDidShow(() => load())`. Tabs (关注/附近/热门/同城) call `setTab`. Heart icon calls `like(post.id)` (filled when `post.liked`); 打赏 calls `tip(post.id, 1)` (Toast on 余额不足 error); message icon → comments (inline expand using `loadComments`/`comments[id]` or navigate). FAB/发布 → `post-flow`. Story-bar "发布" → `post-flow`. Loading/empty/error states.
- [ ] **Step 2 — post-flow:** Form with caption `Input`, location, mediaTone, sticker selection. "发布" → `publish({...})` then `openPage('/pages/feed/index', { replace: true })`; new post appears on top.
- [ ] **Step 3 — sticker-edit:** Selecting a sticker stores it (local state) and returns it to post-flow context (simplest: write chosen sticker to a tiny `useState` in post-flow via route param `?sticker=` or keep sticker selection inline in post-flow and make this page a picker that `navigateBack` with the choice). Keep scope minimal: render `db.stickerPacks`-style options and `backOrHome`.
- [ ] **Step 4: Verify** — `npm run typecheck` → 0.
- [ ] **Step 5: Commit** — `git add src/pages/feed src/pages/post-flow src/pages/sticker-edit && git commit -m "feat(mini): wire feed + posting to feedStore"`

---

### Task D7: Team + team-detail + team-create

**Files:** Modify `src/pages/team/index.tsx`, `team-detail/index.tsx`, `team-create/index.tsx`

- [ ] **Step 1 — team:** Render `teamStore.teams`. Search `Input` calls `search(q)` (debounce optional). Each card → `openPage('/pages/team-detail/index?id=' + t.id)`. Join/已加入/申请加入 button calls `toggleJoin(t.id)` and reflects `t.joined`/`t.members`. `useDidShow(load)`. Empty/loading/error.
- [ ] **Step 2 — team-detail:** Read `id` param, `api.getTeam(id)` (or selector), render name/type/members/activity/schedule/vibe; join button calls `toggleJoin`.
- [ ] **Step 3 — team-create:** Form (name, type select, tag, schedule); "创建" → `create({...})` then navigate to the new team detail or back to list.
- [ ] **Step 4: Verify** — `npm run typecheck` → 0.
- [ ] **Step 5: Commit** — `git add src/pages/team src/pages/team-detail src/pages/team-create && git commit -m "feat(mini): wire teams to teamStore"`

---

### Task D8: Wallet + wallet-tasks + reward-shop

**Files:** Modify `src/pages/wallet/index.tsx`, `wallet-tasks/index.tsx`, `reward-shop/index.tsx`

- [ ] **Step 1 — wallet:** `useDidShow(load)`. Show `balance` and `ledger.map(...)` (green for +, red for −). "赚骨头" → wallet-tasks, "去兑换" → reward-shop.
- [ ] **Step 2 — wallet-tasks:** `loadTasks` on show; render tasks; "领取/去完成" calls `claim(id)` (Toast reward), reflect `task.done`.
- [ ] **Step 3 — reward-shop:** `loadShop` on show; each item "兑换" calls `redeem(id)`; catch 余额不足 → Toast; success → Toast + balance updates.
- [ ] **Step 4: Verify** — `npm run typecheck` → 0.
- [ ] **Step 5: Commit** — `git add src/pages/wallet src/pages/wallet-tasks src/pages/reward-shop && git commit -m "feat(mini): wire wallet/tasks/shop to walletStore"`

---

### Task D9: Chat

**Files:** Modify `src/pages/chat/index.tsx`

- [ ] **Step 1:** Read `peerId` param; `useDidShow(() => open(peerId))`. Render `messages.map(...)` with existing left/right bubble classes. Input + "发送" calls `send(text)` then clears input; simulated reply appears after delay. Keep the meeting-point banner.
- [ ] **Step 2: Verify** — `npm run typecheck` → 0.
- [ ] **Step 3: Commit** — `git add src/pages/chat && git commit -m "feat(mini): wire chat to chatStore"`

---

### Task D10: Profile + trophy-wall + settings + safety-center + safety-privacy + emergency

**Files:** Modify `src/pages/profile/index.tsx`, `trophy-wall/index.tsx`, `settings/index.tsx`, `safety-center/index.tsx`, `safety-privacy/index.tsx`, `emergency/index.tsx`

- [ ] **Step 1 — profile:** Replace hardcoded "球球" with `sessionStore` active pet (`pets.find(id===activePetId) ?? pets[0]`). Show its name + personality tags; stats from pet `boneCount` and a derived encounter count (use `db`-backed value or keep a static-but-labeled number). Wallet menu meta shows real `walletStore.balance` (load on show). "退出登录" calls `sessionStore.logout()` then `openPage('/pages/splash/index', { reset: true })`.
- [ ] **Step 2 — trophy-wall:** `loadTrophies` on show; render `trophies` with locked/unlocked styling.
- [ ] **Step 3 — settings:** Bind toggles to `profileStore.settings`; each change calls `updateSettings({...})`. Include a logout row if present.
- [ ] **Step 4 — safety-center:** `loadSafety` on show; render `safetyScore` + `safety` items. "紧急求助" → emergency.
- [ ] **Step 5 — safety-privacy / emergency:** Keep mostly static informational content (no data layer needed); ensure nav works. Emergency "一键求助" shows a confirmation Toast/modal (`Taro.showModal`) simulating SOS — no real action.
- [ ] **Step 6: Verify** — `npm run typecheck` → 0.
- [ ] **Step 7: Commit** — `git add src/pages/profile src/pages/trophy-wall src/pages/settings src/pages/safety-center src/pages/safety-privacy src/pages/emergency && git commit -m "feat(mini): wire profile + safety + settings"`

---

### Task D11: Encounter guide + settings + remaining static pages

**Files:** Modify `src/pages/encounter-guide/index.tsx`, `encounter-settings/index.tsx`

- [ ] **Step 1 — encounter-settings:** If it exposes matching preferences (radius, size, personality), bind to `walkStore.filter` or a local persisted slice; "保存" persists. If purely informational, leave static but confirm nav.
- [ ] **Step 2 — encounter-guide:** Informational; confirm nav only.
- [ ] **Step 3: Verify** — `npm run typecheck` → 0.
- [ ] **Step 4: Commit** — `git add src/pages/encounter-guide src/pages/encounter-settings && git commit -m "feat(mini): finalize encounter guide/settings"`

---

### Task D12: Remove legacy files + full build

**Files:** Delete `src/store/appStore.ts`, `src/store/authStore.ts`, `src/data/mockData.ts`

- [ ] **Step 1:** `grep -rn "appStore\|authStore\|data/mockData" src/` → expected: no results.
- [ ] **Step 2:** `git rm src/store/appStore.ts src/store/authStore.ts src/data/mockData.ts`
- [ ] **Step 3: Verify build** — `npm run typecheck` → 0, then `npm run build:weapp` → exits 0, produces `dist/`.
- [ ] **Step 4: Commit** — `git commit -m "chore(mini): remove legacy stores/mockData; full mock build green"`

---

## PHASE E — Verification

### Task E1: Manual click-path regression

- [ ] Run `npm run dev:weapp`, import `dist/` into WeChat DevTools (check "不校验合法域名").
- [ ] Walk the checklist from the spec §7 and confirm each:
  1. splash → login → create "测试宠" → map; Profile shows 测试宠.
  2. Toggle 我在遛 → countdown appears; toggle off → hidden.
  3. 一键匹配 → 等待 → 自动接受 → 集合点 → 进行中(距离倒计时) → 反馈提交 → 钱包出现 +12 流水.
  4. Feed 点赞/打赏(钱包扣减)/评论/发帖置顶.
  5. 加入队伍计数+1; 兑换商城扣骨头; 余额不足被拦截 Toast.
  6. Kill & relaunch: 宠物/余额/点赞/帖子仍在; 退出登录 → 全部重置为种子.
- [ ] Note any failures and fix before marking complete.
- [ ] **Commit** any fixes; final message: `test(mini): verify mock integration click-paths`.

---

## Self-Review (completed by plan author)

- **Spec coverage:** All spec sections mapped — §3 mock layer → A1–A4,B1–B2; §4 stores/persistence → A5,C1–C8; §5 interactions → D1–D11; §6 errors/privacy → wiring pattern + maybeFail; §7 testing → B1 test + E1. ✓
- **Placeholder scan:** Foundation/API/store tasks carry complete code. Page tasks (D*) specify exact store selectors, actions, params, and three-state behavior rather than regenerating existing JSX — intentional, since pages already exist and are only rewired. No "TBD/handle edge cases" left. ✓
- **Type consistency:** Store method names match their usage in page tasks (`toggleWalking`, `invite`, `waitForAccept`, `acceptNow`, `confirmPoint`, `finish`, `tip`, `toggleJoin`, `claim`, `redeem`, `open`, `send`). API names match between `api.ts` types, `mockApi.ts`, and store calls. ✓
- **Scope:** One cohesive subsystem (front-end mock integration), phased so every phase ends on a green typecheck/build. ✓
