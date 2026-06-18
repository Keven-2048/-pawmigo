# Development Plan

## Summary

Build the first phase of 宠友圈 as a WeChat Mini Program MVP:

- Scope: small-program P0 user journey only.
- Data strategy: typed Mock API first.
- UI source: Stitch project `projects/5635601718767463341`.
- Out of current phase: real Go backend, MySQL/Redis, Docker Compose, and React admin app.

The implementation should create `frontend/pet-social-mini` using Taro + React + TypeScript + NutUI/Taro + Zustand.

## Technical Stack

- Package manager: pnpm
- Mini Program framework: Taro 4.2.0
- UI library: NutUI/Taro
- Language: TypeScript
- State: Zustand
- API mode: local Mock by default, remote-ready through a service layer

Environment defaults:

```env
TARO_APP_API_MODE=mock
TARO_APP_API_BASE_URL=http://localhost:8080
TARO_APP_ENABLE_MOCK_DELAY=true
```

## Key Implementation Requirements

- Configure four bottom tabs:
  - 附近
  - 社交圈
  - 邀请
  - 我的
- Keep login and create-pet flows outside the tab flow.
- Place pet, post, settings, report, and privacy pages in subpackages where practical.
- Keep pages dependent on `services/*`, not on Mock repositories directly.
- Define shared business types for user, pet, nearby pet, invite, post, comment, report, block, and privacy settings.
- Use Zustand stores for user/session, current pet, location state, and shared UI state.
- Follow the Stitch visual system: soft green primary, warm orange accents, cream page background, rounded cards, pet-first content hierarchy.

## P0 User Journey

The first implementation should support this complete flow:

```text
login
-> create first pet
-> authorize or decline location
-> browse nearby pets or empty state
-> filter nearby list
-> open pet profile
-> create invite
-> view received/sent invites
-> accept, reject, or cancel invite
-> browse social feed
-> create post
-> open post detail
-> like/unlike
-> comment/delete own comment
-> report content
-> block user
-> update privacy settings
```

## Pages

Required MVP pages:

- Login
- Create pet
- Edit pet
- Pet management
- Nearby list
- Nearby empty state
- Nearby filter popup
- Pet profile
- Create invite
- Invite list
- Invite detail
- Feed
- Create post
- Post detail
- Mine
- Privacy settings
- Report
- Block list or block state entry

The Stitch message-center screen may be referenced visually, but full message-center implementation is not required for this phase.

## Service Layer Contract

Preserve the API shapes from `技术文档.md` at the service boundary:

- `POST /api/v1/auth/wechat-login`
- `GET /api/v1/user/me`
- `PUT /api/v1/user/privacy`
- `POST /api/v1/pets`
- `GET /api/v1/pets/my`
- `GET /api/v1/pets/:id`
- `PUT /api/v1/pets/:id`
- `DELETE /api/v1/pets/:id`
- `POST /api/v1/pets/:id/default`
- `POST /api/v1/location/update`
- `GET /api/v1/nearby/pets`
- `POST /api/v1/invites`
- `GET /api/v1/invites`
- `GET /api/v1/invites/:id`
- `POST /api/v1/invites/:id/accept`
- `POST /api/v1/invites/:id/reject`
- `POST /api/v1/invites/:id/cancel`
- `POST /api/v1/posts`
- `GET /api/v1/posts`
- `GET /api/v1/posts/:id`
- `DELETE /api/v1/posts/:id`
- `POST /api/v1/posts/:id/like`
- `DELETE /api/v1/posts/:id/like`
- `POST /api/v1/posts/:id/comments`
- `GET /api/v1/posts/:id/comments`
- `DELETE /api/v1/comments/:id`
- `POST /api/v1/reports`
- `POST /api/v1/blocks`

Mock implementations should enforce the key MVP rules:

- First pet becomes default.
- Deleting the default pet selects another default pet when available.
- Nearby list never returns real latitude or longitude for other users.
- Users cannot invite their own pet.
- Blocked users cannot see or invite each other.
- Users cannot send duplicate pending invites to the same receiving pet within 24 hours.
- Invite meet time cannot be in the past.
- Posts require text or images.
- Posts allow at most 9 images.
- Likes toggle and update counts.
- Comments are first-level only and update counts.
- Privacy settings affect nearby visibility and stranger invites.

## Verification Plan

Run the strongest available checks after implementation:

- `pnpm install`
- TypeScript type check
- Taro WeChat build
- Manual preview in WeChat Developer Tools if available

Acceptance scenarios:

- Unauthenticated users are routed to login.
- Logged-in users without pets are routed to create pet.
- Location decline shows an empty or permission state.
- Nearby filters change the visible list.
- Nearby cards never display real coordinates.
- Invite restriction cases show user-friendly errors.
- Like/comment/delete flows update visible counts.
- Report and block flows persist in Mock state.
- Privacy toggles influence Mock behavior.

## Explicit Assumptions

- This phase does not create backend, database, Redis, Docker, or admin-app code.
- Docker is not required for local validation.
- Stitch project `projects/5635601718767463341` is the canonical UI prototype source.
- The original requirement documents are reference inputs and should not be rewritten during implementation.
