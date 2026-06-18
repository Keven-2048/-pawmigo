# Pawmigo / 宠友圈

宠友圈是一个以宠物为核心身份的附近宠物社交微信小程序项目。

当前仓库是新项目，原始资料包括：

- `功能需求.md`
- `技术文档.md`
- Stitch prototype: `projects/5635601718767463341`

## 接手前必读

为了避免对话中断或上下文丢失导致乱改，任何后续开发开始前必须先执行：

```sh
cat AGENTS.md
cat docs/SESSION_STATE.md
git status --short --branch
```

如果聊天上下文与仓库文档冲突，以仓库文档为准。

## Current Phase

当前批准的开发范围：

```text
微信小程序 MVP 已完成；当前推进真实 API 联调准备阶段
```

已完成的 MVP 仍以 Mock 模式为默认运行方式。当前新增阶段包含 Taro 远程服务适配器、Go Gin P0 内存后端骨架，以及图片直传 COS 的后端预签名凭证。MySQL/Redis、Docker Compose、React 管理后台、生产微信登录仍属于后续阶段，除非用户明确要求，不要自动扩展到这些内容。

## Documentation

- `AGENTS.md`: agent rules, current scope, hard guardrails, Stitch reference.
- `docs/DEVELOPMENT_PLAN.md`: approved implementation plan.
- `docs/SESSION_STATE.md`: resumable current state and next step.
- `docs/CHANGELOG.md`: chronological change record.

## Current Development State

The Taro mini-program MVP has been scaffolded and the Mock-first P0 flow is implemented under `frontend/pet-social-mini`.

The remote API preparation phase is implemented on branch `codex/remote-api-go-skeleton`:

- mini-program pages stay wired through `services/*`
- `TARO_APP_API_MODE=mock` remains the default
- `TARO_APP_API_MODE=remote` routes service calls to `TARO_APP_API_BASE_URL`
- Go backend lives under `backend/api` and uses in-memory state only
- keep visual work aligned with Stitch project `projects/5635601718767463341`
- verify with typecheck, WeChat build, and tests before handoff

## Mini Program Commands

The MVP mini program now lives in `frontend/pet-social-mini`.

```sh
cd frontend/pet-social-mini
pnpm install
pnpm typecheck
pnpm build:weapp
pnpm dev:weapp
```

Open the repository root or `frontend/pet-social-mini` in WeChat Developer Tools. Both project configs point to the generated mini-program output under `frontend/pet-social-mini/dist`.

If WeChat Developer Tools still shows old TabBar icons after a rebuild, clear compile cache and recompile. The current generated app uses cache-busting TabBar paths: `nearby/invite/mine-stitch-v2` and `feed-stitch-v3`.

Remote mode build example:

```sh
cd frontend/pet-social-mini
TARO_APP_API_MODE=remote TARO_APP_API_BASE_URL=http://localhost:8080 pnpm build:weapp
```

## Backend Commands

The P0 Go backend skeleton lives in `backend/api`.

```sh
cd backend/api
go test ./...
go run ./cmd/server
```

Runtime environment variables:

- `PAWMIGO_STORE`: `memory` or `gorm`; defaults to `memory`.
- `MYSQL_DSN`: when set, the gorm store uses MySQL with this DSN.
- `PAWMIGO_DB_PATH`: sqlite file path for the gorm store when `MYSQL_DSN` is not set; defaults to `pawmigo.db`.
- `PAWMIGO_SEED`: set to `1` or `true` to seed an empty gorm database explicitly. Sqlite gorm mode seeds by default for local development; MySQL gorm mode does not seed unless this is set.
- `PAWMIGO_JWT_SECRET`: HS256 JWT signing secret. If unset, the backend uses the development default `pawmigo-development-jwt-secret`; production must set a strong private value before accepting real users.
- `WECHAT_APP_ID` / `WECHAT_APP_SECRET`: enable real WeChat `code2session` login for `POST /api/v1/auth/wechat-login`. If either value is unset, the backend keeps the local development login fallback.
- `COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` / `COS_REGION`: enable Tencent COS direct-upload credentials. `COS_BUCKET` should look like `pawmigo-1303931411`, and `COS_REGION` should look like `ap-chongqing`.

Image upload credential flow:

1. Login and send the JWT as `Authorization: Bearer <token>`.
2. Request a credential:

```sh
curl -X POST http://localhost:8080/api/v1/upload/credential \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"ext":"jpg"}'
```

The response contains `uploadUrl`, `fileUrl`, `objectKey`, and `expiresIn` (`900` seconds). The mini program uploads the image bytes to `uploadUrl` with HTTP `PUT`, then stores `fileUrl` in the business payload. Supported extensions are `jpg`, `jpeg`, `png`, and `webp`. When COS variables are not configured, the endpoint returns `503` with `上传服务未配置`.

Sqlite persistence example:

```sh
cd backend/api
PAWMIGO_STORE=gorm PAWMIGO_DB_PATH=/tmp/pawmigo.db go run ./cmd/server
```

MySQL persistence example:

```sh
cd backend/api
PAWMIGO_STORE=gorm MYSQL_DSN='user:pass@tcp(127.0.0.1:3306)/pawmigo?charset=utf8mb4&parseTime=True&loc=Local' go run ./cmd/server
```

The server listens on `http://localhost:8080` and exposes:

- `GET /healthz`
- P0 API routes under `/api/v1`
- development login through `POST /api/v1/auth/wechat-login`

The backend defaults to in-memory state for contract validation. Set `PAWMIGO_STORE=gorm` to use sqlite by default, or MySQL when `MYSQL_DSN` is provided.
