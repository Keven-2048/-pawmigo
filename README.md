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
微信小程序 MVP + Mock 先行 + P0 用户闭环
```

本阶段只开发 Taro 微信小程序端。真实 Go 后端、MySQL/Redis、Docker Compose、React 管理后台属于后续阶段，除非用户明确要求，不要自动扩展到这些内容。

## Documentation

- `AGENTS.md`: agent rules, current scope, hard guardrails, Stitch reference.
- `docs/DEVELOPMENT_PLAN.md`: approved implementation plan.
- `docs/SESSION_STATE.md`: resumable current state and next step.
- `docs/CHANGELOG.md`: chronological change record.

## Current Development State

The Taro mini-program MVP has been scaffolded and the Mock-first P0 flow is implemented under `frontend/pet-social-mini`.

Current development should continue inside the approved mini-program scope:

- keep pages wired through `services/*`
- keep Mock behavior aligned with the service boundary in `docs/DEVELOPMENT_PLAN.md`
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
