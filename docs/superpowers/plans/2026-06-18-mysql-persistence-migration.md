# Plan: MySQL Persistence Migration & Deployment

Date: 2026-06-18
Phase: production-persistence preparation (opened by user)
Status: planning — the code-config groundwork is done; the live-MySQL pass is blocked on a reachable MySQL instance.

## Context

- The backend routes through the `store.Store` contract (`backend/api/internal/store/store.go`).
- `gormstore` is the persistence implementation. As of PR #4 it is production-configurable:
  - `resolveConfig(getenv)` selects **mysql** when `MYSQL_DSN` is set, else **sqlite** (`PAWMIGO_DB_PATH`, default `pawmigo.db`).
  - MySQL connection pool is configured (max open 20, max idle 10, conn max lifetime 1h).
  - `cmd/server` seeds dev data only on sqlite or when `PAWMIGO_SEED` is set — a real MySQL is never auto-seeded.
- Schema is created by `AutoMigrate` over the models in `gormstore/models.go`.
- This plan was authored in an environment with **no reachable MySQL** and where binding `:8080` is blocked, so the live pass below could not be executed here.

## Decisions needed from the user (blockers)

1. **MySQL host**: managed (Aliyun RDS / PolarDB / AWS RDS) vs self-hosted. Affects DSN, TLS, and backup strategy.
2. **Migration tooling**: keep `AutoMigrate` for now, or introduce versioned migrations (recommended before production — see below).
3. **Timestamp columns**: models store `CreatedAt`/`UpdatedAt` as ISO **strings** (`VARCHAR`), not native `DATETIME`. Keep as-is (simplest, matches current API strings) or migrate to native datetime (enables range queries/retention but needs converter changes). Recommend keeping strings for this phase.
4. **Secrets**: where `MYSQL_DSN` lives (env injected by the platform / secret manager). It must never be committed.

## Schema notes (grounded in current models)

- `[]string` fields (`PersonalityTags`, `InterestTags`, post `Images`, `TopicTags`) use `gorm:"serializer:json"` → JSON/TEXT columns in MySQL. Works; no change needed.
- Indexes already declared via gorm tags (`idx_openid` unique, `idx_pets_user_id`, `idx_pets_visible`, `idx_users_status`, etc.). Verify they materialize correctly under MySQL after the first migrate.
- Set the connection charset to `utf8mb4` in the DSN (e.g. `...?charset=utf8mb4&parseTime=true&loc=Local`) so Chinese content and emoji store correctly.

## Migration strategy

- **Dev / test**: `AutoMigrate` on sqlite stays as-is. Fast, no extra tooling.
- **Production (recommended)**: introduce versioned migrations (e.g. `golang-migrate`) so schema changes are reviewable, ordered, and reversible. `AutoMigrate` is convenient but silently alters schema and cannot drop/rename safely. Action: generate an initial migration from the current models as the v1 baseline, then disable `AutoMigrate` for the mysql driver in production.

## Live-MySQL integration pass (the blocked step)

When a MySQL instance is reachable:

1. Provision a database, set `MYSQL_DSN` with `charset=utf8mb4&parseTime=true`.
2. Run `PAWMIGO_STORE=gorm MYSQL_DSN=... go run ./cmd/server`; confirm `store mode: gorm` and `/healthz` returns the standard envelope. Confirm it does NOT auto-seed.
3. Add a build-tagged integration test (e.g. `//go:build mysql_integration`) that runs the existing `storetest.RunContract` against a gorm store opened on `MYSQL_TEST_DSN`. It is skipped locally (no DSN) and runs in CI when a MySQL service is provided — this keeps the default `go test ./...` free of any live-DB dependency.
4. Validate indexes, charset, and that all `storetest` contract cases pass against real MySQL.

## Deployment topology (sketch — confirm with user)

- API binary (`cmd/server`) behind the platform's ingress; `PAWMIGO_STORE=gorm` + `MYSQL_DSN` from secrets.
- MySQL as a managed instance with automated backups.
- Health endpoint `/healthz` wired to the platform's liveness/readiness checks.
- (Future phases, still gated) object storage / COS for uploads, Redis for caching/rate-limiting, production WeChat login.

## Suggested next steps (in order)

1. User answers the four decisions above.
2. Add the build-tagged MySQL integration test (no live DB needed to add it; runs only with `MYSQL_TEST_DSN`).
3. Introduce versioned migrations + v1 baseline; gate `AutoMigrate` to dev.
4. Run the live pass against a real MySQL; fix any charset/index findings.
5. Wire deployment config and secrets.
