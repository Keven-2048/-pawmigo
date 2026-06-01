# 遛遛 Pawmigo · 技术设计文档

- **日期**：2026-06-01
- **平台**：微信小程序（Taro + React）
- **后端**：Go + Gin + MySQL + Redis
- **状态**：已确认

---

## 1. 整体架构

```
┌─────────────────────────────────────┐
│        微信小程序（Taro/React）        │
│  地图 · 圈子 · 偶遇 · 组队 · 我的     │
└───────────────┬─────────────────────┘
                │ HTTPS / WSS
┌───────────────▼─────────────────────┐
│          Go + Gin 后端               │
│  REST API        WebSocket Hub       │
│  /api/v1/*       /ws                 │
└──────┬────────────────┬─────────────┘
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│    MySQL     │  │    Redis     │
│ 持久化数据    │  │ 位置/会话/   │
│ 用户/宠物/   │  │ 在线状态/    │
│ 帖子/偶遇    │  │ Pub/Sub     │
└─────────────┘  └─────────────┘
```

**关键决策：**
- 微信登录：`wx.login` → code → 后端换取 `openid` + `session_key` → 返回 JWT
- 位置数据只写 Redis（TTL 5 分钟），**绝不落 MySQL**；`WalkSession` 表只存会话元数据，不含坐标
- 实时位置用 **Redis GEO**（`GEOADD`/`GEOSEARCH`）做半径匹配与圈选
- **存储精度 ≠ 展示精度**：服务端存真实坐标做匹配，返回前端前做网格偏移脱敏
- WebSocket 连接携带 JWT 鉴权，每条消息有 `type` 字段路由

---

## 2. 目录结构

### 前端（Taro）

```
pawmigo-mini/
├── src/
│   ├── pages/
│   │   ├── map/          # 地图·附近在遛
│   │   ├── feed/         # 宠物朋友圈
│   │   ├── encounter/    # 即时偶遇遛
│   │   ├── team/         # 组队
│   │   └── profile/      # 我的·宠物主页
│   ├── components/       # 共用组件（PetCard、BoneReward、Sticker…）
│   ├── store/            # Zustand 全局状态
│   ├── services/         # API + WebSocket 封装
│   └── assets/           # 贴纸图片、图标
├── app.tsx
└── app.config.ts
```

### 后端（Go）

```
pawmigo-server/
├── cmd/server/main.go
├── internal/
│   ├── handler/          # HTTP + WS handler
│   ├── service/          # 业务逻辑
│   ├── repository/       # MySQL + Redis 访问层
│   ├── model/            # 数据模型
│   ├── middleware/        # JWT、限流、CORS
│   └── ws/               # WebSocket Hub
├── config/
├── migrations/           # SQL 建表脚本
└── docker-compose.yml
```

---

## 3. 核心数据模型

### MySQL 表

MySQL 无原生数组类型：小数组用 `JSON` 列，多对多用关联表。

```sql
User          id, openid, phone, nickname, avatar, bone_balance, created_at
Pet           id, owner_id, name, breed, gender, age,
              personality JSON, bio, bone_count
WalkSession   id, pet_id, status, started_at, ended_at, visible
              -- 不含坐标；实时位置只在 Redis
Encounter     id, initiator_id, method(quick/lasso/swipe),
              meetup_point, time_window_start, time_window_end, status, created_at
EncounterPart encounter_id, pet_id, role(initiator/participant),
              reply_status(pending/accepted/declined)   -- 替代 participants[]
Post          id, pet_id, media JSON, caption, location,
              stickers JSON, bone_count, like_count, created_at
Team          id, type(breed/personality/location), name, tag, member_count
TeamMember    team_id, pet_id, joined_at
BoneTx        id, from_user, to_pet_id, to_post_id, amount, source, created_at
```

### Redis 键设计

```
geo:walking              → GEOADD 真实坐标   # 在遛宠物地理索引，用 GEOSEARCH 查附近/圈选
online:{pet_id}          → "1"        TTL 5min   # 在遛状态（同时驱动 geo 成员过期清理）
ws:session:{user_id}     → conn_id               # WebSocket 会话映射
```

> 真实坐标只进 Redis GEO（在遛结束或 TTL 到期即移除）。`/walk/nearby` 计算出距离后，对返回坐标做网格偏移再下发，前端拿不到精确点位。

### WebSocket 消息类型

| type | 说明 |
|------|------|
| `encounter_invite` | 发起偶遇邀请 |
| `encounter_accept` | 接受邀请 |
| `encounter_decline` | 拒绝邀请 |
| `location_update` | 位置广播（在遛时每30秒） |
| `chat_message` | 1v1 / 群聊消息 |
| `notification` | 打赏、关注、队伍活动 |

---

## 4. REST API

```
# 认证
POST   /api/v1/auth/wx-login          # code → JWT

# 用户 & 宠物
GET    /api/v1/me
PUT    /api/v1/me
POST   /api/v1/pets
GET    /api/v1/pets/:id
PUT    /api/v1/pets/:id
GET    /api/v1/pets/:id/profile       # 主页（帖子+奖杯+偶遇记录）

# 地图·在遛
POST   /api/v1/walk/start
POST   /api/v1/walk/stop
PUT    /api/v1/walk/location          # 上报位置（每30s）
GET    /api/v1/walk/nearby            # 附近在遛列表（脱敏）

# 偶遇
POST   /api/v1/encounters             # method: quick/lasso/swipe
POST   /api/v1/encounters/:id/accept
POST   /api/v1/encounters/:id/decline
GET    /api/v1/encounters/:id

# 朋友圈
GET    /api/v1/feed                   # 关注+附近+热门混排
POST   /api/v1/posts
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/like
POST   /api/v1/posts/:id/bone

# 组队
GET    /api/v1/teams?type=breed&tag=corgi
POST   /api/v1/teams/:id/join
POST   /api/v1/teams/:id/leave

# WebSocket
GET    /ws                            # Authorization: Bearer <jwt>
```

---

## 5. 前端架构

### Zustand Store 划分

| Store | 职责 |
|-------|------|
| `authStore` | user, pet, jwt, wxLogin() |
| `walkStore` | isWalking, nearbyPets, startWalk(), updateLocation() |
| `encounterStore` | activeEncounter, invites, sendInvite(), accept() |
| `feedStore` | posts, layout, loadFeed(), likePost() |
| `wsStore` | connected, send(), on(type, handler) |

### WebSocket 生命周期

- 登录后立即连接 `/ws`，App `onShow` 重连，`onHide` 保持连接但停止位置上报
- 统一消息路由：收到消息 → 按 `type` 分发到对应 store

### 地图方案

- 小程序原生 `<map>` 组件（腾讯地图），Taro 封装
- 宠物图钉用 `markers` 渲染，点击弹出 `PetCard` 半屏抽屉
- **位置上报（MVP）**：前台轮询——地图页活跃时 `wx.getLocation` 每 30 秒 PUT 一次；页面 `onHide` 即停止上报
- 后台持续定位（`wx.startLocationUpdateBackground`，需 `scope.userLocationBackground` 授权 + 类目资质）留到后期，不进 MVP

### 关键页面组件树

```
MapPage
  ├── <Map markers={nearbyPets} />
  ├── FilterBar (breed/personality/size)
  ├── PetCard (bottom sheet)
  └── WalkToggle (我在遛开关)

FeedPage
  ├── StoryBar (快拍)
  ├── LayoutSwitcher (单列/双列/杂志)
  └── PostList → PostCard → BoneReward

EncounterPage
  ├── QuickMatch (雷达动画)
  ├── LassoSelect (地图圈选)
  └── SwipeSelect (滑卡)

ProfilePage
  ├── PetHeader (头像/品种/标签)
  ├── StatsBar (骨头/偶遇次数/好友)
  ├── TrophyWall
  └── PostGrid / AlbumGrid
```

---

## 6. MVP 实现范围

按 PRD 第16节，优先实现：

| 功能 | 优先级 |
|------|--------|
| 微信登录 + 宠物档案创建 | P0 |
| 地图·附近在遛 + 筛选 | P0 |
| 一键偶遇（quick 模式） | P0 |
| 宠物朋友圈（发帖+点赞） | P0 |
| 宠物个人主页 | P0 |
| 组队 · 品种贴纸 · 骨头打赏 | P1 |
| 地图圈选/滑卡偶遇 · 即时聊天 | P1 |
| 商业化 · 本地商家 | P2 |

---

## 7. 安全与隐私

- 位置只存 Redis，网格偏移脱敏，TTL 5 分钟自动过期
- 偶遇功能双向授权（互相接受才能聊天）
- JWT 鉴权所有 API，WS 连接握手时验证
- 集合点推荐公共场地，提供一键求助入口
