# 遛遛 Pawmigo · 前端模拟数据整合 设计文档

- **日期**: 2026-06-03
- **范围**: `pawmigo-mini/` 小程序前端
- **状态**: 已确认设计
- **目标**: 用模拟数据把全部 33 个页面整合为一个连贯、可交互、状态持久的应用，覆盖 UI、用户体验和动态交互；同时保持向真实后端切换的低成本。

---

## 1. 背景与目标

当前 `pawmigo-mini/` 是一个高保真点击原型：33 个页面全部渲染硬编码数据，仅通过 `openPage` 跳转，页面不调用任何 store 或后端。`authStore`/`appStore` 存在但几乎未被页面使用，且 `appStore` 是一个混合了多领域 UI 状态的单体。

本次工作把它变成一个**由模拟数据驱动的、可玩的完整应用**：

- 所有页面从 store + 路由参数读取数据，不再硬编码。
- 所有关键交互产生真实的状态变更，并跨冷启动持久化。
- 模拟一层"实时"行为（自动接受邀约、距离倒计时、聊天回复等）。
- 数据访问走一层模拟 API，契约对齐"未来真实后端"，切换成本接近零。

### 非目标

- 不接入真实后端、不改后端代码（仅前端）。
- 不重做视觉设计：保持现有新粗野主义风格与布局，仅注入数据与交互。
- 不引入新的设计令牌或品牌色（遵循 `AGENTS.md` 组件复用规范）。
- 不追求重型自动化测试覆盖；以 `typecheck` + 构建 + 手动验证路径为准。

### 成功标准

- `npm run typecheck` 与 `npm run build:weapp` 通过。
- 从启动 → 登录 → 创建宠物 → 地图 → 发起偶遇 → 完成反馈 → 钱包到账，全链路状态连贯、身份一致、可重复。
- 关键可变状态（用户、宠物、骨头余额、点赞、加入的队伍、发布的帖子、聊天记录）在小程序重启后仍然保留；退出登录清空并重置为种子数据。
- 每个数据驱动页面具备 loading / empty / error 三态。

---

## 2. 架构

四层，单向数据流：

```
Pages (existing .tsx)
   ↓ read state / dispatch actions, read route params
Domain Stores (Zustand, per-domain, persisted)
   ↓ await async calls
Mock API (services/, real-backend-shaped contract)
   ↓ read/write
Mock DB (seed dataset + Taro storage)
```

- **页面**只负责 JSX、交互、导航、把 store 数据映射到现有视觉组件。视觉结构优先复用 `src/components/ui.tsx`。
- **Store**持有领域状态与 action，调用模拟 API，不含 JSX。
- **模拟 API**是切换缝（swap seam）：以异步函数模拟一个合理的 REST 后端（延迟、Promise、偶发错误）。
- **模拟 DB**是唯一数据源，启动时从 Taro storage 水合，回退到种子数据。

### 2.1 切换缝（swap seam）

`src/services/api.ts` 暴露完整的、带类型的全领域 API 接口，并通过单一开关在模拟实现与真实实现之间路由：

```ts
// services/api.ts（示意）
const USE_MOCK = true
export const api = USE_MOCK ? mockApi : realApi
```

- 现有 4 个真实端点（`wxLogin` / `me` / `createPet` / `updatePet`）保留签名；模拟实现同样实现它们。
- 真实实现（`realApi`，基于现有 `request.ts`）对尚未实现的端点可抛 `not implemented`，不影响模拟运行。
- 未来切换：把 `USE_MOCK` 置为 `false` 并补齐 `realApi`，**页面与 store 无需改动**。

---

## 3. 模拟数据层

### 3.1 文件

- `src/mock/db.ts` — 单一种子数据集 + 水合/持久化逻辑。导出一个可读写的 `db` 对象与 `resetDb()`、`persistDb()`。
- `src/mock/seed.ts` — 纯静态种子数据（从现有页面里的硬编码数据迁移并补全）。
- `src/mock/delay.ts` — `delay(ms)` 与 `maybeFail(rate)` 辅助。
- `src/services/mockApi.ts` — 全领域异步 API 实现，读写 `db`，变更后调用 `persistDb()`。
- `src/services/realApi.ts` — 现有 `request.ts` 之上的真实端点封装（仅已实现的端点；其余抛错占位）。
- `src/services/api.ts` — 类型接口 + `USE_MOCK` 路由。

### 3.2 模拟 DB 覆盖的领域

`users`、`pets`、`nearbyWalkers`、`posts`（含 `comments`）、`teams`（含成员/活动）、`walletLedger`、`walletTasks`、`shopItems`、`encounters`、`chats`（含 messages）、`trophies`、`safety`、`notifications`。

### 3.3 模拟 API 表面（按 REST 形态命名）

| 领域 | 函数 | 形态 |
|---|---|---|
| 认证 | `wxLogin(code)` / `me()` | 现有契约 |
| 宠物 | `createPet` / `updatePet` / `getPet(id)` | 现有契约 + 详情 |
| 地图 | `getNearbyWalkers(filter)` / `setWalkingStatus(on)` | GET / PUT |
| 偶遇 | `getCandidates(mode)` / `createEncounter(targetId)` / `acceptEncounter(id)` / `confirmMeetingPoint(id, pointId)` / `submitFeedback(id, rating, tags)` | POST 流 |
| 圈子 | `getFeed(tab)` / `likePost(id)` / `tipBone(id, amount)` / `getComments(id)` / `addComment(id, text)` / `createPost(input)` | GET/POST |
| 组队 | `getTeams(query)` / `getTeam(id)` / `joinTeam(id)` / `leaveTeam(id)` / `createTeam(input)` | GET/POST |
| 钱包 | `getWallet()` / `getWalletTasks()` / `claimTask(id)` / `getShop()` / `redeem(itemId)` | GET/POST |
| 聊天 | `getChat(peerId)` / `sendMessage(peerId, text)` | GET/POST |
| 我的 | `getTrophies()` / `getSafety()` / `getNotifications()` / `updateSettings(patch)` | GET/PUT |

返回值为数据的拷贝（避免外部直接突变 `db`）。变更类调用在成功后 `persistDb()`。少量 GET 通过 `maybeFail` 触发可控错误以驱动 error 态（默认关闭或低概率，避免干扰演示）。

---

## 4. 状态与持久化

### 4.1 领域 Store（拆分现有单体 `appStore`）

| Store | 负责 |
|---|---|
| `sessionStore` | token、当前用户、我的宠物列表、活跃宠物、登录态、onboarding 进度 |
| `walkStore` | 我在遛开关（含自动超时倒计时）、附近遛狗列表、地图筛选 |
| `encounterStore` | 模式、候选、滑卡牌堆、当前邀约、自动接受模拟、集合点、行程进度、反馈 |
| `feedStore` | 帖子、点赞、骨头打赏、评论、发布/贴纸 |
| `teamStore` | 队伍、加入状态、创建 |
| `walletStore` | 余额、流水、赚骨头任务、兑换商城 |
| `chatStore` | 会话、消息、模拟回复 |
| `profileStore` | 奖杯、安全状态、设置、通知 |

- 每个 store 只持有领域状态与 action，调用 `api`，不含视图逻辑。
- 旧 `appStore` 中仍属纯 UI 的瞬时状态（如某页 tab 选中）可保留在页面 `useState`，不强行入 store。

### 4.2 持久化

- `src/store/taroStorage.ts`：实现 Zustand `persist` 中间件所需的 storage 适配器（基于 `Taro.getStorageSync` / `setStorageSync` / `removeStorageSync`）。
- 每个需要跨重启保留的 store 套 `persist`，使用独立 storage key（如 `pawmigo:session`）。
- **登出**：`sessionStore.logout()` 清空所有持久化 key 并 `resetDb()`，回到种子状态与启动页。
- JWT/token 仍存于现有 `jwt` storage key，与 `request.ts` 兼容。

---

## 5. 动态交互（按流程）

### 5.1 启动 / 登录 / Onboarding

- `splash` → `login`：登录调用 `sessionStore.login()`（走模拟 `wxLogin`），建立会话。
- `pet-form`：**真实保存宠物**，必填校验（昵称、品种），性格标签多选可用；保存后该宠物即为 Profile / `pet-detail` 中显示的宠物（修复"球球"身份不一致）。
- `permissions`：选择持久化到 `profileStore`/settings；权限请求改为页面内即时授予的模拟。

### 5.2 地图 / 我在遛

- `map`：`getNearbyWalkers(filter)` 加载（loading → 列表 / empty）；"我在遛"开关调用 `setWalkingStatus`，开启后启动倒计时（接近超时有提示），关闭即隐身。
- 图钉携带宠物 `id` 跳 `pet-detail?id=`；`map-filter` 写回 `walkStore.filter` 并即时增减图钉，空结果有引导。

### 5.3 偶遇（三种模式 + 完整链路）

- `encounter`：
  - 一键匹配 → `matching-radar` 真实扫描进度 → `getCandidates('radar')` → `match-results`。
  - 地图圈选 → 选区 → 群发邀请 → `match-results`。
  - 滑卡选狗 → 真实牌堆，左滑/右滑消费卡片。
- 邀约链路：`createEncounter` → `encounter-waiting`（**真实倒计时**） → **随机短延迟后模拟自动接受**（"模拟接受邀约"按钮保留为手动快捷方式） → `encounter-success` → `meeting-point`（`confirmMeetingPoint`） → `encounter-ongoing`（**距离倒计时**） → `encounter-feedback`（评分+标签 → `submitFeedback` → **骨头计入钱包流水**）。
- 身份贯穿：被邀对象 id 经路由参数携带，文案不再写死"布丁"。

### 5.4 圈子

- `feed`：`getFeed(tab)` 渲染列表；点赞切换计数；**打赏从钱包扣骨头并增加帖子骨头数**；评论追加；`post-flow` **创建帖子并置顶**；`sticker-edit` 附加贴纸。

### 5.5 组队 / 钱包 / 聊天 / 我的

- `team`：加入/退出更新成员数与按钮态；`team-create` 新增队伍；`team-detail?id=` 显示成员与活动。
- `wallet`：真实流水账；`wallet-tasks` 赚骨头计入；`reward-shop` 兑换扣骨头，余额不足拦截并提示。
- `chat?peerId=`：发送追加消息并**模拟对方回复**。
- `profile`：显示真实活跃宠物与统计；`trophy-wall`、`settings`、`safety-center`、通知读各自 store。

### 5.6 横切

- 所有数据驱动页面具备 loading / empty / error 三态（PRD"空结果友好引导"）。
- "实时"模拟使用固定短延迟（约 2–4s），集中在 `mock/delay.ts` 与各 store，便于统一调参。
- 身份通过路由查询参数（`?id=` / `?peerId=`）流转；`openPage` 现有实现已支持 url 携带 query，无需改动。

---

## 6. 错误、边界与隐私

- 模拟 API 的错误通过 `maybeFail` 触发，页面以 Toast 或行内错误态呈现，提供重试。
- 钱包扣减、加入队伍、提交反馈等写操作做乐观更新失败回滚或先确认再提交（按页面选简单方案：先调用、失败回滚）。
- 不在模拟数据、日志或提交中写入真实坐标、`openid`、`session_key`、密钥（遵循 `AGENTS.md`）。模拟坐标仅为展示用的模糊距离文案，不含真实经纬度。

---

## 7. 测试与验证

- **静态**：`npm run typecheck` 全绿（新 store / api 严格类型）。
- **构建**：`npm run build:weapp` 成功。
- **手动验证路径（核心回归清单）**：
  1. 启动 → 登录 → 创建宠物"测试宠" → 进入地图，Profile 显示"测试宠"。
  2. 开启"我在遛" → 倒计时出现；关闭 → 隐身。
  3. 一键匹配 → 等待 → 自动接受 → 集合点 → 进行中 → 反馈提交 → 钱包出现 +N 骨头流水。
  4. 圈子点赞/打赏（钱包扣减）/评论/发帖置顶。
  5. 加入队伍计数变化；兑换商城扣骨头，余额不足被拦截。
  6. 冷启动重进：宠物、余额、点赞、帖子仍在；退出登录后全部重置为种子。
- 模拟 API 函数尽量纯，可做轻量单测；Taro 在测试环境较重，不强求自动化覆盖。

---

## 8. 影响面与迁移

- 拆分 `appStore`：现有引用 `useAppStore` 的页面（`map`、`encounter` 等少数）迁移到对应新 store。保留兼容期不必要——一次性迁移并删除旧字段。
- 现有 `authStore` 合并进 `sessionStore`（或重命名扩展），避免两个会话源。
- 新增文件集中在 `src/mock/`、`src/services/`、`src/store/`；页面改动为"删硬编码 + 接 store"。
- 遵循 `AGENTS.md`：新增样式进 `app.scss` 设计系统区并复用令牌；不在 JSX 内硬编码品牌色/阴影；tab 页面与 `app.config.ts` 保持一致。

---

## 9. 文件清单（预期新增/改动）

**新增**
- `src/mock/seed.ts`、`src/mock/db.ts`、`src/mock/delay.ts`
- `src/services/mockApi.ts`、`src/services/realApi.ts`
- `src/store/taroStorage.ts`
- `src/store/sessionStore.ts`、`walkStore.ts`、`encounterStore.ts`、`feedStore.ts`、`teamStore.ts`、`walletStore.ts`、`chatStore.ts`、`profileStore.ts`

**改动**
- `src/services/api.ts`（扩展接口 + `USE_MOCK` 路由）
- 全部数据驱动页面（删除硬编码，接入 store + 路由参数，补三态）
- 删除/替换 `src/store/appStore.ts`、`src/store/authStore.ts`（合并入新 store）
- `src/data/mockData.ts` 若存在则并入 `src/mock/seed.ts`
