# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read These First (mandatory)

Before any code or doc change, read in this order — repository docs override chat context if they conflict:

1. `AGENTS.md` — current scope, hard guardrails, Stitch reference
2. `docs/SESSION_STATE.md` — resumable state board and next step
3. `git status --short --branch`
4. `功能需求.md` / `技术文档.md` — product + full-stack architecture references (future phases, **do not edit** unless asked)

After any session that changes files, update `docs/SESSION_STATE.md` and `docs/CHANGELOG.md` (this is required, see AGENTS.md).

## What This Is

`pawmigo` / 宠友圈 — a WeChat Mini Program for pet-centered nearby social networking. Two halves:

- `frontend/pet-social-mini` — Taro 4.2 + React 18 + TypeScript + NutUI/Taro + Zustand. This is the active product.
- `backend/api` — Go + Gin P0 backend skeleton, **in-memory only**, for frontend/backend contract validation (not production persistence).

UI source of truth is the Stitch prototype `projects/5635601718767463341` (accessed via the `open-design` / Stitch MCP). Do not invent a new visual direction. The user accepted the current visual baseline on 2026-06-09 — do not continue one-to-one prototype restoration unless given new visual feedback.

## Scope Guardrails (from AGENTS.md)

The current phase is **WeChat Mini Program MVP + Mock-first + P0 user journey**. Stay inside it:

- Do **not** expand into MySQL/Redis, Docker Compose, the React admin app, production WeChat login, or object-storage upload unless the user explicitly opens that phase.
- Do **not** wire pages directly to Mock data — pages call `@/services/*`, which switches between Mock and remote.
- Do **not** make Docker a required local verification path (it was not installed during planning).
- Do **not** delete/overwrite/revert user changes; inspect unexpected diffs with `git diff` and work with them.

## Commands

Frontend (`cd frontend/pet-social-mini`, uses `pnpm`):

```sh
pnpm install
pnpm typecheck          # tsc --noEmit
pnpm build:weapp        # taro build --type weapp  (must pass without warnings)
pnpm dev:weapp          # watch build
pnpm test               # see test harness note below
```

Standard handoff verification is all three: `pnpm typecheck && pnpm build:weapp && pnpm test`.

Remote-mode build (default is Mock):

```sh
TARO_APP_API_MODE=remote TARO_APP_API_BASE_URL=http://localhost:8080 pnpm build:weapp
```

Backend (`cd backend/api`):

```sh
go test ./...
go run ./cmd/server     # serves http://localhost:8080 ; GET /healthz ; /api/v1/* ; POST /api/v1/auth/wechat-login
```

WeChat Developer Tools: open the repo root or `frontend/pet-social-mini`; both `project.config.json` files point at `frontend/pet-social-mini/dist`. If old TabBar icons persist after a rebuild, clear compile cache. Current cache-busting tab paths: `nearby/invite/mine-stitch-v2` and `feed-stitch-v3`.

### Test harness (non-standard — read this)

There is no Jest/Vitest. `pnpm test` compiles `tsconfig.test.json` to `.test-dist/` then runs Node's built-in runner:

```
tsc -p tsconfig.test.json && node --test .test-dist/tests/**/*.test.js
```

Tests live in `frontend/pet-social-mini/tests/` and import source via the `@/*` alias (resolved through `tests/setup-alias.ts`). Taro is faked in `tests/fakes/taro.ts`. To run one file, build then target it: `tsc -p tsconfig.test.json && node --test .test-dist/tests/<name>.test.js`.

Most tests are **architecture/regression guards**, not unit tests of behavior. They lock in decisions: no direct Mock imports from pages, auth-guard installed on protected pages, Stitch visual anchors, WeChat-safe CSS, TabBar asset hashes, runtime-bundle safety. Treat a failing guard as "you reintroduced a known-bad pattern," not "the test is wrong."

## Architecture

### Service layer is the seam (frontend)

`src/services/contracts.ts` defines every service interface (`AuthService`, `PetService`, `InviteService`, …) and the `AppServices` bundle. Two implementations satisfy it:

- `src/services/mock/` — local in-memory DB + business rules (default)
- `src/services/remote/` — HTTP client + request/response mapper against the Go backend

`src/services/index.ts` picks the implementation from `process.env.TARO_APP_API_MODE` (`mock` | `remote`) and re-exports concrete services. **Pages and Zustand stores import only from `@/services`** — never reach into `mock/` or `remote/` internals. Every exported Mock service method is wrapped so it cannot run outside Mock mode.

State lives in Zustand stores under `src/store/` (`userStore`, `petStore`, `locationStore`, `uiStore`). Stores call services; pages consume stores.

### Page structure

- `src/pages/*` — the 5 main TabBar pages (login, nearby, feed, invite, mine)
- `src/subpackages/*` — secondary flows (pet create/edit/detail/manage, post create/detail, invite create/detail, settings privacy/report/block)
- `src/components/*` — shared cards/primitives; NutUI is imported only through `src/components/NutUI/index.ts` (targeted component + style imports, never the full NutUI stylesheet)
- `src/hooks/useAuthGuard.ts` — login/pet route guard applied to protected pages
- `src/utils/route.ts`, `ownership.ts`, `navigation.ts`, `format.ts` — validated route params, current-user ownership checks, Taro nav wrappers

### Backend

`backend/api/internal/http/router.go` wires all P0 routes under `/api/v1` behind `middleware.Auth`. A single `*memory.Store` (`internal/store/memory/store.go`) holds all state and enforces business rules (block visibility, invite ownership, daily limits). Responses use the `response.OK` / `response.Error` envelope. Domain types in `internal/domain`.

## WeChat Mini Program gotchas (these have all bitten before)

- **`process.env` must be compiled to literals.** `config/index.ts` injects `TARO_APP_API_MODE` / `TARO_APP_API_BASE_URL` via `defineConstants`. Referencing `process` at runtime crashes the mini program (`process is not defined`).
- **Use named Taro API imports, not `Taro.*`.** Default-import member access (`Taro.getStorageSync`) compiles to a callable-wrapper that fails on real devices (`getStorageSync is not a function`). Import `{ getStorageSync }` etc. directly. A bundle scan test enforces this.
- **All 16 rendered pages set `navigationStyle: 'custom'`** to avoid duplicate top bars; right-side controls use the shared `.capsule-safe-appbar` pattern (`--wechat-capsule-reserve: 280px`) so they clear the native WeChat capsule.
- **CSS variables can fail to resolve in WeChat WXSS.** Every color/background/shadow/border must have a hard-value fallback declared *before* the `var(...)` line. Regression tests reject token-only declarations in `pages/**`, `subpackages/**`, and shared components.
- Use shared `ui-button` / `ui-icon` CSS primitives (in `src/assets/styles/theme.scss`) and scoped NutUI Button overrides instead of emoji/text glyph icons or bare outline buttons.
- Static assets (mock images) must be local under `src/assets/mock` (copied to `dist/assets/mock` via Taro `copy`); no remote/Unsplash domains. CSS minimizer `calc` is disabled (`csso.config.calc = false`) to avoid NutUI `rpx * var()` parse warnings.
