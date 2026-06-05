# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> `AGENTS.md` is the authoritative, detailed contributor guide (in Chinese) covering design-system tokens, component-reuse rules, code conventions, and completion criteria. Read it before non-trivial work. This file is the quick orientation layer.

## Repository layout

Two deployable projects plus design docs in one repo:

- `pawmigo-server/` — Go 1.25 + Gin backend (auth, users, pet profiles, location/encounter/community APIs).
- `pawmigo-mini/` — Taro 3.6 + React + TypeScript WeChat Mini Program (the primary UI).
- `docs/superpowers/specs/` — confirmed design specs; `docs/superpowers/plans/` — implementation plans; `遛遛 Pawmigo · 功能需求文档 PRD v1.0.md` — product requirements.

Pawmigo is a dog-walking / encounter-matching / pet-community product for pet owners.

## CodeGraph

The `.codegraph/` index is initialized and running. Prefer `codegraph_*` tools (search, context, trace, callers, callees, explore) over Grep/Read for structural questions — what calls what, where is X defined, what would break. The Cursor rule at `.cursor/rules/codegraph.mdc` has the full tool-selection table. Key rule: **answer directly with 2-3 codegraph calls, don't delegate exploration to sub-agents.**

## Backend (`pawmigo-server/`)

### Commands

```bash
cd pawmigo-server
cp .env.example .env       # first time
docker compose up -d        # MySQL 8 + Redis 7 for running the real server
go run ./cmd/server         # boots on PORT (default 8080)

go test ./...               # repo + handler tests use in-memory SQLite, no MySQL needed
go test ./internal/service -run TestAuth   # single package / single test
go build ./...
go vet ./...                # there is no aggregated lint; go vet is the static check
```

Tests do **not** require MySQL/Redis — they use an in-memory SQLite DB. Only `go run ./cmd/server` needs the Docker services. The login endpoint really calls WeChat `code2session`; without valid `WX_APPID`/`WX_SECRET` a login smoke test returns a WeChat-side error, which means the chain reached the external service (not an internal routing failure).

### Architecture

Strict layering, dependencies injected via constructors, external services behind interfaces (so tests swap in fakes):

```
handler  ->  service  ->  repository  ->  model
```

- `cmd/server/main.go` — wiring/assembly and startup entry point.
- `internal/handler/` — HTTP binding, auth context, status codes, responses **only**; `router.go` mounts routes. Protected routes sit behind the JWT middleware and read identity via `middleware.CtxUserID`.
- `internal/service/` — all business rules (e.g. ownership checks, `FindOrCreateByOpenID`).
- `internal/repository/` — persistence access only (MySQL via GORM, Redis); no business decisions.
- `internal/middleware/jwt.go` — JWT sign/parse + Gin auth middleware.
- `internal/wxauth/client.go` — WeChat `code2session` client, interface-abstracted.
- `internal/model/` — GORM models; `migrations/` — MySQL init SQL.

When adding a DB field, update the GORM model, the migration, tests, and the API response contract together. Status-code convention: 401 unauthenticated, 403 forbidden, 400 bad input.

## Mini Program (`pawmigo-mini/`)

### Commands

```bash
cd pawmigo-mini
npm install
npm run dev:weapp          # taro build --watch; import pawmigo-mini/dist into WeChat DevTools
npm run typecheck          # tsc --noEmit — the front-end static check
npm run build:weapp        # production build into dist/
npm run check:routes       # validate route registration
npm run audit:weapp-ui     # UI audit (build + routes + visual check)
```

In WeChat DevTools enable "do not verify legal domains" for local dev and keep the backend on `http://localhost:8080`. The API base URL is hardcoded in `src/services/request.ts` (`http://localhost:8080/api/v1`) and must be swapped before production.

Taro 3.6.34's dependency tree pins `webpack@5.88.2` via `overrides` — do not bump webpack/Taro without re-verifying `npm run build:weapp`.

### Architecture

- `src/app.config.ts` — pages, `tabBar`, permissions. Tab pages must appear consistently in both `pages` and `tabBar.list`.
- **Services layer** — split into mock and real implementations behind a flag:
  - `src/services/api.ts` — `USE_MOCK` flag; exports either `mockApi` or `realApi` as `api`. Currently `USE_MOCK = true`.
  - `src/services/types.ts` — all domain types (`User`, `Pet`, `PetInput`, `Encounter`, `FeedPost`, `Team`, etc.). Extracted into its own file to break an import cycle between mockApi ↔ api.
  - `src/services/mockApi.ts` — full mock API backed by an in-memory+persisted database (see below).
  - `src/services/realApi.ts` — stubs that call `request.ts` for the real backend. Only a few endpoints implemented so far.
  - `src/services/request.ts` — single Taro request wrapper (attaches JWT from storage, throws on `statusCode >= 400`).
- **Mock data layer** (`src/mock/`):
  - `db.ts` — mutable mock DB loaded from seed on first access, persisted to `Taro.setStorageSync('pawmigo:db')`. Exports `db`, `persistDb()`, `resetDb()`, `nextId()`.
  - `seed.ts` — deterministic seed data (users, pets, posts, teams, etc.) via `makeSeed()`.
  - `delay.ts` — simulated latency (`TIMINGS.fast/normal/slow`) and optional `maybeFail()` for testing error paths.
- **Store** (`src/store/`) — Zustand global state:
  - `sessionStore.ts` — primary session store: `login()` (WeChat login → jwt → refreshMe), user, pets, `createPet()`, `logout()`. Persisted to Taro storage via Zustand `persist` middleware.
  - `taroStorage.ts` — Taro `StorageSync` adapter for Zustand's `persist` middleware.
  - `authStore.ts` — legacy auth state (being consolidated into sessionStore).
  - `appStore.ts` — app-level state (toast, loading, UI flags).
- `src/components/ui.tsx` — the reusable component layer (`DSButton`, `SurfaceCard`, `Field`, `Tag`, `Chip`, `AppBar`, `PageShell`, `SectionHeader`, …). **Reuse/extend these before creating new components.**
- `src/app.scss` — the design-system layer: all tokens, base classes, and component/page styles live here. Pages handle business state, data mapping, and navigation only — never re-declare colors/shadows/borders/radii/fonts inline.
- `pages/design-system/index.tsx` — visual preview page, registered only outside production; the first checkpoint for visual regression. Add an example here when introducing a new button/card/form/tag pattern.

### Design language

High-contrast neo-brutalism from the Open Design HTML prototype: warm-yellow canvas (`#fffbeb`), white cards, black `2px` borders, hard offset shadows (`4px 4px 0 #000`), bold `800/900` headings, and `translate(2px,2px)` press-displacement on interactive elements. New styles go into the design-system region of `app.scss` using existing token variables — don't hardcode new brand colors or shadows in JSX.

### Mock mode vs real backend

When `USE_MOCK = true` (current default), all API calls go through `mockApi.ts` which mutates the in-memory `db` and auto-persists to Taro storage. Data survives app restarts but a `logout()` calls `resetDb()` to restore the seed. To switch to the real backend, flip `USE_MOCK` to `false` — unimplemented real endpoints will throw "not implemented" errors.

When adding a new API endpoint:
1. Add types to `types.ts`.
2. Implement in `mockApi.ts` (for mock mode).
3. Add the stub signature to `realApi.ts` (throw `new Error('not implemented')` for now).

## Privacy constraints (project-specific)

This app uses WeChat login and location. Never write `openid`, `session_key`, real coordinates, the JWT secret, or WeChat secrets into logs, test snapshots, or commits. Per the design docs, real coordinates are used only for matching and are **not** persisted to MySQL; anything displayed externally must be desensitized.
