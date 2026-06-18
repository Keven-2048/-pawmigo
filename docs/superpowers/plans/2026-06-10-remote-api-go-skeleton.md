# Remote API Go Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remote-ready frontend service adapter and a local Go Gin P0 backend skeleton for the existing 宠友圈 mini-program MVP.

**Architecture:** Keep mini-program pages behind `@/services`; split services into mock and remote adapters with one request client. Add a `backend/api` Go Gin app with in-memory storage, route-level auth, JSON response wrappers, and P0 handlers that mirror the current service contract.

**Tech Stack:** Taro 4.2, React, TypeScript, Node `node:test`, Go 1.25, Gin.

---

## File Structure

Frontend files:

- Modify `frontend/pet-social-mini/config/index.ts`: compile API mode and base URL constants.
- Create `frontend/pet-social-mini/src/services/contracts.ts`: service interface shapes shared by adapters.
- Create `frontend/pet-social-mini/src/services/mock/index.ts`: mock adapter wrapping `mockApi`.
- Create `frontend/pet-social-mini/src/services/remote/client.ts`: Taro request wrapper, token lookup, response unwrap, normalized errors.
- Create `frontend/pet-social-mini/src/services/remote/index.ts`: remote adapter endpoint mapping.
- Create `frontend/pet-social-mini/src/services/remote/mapper.ts`: response helpers where endpoint data needs conversion.
- Modify `frontend/pet-social-mini/src/services/index.ts`: choose mock or remote adapter by API mode.
- Create `frontend/pet-social-mini/tests/remote-service.test.ts`: red/green tests for mode selection, request paths, auth header, and 401 behavior.
- Modify `frontend/pet-social-mini/tests/architecture.test.ts`: update Mock-only expectation to dual-adapter expectation.

Backend files:

- Create `backend/api/go.mod`.
- Create `backend/api/cmd/server/main.go`.
- Create `backend/api/internal/domain/domain.go`.
- Create `backend/api/internal/http/response/response.go`.
- Create `backend/api/internal/http/middleware/auth.go`.
- Create `backend/api/internal/http/router.go`.
- Create `backend/api/internal/store/memory/store.go`.
- Create module handlers under `backend/api/internal/modules/*`.
- Create backend route tests under `backend/api/internal/http/router_test.go`.

Docs and handoff:

- Modify `docs/SESSION_STATE.md`.
- Modify `docs/CHANGELOG.md`.
- Modify `README.md` if local backend run commands need a new handoff section.

## Task 1: Frontend Adapter Contract And Mode Switch

**Files:**
- Create `frontend/pet-social-mini/src/services/contracts.ts`
- Create `frontend/pet-social-mini/src/services/mock/index.ts`
- Modify `frontend/pet-social-mini/src/services/index.ts`
- Test `frontend/pet-social-mini/tests/remote-service.test.ts`

- [ ] **Step 1: Write failing mode-selection tests**

Create tests that assert:

- `TARO_APP_API_MODE=mock` keeps using Mock services.
- `TARO_APP_API_MODE=remote` selects remote services.
- Unsupported modes throw a clear error.

Run:

```bash
cd frontend/pet-social-mini && npm test -- --test-name-pattern "service mode"
```

Expected before implementation: FAIL because no remote adapter exists.

- [ ] **Step 2: Implement contracts and adapters**

Move the exported service shapes into `contracts.ts`, wrap the current `mockApi` calls in `mock/index.ts`, and make `services/index.ts` choose between adapters.

- [ ] **Step 3: Run frontend tests**

Run:

```bash
cd frontend/pet-social-mini && npm test
```

Expected after implementation: PASS.

## Task 2: Frontend Remote Request Client

**Files:**
- Create `frontend/pet-social-mini/src/services/remote/client.ts`
- Create `frontend/pet-social-mini/src/services/remote/mapper.ts`
- Test `frontend/pet-social-mini/tests/remote-service.test.ts`

- [ ] **Step 1: Write failing request-client tests**

Create tests for:

- Joining `TARO_APP_API_BASE_URL` with `/api/v1` paths.
- Sending `Authorization: Bearer <token>` when Taro storage has a token.
- Unwrapping `{ code: 0, data }`.
- Throwing `Error(message)` for non-zero codes and non-2xx responses.
- Removing token on 401.

Run:

```bash
cd frontend/pet-social-mini && npm test -- --test-name-pattern "remote client"
```

Expected before implementation: FAIL because the client does not exist.

- [ ] **Step 2: Implement client**

Use `@tarojs/taro` request/storage APIs, avoid browser or Node globals, and keep errors as normal `Error` instances so existing pages can display `error.message`.

- [ ] **Step 3: Run frontend tests**

Run:

```bash
cd frontend/pet-social-mini && npm test
```

Expected after implementation: PASS.

## Task 3: Frontend Remote Service Endpoint Mapping

**Files:**
- Create `frontend/pet-social-mini/src/services/remote/index.ts`
- Test `frontend/pet-social-mini/tests/remote-service.test.ts`
- Modify `frontend/pet-social-mini/config/index.ts`
- Modify `frontend/pet-social-mini/tests/weapp-runtime.test.ts`

- [ ] **Step 1: Write failing endpoint tests**

Assert each remote service method calls the expected route:

- `POST /auth/wechat-login`
- `GET /user/me`
- `PUT /user/privacy`
- pets, location, nearby, invites, posts, comments, reports, blocks

Run:

```bash
cd frontend/pet-social-mini && npm test -- --test-name-pattern "remote service"
```

Expected before implementation: FAIL because the adapter is incomplete.

- [ ] **Step 2: Implement remote service adapter**

Map frontend camelCase payloads directly to backend JSON for this phase. The Go skeleton accepts the same shape to avoid adding broad snake_case mapping before real backend persistence exists.

- [ ] **Step 3: Compile base URL constant**

Add `process.env.TARO_APP_API_BASE_URL` to Taro `defineConstants` so WeChat bundles do not reference Node `process`.

- [ ] **Step 4: Run frontend verification**

Run:

```bash
cd frontend/pet-social-mini && npm run typecheck && npm run build:weapp && npm test
```

Expected after implementation: PASS.

## Task 4: Go Backend Skeleton And Core Infrastructure

**Files:**
- Create `backend/api/go.mod`
- Create `backend/api/cmd/server/main.go`
- Create `backend/api/internal/domain/domain.go`
- Create `backend/api/internal/http/response/response.go`
- Create `backend/api/internal/http/middleware/auth.go`
- Create `backend/api/internal/http/router.go`
- Create `backend/api/internal/store/memory/store.go`
- Test `backend/api/internal/http/router_test.go`

- [ ] **Step 1: Write failing backend infrastructure tests**

Add tests for:

- `GET /healthz` returns 200.
- `GET /api/v1/user/me` without token returns 401.
- Login returns a token, user, and hasPet.
- The token can access `/api/v1/user/me`.

Run:

```bash
cd backend/api && go test ./...
```

Expected before implementation: FAIL because backend files do not exist.

- [ ] **Step 2: Implement domain, memory store, response helpers, auth middleware, and router**

Keep the store in memory and seed it with the same current user and sample pets/posts shape as the mini-program Mock.

- [ ] **Step 3: Run backend tests**

Run:

```bash
cd backend/api && go test ./...
```

Expected after implementation: PASS.

## Task 5: Go P0 Route Handlers And Business Rules

**Files:**
- Create or modify `backend/api/internal/modules/*`
- Modify `backend/api/internal/store/memory/store.go`
- Test `backend/api/internal/http/router_test.go`

- [ ] **Step 1: Write failing route/rule tests**

Add tests for:

- first created pet becomes default
- deleting a default pet promotes another default
- nearby list never includes raw latitude/longitude
- duplicate pending invite within 24 hours is blocked
- self invite is blocked
- past invite is blocked
- posts require text or images and allow at most 9 images
- likes are idempotent
- comments update counts
- privacy hides pets from nearby and blocks stranger invites
- blocks persist and hide blocked users
- reports persist

Run:

```bash
cd backend/api && go test ./...
```

Expected before implementation: FAIL on missing routes/rules.

- [ ] **Step 2: Implement route handlers and memory store methods**

Use the same user-facing Chinese error messages as the mini-program Mock where practical.

- [ ] **Step 3: Run backend tests**

Run:

```bash
cd backend/api && go test ./...
```

Expected after implementation: PASS.

## Task 6: Remote Integration Smoke

**Files:**
- Create `backend/api/internal/http/smoke_test.go` or extend router tests
- Modify docs if manual smoke remains necessary

- [ ] **Step 1: Write remote P0 smoke test**

Use `httptest` to exercise login, pet list, nearby, create invite, create post, like, comment, report, block, privacy update.

Run:

```bash
cd backend/api && go test ./...
```

Expected before final route implementation: FAIL.

- [ ] **Step 2: Make smoke pass**

Fix only the route/store behavior needed for the P0 smoke flow.

- [ ] **Step 3: Run combined verification**

Run:

```bash
cd backend/api && go test ./...
cd ../../frontend/pet-social-mini && npm run typecheck && npm run build:weapp && npm test
```

Expected after implementation: PASS.

## Task 7: Handoff Docs And Final Verification

**Files:**
- Modify `docs/SESSION_STATE.md`
- Modify `docs/CHANGELOG.md`
- Modify `README.md`

- [ ] **Step 1: Update docs**

Record:

- frontend `mock`/`remote` modes
- backend local run command
- validation commands and results
- explicit future phases still not implemented

- [ ] **Step 2: Final verification**

Run:

```bash
cd backend/api && go test ./...
cd ../../frontend/pet-social-mini && npm run typecheck && npm run build:weapp && npm test
git status --short --branch --untracked-files=all
```

Expected: all checks pass, only intended files changed.

- [ ] **Step 3: Commit**

Commit implementation with:

```bash
git add backend frontend docs README.md
git commit -m "feat: add remote api go skeleton"
```

## Self-Review

- Spec coverage: every design acceptance point maps to Tasks 1-7.
- Placeholder scan: no placeholder steps; each task has commands and expected outcomes.
- Scope check: MySQL, Redis, Docker, admin, production WeChat API, uploads, and message center remain out of scope.
- Type consistency: frontend service names match existing exports; backend route paths match `docs/DEVELOPMENT_PLAN.md` P0 contract.
