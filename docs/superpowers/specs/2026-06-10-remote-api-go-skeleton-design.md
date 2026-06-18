# Remote API And Go P0 Skeleton Design

## Goal

Move 宠友圈 from a Mock-only mini-program MVP to a remote-ready integration slice:

- The Taro mini-program can switch between `mock` and `remote` service modes.
- A Go Gin backend skeleton exposes the P0 API routes used by the mini-program.
- The first remote backend uses an in-memory repository so frontend/backend contracts can be verified before MySQL, Redis, Docker, or admin work starts.

## Current Context

The current mini-program MVP is delivered on branch `plan1-foundation-auth` and PR #1. Its pages call `frontend/pet-social-mini/src/services/index.ts`, which currently guards all methods with:

```ts
const apiMode = process.env.TARO_APP_API_MODE || 'mock'
```

and throws when the mode is not `mock`. This is the intended seam for the next phase.

The service contract is already aligned with `技术文档.md` and covers the P0 flow:

- auth and current user
- privacy settings
- pet CRUD/default
- location update
- nearby pets
- invites
- posts, likes, comments
- reports
- blocks

## Recommended Scope

Implement a small vertical integration slice, not the full production backend.

In scope:

- Frontend remote adapter using Taro request APIs.
- Token persistence and Authorization header handling.
- Unified API error normalization for user-friendly page errors.
- Environment mode switch:
  - `TARO_APP_API_MODE=mock`
  - `TARO_APP_API_MODE=remote`
  - `TARO_APP_API_BASE_URL=http://localhost:8080`
- Go Gin project under `backend/api`.
- P0 route registration matching the existing mini-program service contract.
- In-memory backend repository that enforces the same MVP business rules as the Mock service where practical.
- Backend tests for route status, auth guard, and core rule enforcement.
- Frontend tests that lock request path, auth header, 401 handling, and mock/remote mode selection.

Out of scope:

- MySQL and GORM persistence.
- Redis GEO or Redis caching.
- Docker Compose as a required local path.
- React admin app.
- Production WeChat code-to-openid exchange.
- Object storage uploads and content security integrations.
- Full message center, follow/friend system, or chat.

## Architecture

### Frontend

Split the current service layer into explicit adapters:

```text
frontend/pet-social-mini/src/services/
  index.ts              mode switch and exported services
  contracts.ts          service interface types
  mock/index.ts         adapter wrapping current mockApi behavior
  remote/client.ts      Taro request client
  remote/index.ts       remote service adapter
  remote/mapper.ts      response shape normalization if needed
```

The page layer remains unchanged and continues importing from `@/services`. Pages must not know whether data comes from Mock or remote.

`remote/client.ts` owns:

- URL joining with `/api/v1`.
- `Authorization: Bearer <token>` when a token exists.
- JSON request/response handling.
- 401 handling that clears local session and returns a normalized auth error.
- Non-2xx response normalization into `ApiError`.

### Backend

Create a minimal backend under:

```text
backend/api/
  go.mod
  cmd/server/main.go
  internal/config/config.go
  internal/http/router.go
  internal/http/middleware/auth.go
  internal/http/response/response.go
  internal/modules/auth
  internal/modules/user
  internal/modules/pet
  internal/modules/location
  internal/modules/nearby
  internal/modules/invite
  internal/modules/post
  internal/modules/report
  internal/modules/block
  internal/store/memory
```

Use module-local handlers and services, but keep the implementation intentionally small. The in-memory store is the only persistence layer in this phase.

### Authentication

This phase does not call WeChat's production API. `POST /api/v1/auth/wechat-login` accepts a code and returns a deterministic development user plus a signed or dev-token string.

Protected routes require `Authorization: Bearer <token>`. Invalid or missing tokens return 401.

### Data Shape

Prefer preserving the shape already used by the Taro domain types. If Go responses use wrappers, standardize them as:

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

Frontend `remote/mapper.ts` unwraps `data` and converts server errors into typed `ApiError`.

### Business Rules

The backend in-memory store should enforce the highest-risk P0 rules:

- First pet becomes default.
- Deleting a default pet selects another default when available.
- Nearby pets never expose raw latitude or longitude for other users.
- Users cannot invite their own pet.
- Blocked users cannot see or invite each other.
- Duplicate pending invites to the same receiving pet are blocked within 24 hours.
- Invite meet time cannot be in the past.
- Posts require text or images.
- Posts allow at most 9 images.
- Likes are idempotent and update counts.
- Comments are first-level only and update counts.
- Privacy settings affect nearby visibility and stranger invites.

## Error Handling

Frontend pages should keep their current toasts and failure paths. The remote adapter should normalize backend errors into messages that existing page code can display.

Backend error responses should include:

```json
{
  "code": 40001,
  "message": "用户未登录"
}
```

The first implementation can use a small fixed error code list instead of a broad error taxonomy.

## Testing

Frontend:

- Unit tests for service mode selection.
- Unit tests for request URL and Authorization headers.
- Unit tests for 401 session clearing behavior.
- Architecture regression test that pages still import only `@/services`, not remote or mock internals.

Backend:

- `go test ./...`
- Route tests for auth, protected route 401, pet creation/default, nearby privacy, invite duplicate rule, post validation, report/block persistence.

Integration:

- Start backend locally on `:8080`.
- Build or run mini-program with `TARO_APP_API_MODE=remote`.
- Smoke the P0 happy path against the Go in-memory backend.

## Acceptance

This phase is complete when:

- `mock` mode still passes existing mini-program tests and WeChat build.
- `remote` mode compiles and points every service method at the Go route contract.
- Go backend starts locally without Docker.
- Go backend tests pass.
- A basic P0 remote smoke flow works with in-memory backend data.
- Documentation states that MySQL, Redis, Docker, admin, and production WeChat API remain future phases.

## Open Decisions

- Whether the Go dev token should be a real JWT signed by `JWT_SECRET` or a simpler opaque development token.
- Whether frontend token storage should live in the existing `userStore` only or a small dedicated auth-token utility.
- Whether remote smoke testing should be an automated Node/Go script or a manual WeChat Developer Tools checklist for this phase.
