# AGENTS.md

## Project Context

Project: `pawmigo` / 宠友圈 (PetCircle)

This is a new WeChat Mini Program project for pet-centered nearby social networking. The source materials currently live in:

- `功能需求.md`
- `技术文档.md`
- Stitch prototype project: `projects/5635601718767463341`

## Mandatory Startup Checklist

Before making any code or documentation changes, every agent must:

1. Read this file.
2. Read `docs/SESSION_STATE.md`.
3. Run `git status --short --branch`.
4. Check whether the intended change is inside the current phase and guardrails below.

If the chat context is missing, stale, or contradictory, treat the repository documents as the source of truth.

## Current Implementation Scope

Current phase:

```text
WeChat Mini Program MVP + Mock first + P0 user journey
```

Approved stack for this phase:

- Taro + React + TypeScript
- NutUI/Taro
- Zustand
- Typed service layer with local Mock implementation first

The current phase must implement the small-program P0 flow only:

```text
login -> create pet -> authorize location -> nearby pets -> pet profile
-> create invite -> accept/reject/cancel invite -> feed -> publish post
-> like/comment -> report/block -> privacy settings
```

## Hard Guardrails

- Do not expand scope into the Go backend, MySQL/Redis, Docker Compose, or the React admin app unless the user explicitly asks for that new phase.
- Do not treat the full-stack items in `技术文档.md` as current-phase work. They are future architecture references.
- Do not wire pages directly to Mock data. Pages must call `services/*`, and `services/*` may switch between Mock and remote APIs later.
- Do not modify `功能需求.md` or `技术文档.md` unless the user explicitly asks to change the source documents.
- Do not delete, overwrite, or revert user changes. If a file has unexpected changes, inspect with `git diff` and work with those changes.
- Do not make Docker a required local verification path. This machine did not have Docker installed during planning.
- Do not invent a new visual direction. Use the Stitch design system and screens from `projects/5635601718767463341`.

## Stitch Prototype Reference

Use the Stitch project `projects/5635601718767463341` as the UI source of truth.

Known key mobile screens:

- 微信登录页
- 创建宠物档案页
- 附近宠友列表页
- 附近空状态页
- 附近宠友筛选弹窗
- 宠物主页
- 发起邀请页
- 邀请列表页
- 邀请详情页
- 社交圈信息流页
- 动态详情页
- 发布动态页
- 我的页面
- 宠物管理页
- 隐私设置页
- 举报页
- 消息中心页

Design direction:

- Warm and healing pet social UI.
- Primary soft green, secondary warm orange, cream background.
- Pet-first identity; owner identity is secondary and privacy-conscious.
- Mobile-first WeChat Mini Program layout.

## Required End-of-Session Updates

Before ending any implementation session that changes files:

1. Update `docs/SESSION_STATE.md` with:
   - completed work
   - current state
   - next recommended step
   - validation run and results
   - known blockers or risks
2. Update `docs/CHANGELOG.md` with the actual changes made.
3. Report any tests or checks that could not be run.

## Planned Documentation Map

- `docs/DEVELOPMENT_PLAN.md`: current approved implementation plan.
- `docs/SESSION_STATE.md`: resumable state board for future sessions.
- `docs/CHANGELOG.md`: chronological record of repository changes.
- `README.md`: project entrypoint and handoff instructions.
