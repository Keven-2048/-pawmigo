# Session State

Last updated: 2026-06-17

## Current Phase

```text
WeChat Mini Program MVP scaffold and Mock-first P0 flow implemented.
Current product phase remains: WeChat Mini Program MVP + Mock first + P0 user journey.
The user accepted the current visual baseline on 2026-06-09; continue with project-plan/P0 functional work rather than further one-to-one prototype restoration unless new visual feedback is provided.
Code-level final handoff checks are current as of 2026-06-10.
The user manually completed the WeChat Developer Tools P0 walkthrough on 2026-06-10 and asked to continue; no new blocking defect was reported in that handoff message.
The user selected the next phase on 2026-06-10: real API / Go backend integration preparation.
The approved next-phase direction is documented in `docs/superpowers/specs/2026-06-10-remote-api-go-skeleton-design.md`.
The implementation plan is documented in `docs/superpowers/plans/2026-06-10-remote-api-go-skeleton.md`.
Frontend remote adapter and Go Gin P0 in-memory backend skeleton have been implemented on branch `codex/remote-api-go-skeleton`.
Remote API / Go P0 backend skeleton PR #2 has been merged into `plan1-foundation-auth`: https://github.com/Keven-2048/-pawmigo/pull/2
Do not jump directly to MySQL, Redis, Docker Compose, admin app, or production WeChat API unless the user explicitly opens that future phase.
```

## Current Active Visual Constants

Use these values for follow-up visual fixes unless the user explicitly approves a new direction:

- WeChat capsule reserve: `--wechat-capsule-reserve: 280px` in source, compiled to `280rpx` in WXSS.
- Main tab appbar icon/action controls: 80px source scale, compiled to 80rpx.
- Secondary settings/form topbar side columns: 100px source scale, compiled to 100rpx.
- Shared `ui-icon` drawing offset: `--ui-icon-offset: calc((100% - 38px) / 2)` in source, compiled to `calc((100% - 38rpx) / 2)`.
- Earlier 232px capsule and 64rpx compact-control checkpoints are historical only; do not restore them for current topbar/search/icon fixes.

## Source Of Truth

Read these before implementing product code:

1. `AGENTS.md`
2. `docs/DEVELOPMENT_PLAN.md`
3. `功能需求.md`
4. `技术文档.md`
5. Stitch project `projects/5635601718767463341`

If chat history is unavailable, continue from these files.

## Completed

- Added `backend/api/internal/store/store.go` with the `store.Store` interface, mirrored payload structs, and shared store-layer errors for the in-memory backend abstraction phase.
- Verified `cd backend/api && GOCACHE=/private/tmp/go-build-cache go build ./...` succeeds.
- Moved GORM dependencies into `backend/api/go.mod` / `go.sum`.
- Added gormstore contract tests and fixed the SQLite duplicate-index issue.
- Normalized memory payload/error aliases to `store.*`.
- Updated `middleware.Auth` and `NewRouter` to depend on `store.Store`.
- Parameterized backend HTTP tests across memory and gorm-backed stores.
- Added `cmd/server` runtime store selection with `PAWMIGO_STORE`, defaulting to memory and enabling seeded gorm persistence when set to `gorm`.

- Implemented frontend remote API mode:
  - split services into contracts, mock adapter, remote client, and remote adapter
  - added `TARO_APP_API_BASE_URL` compile-time constant
  - kept pages/stores dependent on `@/services`
  - added tests for mode selection, route mapping, Authorization header handling, API envelope unwrapping, business errors, and 401 token clearing
- Implemented `backend/api` Go Gin P0 backend skeleton:
  - health check
  - development login token
  - auth middleware
  - JSON response wrapper
  - in-memory store
  - P0 routes for user, privacy, pets, location, nearby, invites, posts, comments, reports, and blocks
  - route and smoke tests for core P0 business rules
  - direct-ID block enforcement so historical invite details, invite actions, and post comments cannot bypass blocked-user visibility rules
- Confirmed repository was a new project with only requirement and technical documents.
- Confirmed Stitch MCP connectivity and identified the PetCircle prototype project.
- Confirmed approved product implementation scope:
  - small-program MVP
  - Mock first
  - P0 closed loop
- Added persistent handoff documentation:
  - `AGENTS.md`
  - `docs/DEVELOPMENT_PLAN.md`
  - `docs/SESSION_STATE.md`
  - `docs/CHANGELOG.md`
  - `README.md`
- Implemented `frontend/pet-social-mini` Taro project scaffold.
- Added typed domain models, constants, navigation helpers, Zustand stores, and Mock-first service layer.
- Implemented core MVP pages:
  - login
  - create pet
  - nearby list and filter popup
  - pet profile
  - invite creation via pet selection
  - invite list and pending actions
  - feed
  - create post
  - post detail with like/comment/delete/report
  - mine
  - privacy settings
  - report
  - block list
- Added local TabBar icons for the four primary tabs.
- Added `.gitignore` rules for nested `node_modules`, `dist`, and `.swc` output.
- Added dedicated invite subpackage pages:
  - `subpackages/invite/create`
  - `subpackages/invite/detail`
- Rewired nearby pet cards and pet profile invite actions to the dedicated invite creation page.
- Rewired invite list cards to the dedicated invite detail page.
- Simplified pet management so it only handles pet list/default/edit/delete.
- Implemented the pet edit form with existing pet data loading and `petService.update`.
- Added route/session guard hook `src/hooks/useAuthGuard.ts` and applied it to protected main and subpackage pages.
- Added a minimal Node/TypeScript test harness for focused pure business utilities.
- Added `src/utils/ownership.ts` with current-user ownership helpers.
- Removed page-level Mock user ID `1` assumptions from invite detail and post detail:
  - invite detail now derives received/sent perspective from `useUserStore().user?.id`
  - post detail now derives delete permission from `useUserStore().user?.id`
- Tightened post-detail comment deletion UI so delete actions are only shown to the comment owner or the post owner.
- Added focused test coverage for comment deletion permission rules.
- Fixed WeChat Mini Program runtime crash `ReferenceError: process is not defined` by compiling `process.env.TARO_APP_API_MODE` to a literal through Taro `defineConstants`.
- Added a runtime bundle regression test that scans `dist/common.js` for `process.env` references.
- Expanded the WeChat runtime regression test to scan every generated `dist/**/*.js` bundle for Node `process` references.
- Replaced remote Unsplash Mock images with local mini-program static assets:
  - pet/user avatars now use local `/assets/mock/*.svg` constants
  - login hero image now uses a local asset
  - post Mock images and publish-page image picker now use local assets
- Added Taro copy configuration so `src/assets/mock` is included in `dist/assets/mock`.
- Added regression coverage that blocks reintroducing Unsplash image domains and checks built Mock image assets exist.
- User completed a visual pass in WeChat Developer Tools and did not report a screenshot-level blocker in this turn.
- Added Mock service rule regression tests for duplicate invites, invalid invites, post limits, privacy visibility, and block interactions.
- Added a Node test alias setup so service tests can import source modules that use the `@/*` path alias.
- Fixed Mock post visibility enforcement so blocked users cannot like or comment on each other's posts.
- Added remaining MVP rule regression coverage for default-pet reassignment after deleting the default pet, nearby fuzzy distance without raw coordinates, report persistence, block persistence, and duplicate-block idempotency.
- Added architecture regression tests to ensure pages/stores do not import Mock internals directly and protected pages install the shared auth guard.
- Added high-risk page action regression coverage to keep explicit failure feedback on important mutations and list loading.
- Hardened page-level error handling for post-detail like/delete, pet-management default selection, privacy save, and block-list loading.
- Added duplicate-submit regression coverage for key form pages.
- Added submitting/saving loading states and duplicate-submit guards for create-pet, create-post, report, and privacy-save flows.
- Tightened protected-page expectations so create-pet is login-protected while still allowing first-pet creation.
- Added `useAuthGuard({ requirePet: false })` to the create-pet page.
- Closed Mock block-visibility gaps:
  - blocked users no longer see each other's historical invites in invite lists
  - blocked users cannot open blocked invite details directly by ID
  - blocked users cannot read comments for a blocked post directly by post ID
- Tightened duplicate-submit coverage to require both an early-return guard and a disabled submit button.
- Added missing submit/save guards and disabled states to pet edit and invite creation pages.
- Replaced the full NutUI/Taro stylesheet import with targeted component style imports for Button and Popup.
- Added `src/components/NutUI/index.ts` as the local NutUI component wrapper and rewired app/page/component imports through it.
- Added architecture regression coverage that prevents reintroducing root NutUI component imports or the full NutUI stylesheet.
- Reduced generated `dist/app-origin.wxss` from roughly 284K to roughly 28K after the targeted NutUI style import change.
- Added a pure auth-guard destination helper and tests for unauthenticated, first-pet, and ready route states.
- Reused the auth-guard destination helper inside `useAuthGuard` so route side effects follow one tested decision path.
- Added architecture regression coverage for page bootstrap data-load failures.
- Added explicit failure toasts around bootstrap `hydrate()` and `loadPets()` calls in nearby, mine, create-post, and privacy pages.
- Added Mock rule regression coverage for like idempotency, comment count updates, comment privacy, invite action ownership, and daily invite limits.
- Added duplicate-processing guards and disabled/loading states for invite accept, reject, and cancel actions in both the invite list and invite detail.
- Centralized shared component SCSS imports in `src/app.scss` and removed per-component style side-effect imports.
- Added architecture coverage to keep shared component styles imported once from the app stylesheet.
- Eliminated the previous `mini-css-extract-plugin` CSS order warnings from the WeChat build.
- Disabled CSS minimizer calc optimization through Taro `csso.config.calc = false` to avoid NutUI `rpx * var(...)` parse warnings.
- Added architecture coverage to keep the CSS minimizer calc setting in place.
- The WeChat build now completes without warnings.
- Added explicit bootstrap failure feedback for pet-management `loadPets()`.
- Added duplicate-operation guards and disabled delete button state for pet-management default/delete actions.
- Added local login submitting state so the WeChat login button stays disabled across login, pet loading, and route transition.
- Added shared route parameter utilities for positive route IDs and supported report target types.
- Replaced direct route-param `Number(...)` parsing in detail/invite/report pages with validated parsing and explicit invalid-parameter empty states.
- Confirmed Stitch MCP remains connected and fetched the current design system plus key screens for login, create-pet, and nearby list.
- Added architecture regression coverage that locks core Stitch alignment anchors:
  - Plus Jakarta Sans / Be Vietnam Pro theme tokens
  - Stitch soft green shadow token
  - login brand mark, montage, floating tags, and agreement checkbox
  - create-pet fixed top bar, avatar upload, field grid, and sticky submit
  - nearby location bar, search field, quick filters, and pet-card status/view anchors
- Aligned the login page closer to the Stitch prototype with centered branding, floating paw mark, asymmetric pet montage, protocol checkbox gating, and WeChat one-tap login copy.
- Aligned the create-pet page closer to the Stitch prototype with a fixed title bar, round avatar upload area, segmented gender controls, two-column field grids, tag sections, and bottom sticky submit.
- Aligned the nearby list first screen closer to the Stitch prototype with a location/search/quick-filter header and pet cards using a status pill plus invite/view actions.
- Updated shared theme tokens and global font usage to follow the Stitch design system more directly.
- Fetched and reviewed Stitch prototype screens for pet profile and invite creation.
- Added architecture regression coverage that locks Stitch flow anchors for pet profile and invite creation:
  - pet profile fixed nav buttons, immersive cover, floating avatar, owner strip, metric grid, and bottom invite bar
  - invite creation fixed top bar, target card, my-pet selector card, invitation type grid, schedule/location card, safety tips, and sticky send action
- Aligned the pet profile page closer to the Stitch prototype with an immersive hero image, floating avatar, de-emphasized owner information, profile metrics, and fixed bottom invite action.
- Aligned the invite creation page closer to the Stitch prototype with target pet card, selected own-pet card, three-column invite type cards, combined time/location card, safety tips, and sticky send action.
- Fetched and reviewed Stitch prototype screens for invite list and invite detail.
- Added architecture regression coverage that locks Stitch transaction anchors for invite list, invite cards, and invite detail:
  - invite list appbar, segmented tabs, and status filter chips
  - invite cards with paired avatars, schedule/location rows, detail action, and explicit accept copy
  - invite detail topbar, status strip, match card, arrangement cards, safety card, and bottom action bar
- Aligned the invite list page closer to the Stitch prototype with appbar title/search, received/sent segmented tabs, status filter chips, and filtered list rendering.
- Aligned invite cards closer to the Stitch prototype with paired pet avatars, status pills, schedule/location rows, and accept/reject/detail actions.
- Aligned the invite detail page closer to the Stitch prototype with a status strip, paired-pet match card, activity arrangement cards, safety tip card, and fixed bottom actions.
- Fetched and reviewed Stitch prototype screens for social feed, create post, and post detail.
- Added architecture regression coverage that locks Stitch social anchors for feed, post cards, create post, and post detail:
  - feed appbar, underline tabs, FAB publish action, and ChongYouQuan brand anchor
  - post cards with more action, location pill, and share action
  - create-post topbar, pet identity card, photo grid, utility row, visibility grid, and pet-identity publishing copy
  - post-detail topbar, article card, image grid, comment bubbles, bottom input, and friendly placeholder copy
- Aligned the social feed page closer to the Stitch prototype with a brand appbar, underline feed tabs, and floating publish button.
- Aligned post cards closer to the Stitch prototype with a more action, location pill, larger media, and share action.
- Aligned the create-post page closer to the Stitch prototype with a fixed topbar, pet identity card, transparent text area, photo upload grid, utility pills, 2x2 visibility grid, and sticky publish action.
- Aligned the post-detail page closer to the Stitch prototype with an independent article card, asymmetric media grid, topic tags, interaction bar, comment bubbles, and bottom comment input.
- Fetched and reviewed Stitch prototype screens for mine, pet management, privacy settings, and report.
- Added architecture regression coverage that locks Stitch account/settings anchors for:
  - mine appbar, stats, pet strip, quick actions, and grouped menu
  - pet-management topbar, pet-count summary, visibility row, and switch-like control
  - privacy topbar, location safety card, grouped settings, black-list entry, and sticky save
  - report topbar, target card, reason grid, evidence upload placeholder, and sticky submit
- Aligned the mine page closer to the Stitch prototype with a compact `ChongYouQuan` appbar, centered profile, stat card, horizontal pet strip, quick actions, and grouped settings menu rows.
- Aligned the pet-management page closer to the Stitch prototype with a topbar, green summary card, pet cards with default badges, visibility status, switch-like default controls, edit entry, and protected delete actions.
- Aligned the privacy page closer to the Stitch prototype with a topbar, safety info card, social/system/account groups, black-list entry, shield footer, and fixed save button.
- Aligned the report page closer to the Stitch prototype with a topbar, target summary, two-column reason grid, detailed textarea, evidence upload placeholder, and fixed submit button.
- Fetched and reviewed Stitch prototype screens for nearby empty state and nearby filter popup.
- Added architecture regression coverage that locks Stitch discovery anchors for:
  - nearby empty-state illustration, social-circle CTA, relocate action, and feed navigation
  - filter-sheet drag handle, close action, grouped sections, invitation-availability switch, reset, and result-count submit action
- Aligned the nearby empty state closer to the Stitch prototype with a branded illustration card, `Go to Social Circle` primary CTA, and `Relocate` secondary action.
- Aligned the nearby filter popup closer to the Stitch prototype with a handle, close button, grouped filter sections, invitation-only switch row, reset button, and `显示结果` action.
- Responded to user feedback that the implementation still did not feel visually close to the prototype.
- Replaced SVG placeholder mock images with compressed local JPEG pet/owner photography derived from the Stitch prototype's visual direction.
- Updated Mock users, pets, and feed posts so the login montage, nearby pet cards, mine avatars, and social feed use photo-led sample data instead of placeholder SVGs.
- Reworked the primary visual foundation for login, nearby discovery, `PetCard`, feed header, and `PostCard`:
  - photo-led cards and montage
  - lighter Stitch-style cards/shadows
  - tighter 390px mobile spacing and typography
  - CSS-drawn icon affordances instead of emoji/text placeholder icon art
- Added visual regression coverage to prevent primary surfaces from reintroducing placeholder icon text/emoji art, to require local photo assets, and to keep mock photo assets below the mini-program warning threshold.
- Reworked the screenshot-reported visual root causes:
  - added shared `ui-button` and `ui-icon` primitives in `src/assets/styles/theme.scss`
  - replaced the login letter mark with a CSS paw mark
  - replaced main-page and key secondary-page letter/symbol placeholder icons with CSS-drawn semantic icons
  - regenerated all bottom TabBar PNG assets as line icons for nearby, feed, invite, and mine
  - moved visual-critical login, nearby, pet-card, invite-card, mine, and empty-state actions to local `ui-button` views
  - added scoped NutUI Button color overrides in `src/app.scss` for remaining form/detail actions so default/disabled styles do not render as blank outline buttons
  - reduced heavy 800/900 font weights across primary surfaces and shared components to better match the Stitch soft-minimal typography
- Added visual regression coverage for:
  - placeholder icon text/symbols on primary surfaces and key secondary pages
  - primary `ui-button` usage for visual-critical actions
  - NutUI Button color overrides for remaining form/detail actions
  - exact regenerated TabBar icon asset hashes
- Investigated the user's latest WeChat Developer Tools screenshots showing theme colors, font color/weight, icon quality, TabBar icons, and button fill states were still wrong.
- Identified the likely root cause that Stitch theme tokens were declared only on `:root`, which is less reliable for WeChat Mini Program page-level WXSS inheritance.
- Bound the Stitch design tokens to `:root, page` and updated token values to match the Stitch project:
  - background `#f7fbed`
  - primary `#326b00`
  - primary container `#76b947`
  - secondary container `#feb246`
  - text `#191d15`
  - softer text `#41493a` / `#727a68`
- Added hard-value fallbacks before CSS-variable declarations for global page styles, shared `card`, shared `ui-button` variants, NutUI button overrides, and the login CTA to prevent transparent/blank action buttons if variables fail to resolve.
- Replaced the remaining text-based `ui-icon--info` glyph with a pure CSS-drawn info icon.
- Regenerated bottom TabBar PNG assets again with clearer semantic line icons:
  - nearby: map pin instead of target/crosshair
  - feed: rounded chat bubbles
  - invite: rounded envelope with seal
  - mine: user/profile outline
- Added visual regression coverage requiring WeChat theme tokens to be bound to `page`.
- Updated TabBar asset hash regression coverage for the new icon set.
- Re-reviewed the user's main WeChat Developer Tools screenshots for login, nearby permission/empty state, feed, invite list, and mine.
- Reconfirmed Stitch MCP connectivity and fetched the current Stitch design system from `projects/5635601718767463341`.
- Added stricter visual regression coverage for:
  - WeChat-safe hard `background-color` fallbacks on shared `ui-button` variants
  - CSS-drawn icons for main visual actions instead of text glyph placeholders
  - CSS-drawn icons for secondary topbar controls and small affordances
- Extended shared CSS icon primitives for check, add, close, chevron, more, heart, share, camera, back, edit, visibility, and visibility-off states.
- Replaced remaining text glyph placeholder icons across the main and key secondary surfaces, including login checkbox, feed FAB/post actions, nearby filter close, invite cards/detail/create, mine profile/add/menu arrows, pet detail/manage/create, post create/detail, privacy, and report.
- Softened heavy visual weights on primary cards, chips, section titles, post/invite actions, and settings entries so the UI follows the Stitch soft-minimal typography more closely.
- Switched the feed floating publish button to Stitch-style `primary-container` treatment instead of deep primary fill.
- Rebuilt `frontend/pet-social-mini/dist` and confirmed the generated WeChat app config uses the cream TabBar chrome and new semantic tab icons.
- Responded to the user's screenshot feedback that main and secondary screens still looked too black/white, text-heavy, and icon-inaccurate.
- Added screenshot-level visual regression coverage requiring primary screens and shared cards to keep hard Stitch colors, soft shadows, filled buttons, and softened type instead of gray wireframe fallback styling.
- Added an independent `subpackages/pet/edit/index.scss` and aligned the pet edit page with Stitch-style topbar, avatar card, field grid, rounded inputs, chips, switch rows, and sticky submit action.
- Reworked the block-list page into a Stitch-style secondary settings screen with a topbar back icon, safety card, CSS-drawn block icon, soft card list, avatars, and status pills.
- Added hard Stitch color fallbacks and lighter text weights across primary screenshot surfaces and shared components:
  - login
  - nearby permission/empty/filter states
  - feed
  - invite list
  - mine
  - `PetCard`
  - `PostCard`
  - `InviteCard`
  - `EmptyState`
  - `TopBar`
  - `Section`
  - `TagList`
- Re-generated the bottom TabBar PNG assets again so:
  - nearby is now a clear map pin instead of a compass/crosshair target
  - feed is now rounded chat bubbles instead of a pet/paw symbol
  - invite remains a rounded envelope
  - mine remains a rounded user/profile icon
- Updated TabBar semantic constants and asset hash regressions to match the new pin/social/mail/person icon set.
- Ran full verification after the visual pass; `pnpm typecheck`, `pnpm build:weapp`, and `pnpm test` all passed with 52/52 tests.
- Added a broad secondary-page visual regression that rejects bare CSS variable-only background/color/shadow/border values in `subpackages/**/index.scss`, so secondary pages keep WeChat-safe Stitch hard fallbacks.
- Added hard-value fallbacks across remaining subpackage styles for page backgrounds, card shadows, text colors, primary/secondary fills, surface fills, outlines, and fixed submit buttons.
- Softened the publish-post image add tile and report evidence upload tile from heavy dashed wireframes into lighter Stitch-style upload surfaces.
- Re-ran full verification; `pnpm typecheck`, `pnpm build:weapp`, and `pnpm test` all passed with 53/53 tests.
- Added main-page and shared-component visual regression coverage that rejects bare CSS variable-only color/background/shadow/border declarations where they can degrade in WeChat WXSS.
- Added screenshot-specific regression coverage for remaining nearby-search and mine-page wireframe fallbacks.
- Fixed remaining main-page visual fallbacks from the user's screenshots:
  - nearby search icon now has hard muted-green fallbacks instead of bare `var(--color-outline)`.
  - mine search icon now uses hard primary-green fallbacks.
  - mine add-pet tile is now a subtle green filled surface instead of a heavy dashed outline.
  - mine notification dot now has a hard danger-color fallback.
- Updated root `project.config.json` with `miniprogramRoot: "frontend/pet-social-mini/dist/"` so WeChat Developer Tools opened from the repository root loads the rebuilt mini-program package.
- Added a regression test that enforces the root WeChat project config points at `frontend/pet-social-mini/dist/`.
- Rebuilt `frontend/pet-social-mini/dist` and confirmed generated WXSS contains the latest visual fallbacks.
- Re-ran full verification; `pnpm typecheck`, `pnpm build:weapp`, and `pnpm test` all passed with 56/56 tests.
- Re-reviewed the user's latest screenshots and reconfirmed Stitch MCP/design-system connectivity for `projects/5635601718767463341`.
- Added cache-busting `*-stitch-v2.png` TabBar asset names and rewired the generated WeChat app to use the v2 paths, while preserving the semantic pin/social/mail/person artwork.
- Strengthened global WeChat-safe visual foundations with font inheritance, card border fallback, soft shadow token, primary-button text fallback, and button color inheritance.
- Softened screenshot-reported primary surfaces and shared cards:
  - login
  - nearby permission/search/actions
  - feed
  - invite list
  - mine
  - `PetCard`
  - `PostCard`
  - `InviteCard`
  - `EmptyState`
- Updated TabBar asset regression tests so future builds must reference `assets/tabbar/*-stitch-v2.png` instead of stale non-versioned paths.
- Rebuilt `frontend/pet-social-mini/dist` and confirmed generated `dist/app.json` references the `*-stitch-v2.png` TabBar paths.
- Re-ran full verification; `pnpm typecheck`, `pnpm build:weapp`, and `pnpm test` all passed with 58/58 tests.
- Clarified README WeChat Developer Tools instructions so opening either the repository root or `frontend/pet-social-mini` routes to `frontend/pet-social-mini/dist`.
- Expanded project-config regression coverage so root, `frontend/pet-social-mini`, and generated `dist` WeChat project configs all point at the correct generated mini-program package.
- Re-ran full verification after the README and multi-entry project-config regression update; `pnpm typecheck`, `pnpm build:weapp`, and `pnpm test` still pass with 58/58 tests.
- Investigated the WeChat real-device runtime error:
  - `getStorageSync is not a function`
  - `Maximum call stack size exceeded`
- Traced the root cause to generated bundle calls like `u().getStorageSync("token")`, caused by default `Taro` runtime API member access compiling through a callable default-import wrapper.
- Replaced default `Taro.*` runtime API usage with named Taro API imports for:
  - storage APIs in `src/store/userStore.ts` and `src/hooks/useAuthGuard.ts`
  - shared navigation/toast APIs in `src/utils/navigation.ts`
  - direct page/subpackage route and login APIs
- Added a WeChat runtime bundle regression test that scans generated `dist/**/*.js` and rejects callable-wrapper access for storage, login, route, and toast APIs.
- Rebuilt `frontend/pet-social-mini/dist` and confirmed direct bundle scans no longer find callable-wrapper Taro API calls such as `x().getStorageSync(...)`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 59/59 tests.
- Re-reviewed the user's latest secondary-page screenshots showing:
  - duplicate top navigation on pages such as pet detail, pet management, invite creation, and create post
  - page proportions that felt too small compared with the Stitch 390px mobile prototype
  - off-center or visually shrunken CSS icons
  - sticky submit buttons rendering as small bottom-left capsules instead of full-width actions
- Fixed the duplicate topbar root cause by setting `navigationStyle: 'custom'` on all 16 rendered MVP pages:
  - login, nearby, feed, invite, mine
  - pet create/edit/detail/manage
  - post create/detail
  - invite create/detail
  - settings privacy/report/block
- Re-scaled the screenshot-reported surfaces toward Stitch proportions:
  - main tab pages now use a larger custom-navigation top offset and 40rpx horizontal rhythm
  - fixed custom topbar pages now use a 176rpx topbar band with 88rpx top padding and 40rpx side padding
  - pet detail now uses 40rpx side rhythm, lower hero nav controls, and full-bleed hero offsets
  - pet management/privacy/report/block in-flow topbar pages now start below the custom navigation safe area
- Fixed icon alignment by adding shared `ui-icon` pseudo-element centering, removing scaled-down topbar icon containers on affected pages, and correcting post-card action icon baselines.
- Fixed sticky action sizing by forcing remaining NutUI form/detail primary buttons such as publish and send invite to render full-width.
- Added regression tests covering all-page custom navigation, screenshot-reported custom-nav proportions, centered shared icon primitives, and full-width NutUI sticky action buttons.
- Rebuilt `frontend/pet-social-mini/dist` and confirmed all 16 generated `dist/**/index.json` files output `navigationStyle: "custom"`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 62/62 tests.
- Re-reviewed the user's latest WeChat Developer Tools screenshots showing:
  - right-side search/action icons on Mine and Feed colliding with or sitting under the WeChat capsule
  - Mine function cards, menu rows, and fonts still reading too small
  - Feed appbar, tabs, post-card typography, and icons still reading too small
  - Pet Management topbar improved but still tight near the capsule
- Reconfirmed Stitch MCP connectivity for `projects/5635601718767463341` and re-read the current Stitch design system before changing styles.
- Added a shared `.capsule-safe-appbar` / `.capsule-safe-appbar__action` pattern that reserves right-side WeChat capsule space.
- Applied capsule-safe appbar classes to Feed, Invite, Mine, and Pet Management right-side actions.
- Enlarged primary screenshot-reported surfaces toward the Stitch prototype scale:
  - Mine appbar, profile avatar, stats card, pet strip, quick actions, menu rows, menu icons, and logout action
  - Feed appbar, brand, title, underline tabs, post-card avatar/name/meta/content/more/action icons
  - Invite list appbar, segmented tabs, filter chips, invite cards, schedule rows, status pills, and actions
  - Pet Management topbar, summary card, pet avatars, edit action, visibility row, default switch, and action buttons
- Removed residual `transform: scale(0.x)` icon shrinkage from primary flow styles including login checkbox, nearby filter close, mine badge/menu icons, invite card icons, create-post utility icons, invite create/detail info icons, pet edit camera, post-detail counts, privacy entries, report evidence, and block safety icon.
- Added regression coverage for main tab appbars reserving WeChat capsule space, primary screenshot surfaces keeping prototype-scale typography/icon dimensions, and primary flow styles rejecting shrunk clickable icon containers.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 65/65 tests.
- Re-reviewed the user's latest screenshots showing:
  - `PostCard` and post-detail heart/comment/share icons still visually misaligned.
  - post-detail bottom comment composer rendering with awkward proportions.
  - pet-detail identity, owner, and metric rows feeling cramped.
  - secondary topbar right-side controls still needing WeChat capsule safety treatment.
- Reworked shared post action icon geometry:
  - replaced the old double-blob heart drawing with a centered CSS heart primitive.
  - corrected the comment bubble tail anchor so it no longer drops below the action baseline.
  - tightened the share arrow geometry and added dedicated `post-action-icon` classes for `PostCard` and post detail.
- Reworked post-detail layout:
  - aligned the interaction row around fixed 42rpx action icon boxes.
  - replaced the NutUI comment send button with a local `ui-button` capsule.
  - changed the bottom composer to a stable two-column grid so the input and send action keep predictable proportions.
- Reworked pet-detail layout:
  - split pet identity copy into its own column and turned distance into a separate pill.
  - added an owner-copy wrapper so owner text no longer crowds the avatar.
  - vertically centered metric cards and stabilized value/label sizing.
- Added secondary topbar capsule-safe coverage for post detail, invite create, invite detail, and pet detail right-side controls.
- Centralized current-phase Mock-only enforcement in the service layer by wrapping every exported service method with `useMock(...)`.
- Added architecture regression coverage that verifies exported services cannot call `mockApi` outside the Mock-mode guard.
- Downloaded Stitch prototype HTML for Mine, Feed, and pet detail screens to compare source-level structure against the current mini-program implementation.
- Re-aligned Mine page quick actions with the Stitch prototype:
  - first action is now `切换主宠` with a CSS-drawn swap icon
  - second action is now `宠书管理` with an icon+text layout
  - both actions route to pet management instead of sending the first action to pet creation
- Added architecture regression coverage to keep the Mine quick-action labels and swap icon aligned with the Stitch prototype and prevent the previous `记录生活` mismatch from returning.
- Re-aligned the Social Circle TabBar icon with the Stitch prototype's pet/paw semantic instead of the previous chat-bubble icon:
  - generated `assets/tabbar/feed-stitch-v3.png`
  - generated `assets/tabbar/feed-stitch-v3-active.png`
  - updated `app.config.ts` to reference the v3 feed icon paths for cache busting
  - updated `tabbarSemantics.feed` to `pets`
- Added asset regression coverage so the Social Circle tab stays on the v3 pet/paw icon and does not revert to the v2 chat-bubble path/semantic.
- Re-aligned the Mine page stats bar with the Stitch prototype:
  - stats labels are now `关注` / `粉丝` / `动态` / `邀请`
  - removed the previous `宠物` / `获赞` / `邀约` mismatch from the stats row
- Re-aligned the Mine pet strip with the Stitch prototype:
  - pet avatars now render as circular portraits
  - the default pet gets a green ring and `ACTIVE` badge
  - default pet helper text now reads `主宠`
- Added regression coverage so Mine keeps the Stitch stats labels, circular pet avatar wrapper, active ring, and `ACTIVE` default-pet badge.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 69/69 tests.
- Increased the shared WeChat capsule reserve to `--wechat-capsule-reserve: 232px` after screenshot feedback showed right-side controls could still sit too close to the native capsule.
- Applied the 232px capsule-safe reserve to main tab appbars and secondary right-side topbar controls:
  - Feed, Invite, and Mine shared `.capsule-safe-appbar`
  - invite creation
  - invite detail
  - post detail
  - pet detail floating navigation
- Hardened shared CSS-drawn `ui-icon` primitives with `inline-flex`, center alignment, and a minimum 38px drawing box so small icon-only controls do not shrink or offset the pseudo-element artwork.
- Added explicit flex-centering for common icon-only controls on login, Mine, invite cards, privacy, report, and block-list pages.
- Added visual regression coverage for the 232px capsule reserve, shared `ui-icon` minimum drawing box, and common icon-only controls staying centered.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 70/70 tests.
- Continued the Stitch visual parity pass for the user's latest icon/proportion feedback:
  - switched Nearby location, refresh, search, Feed location/search, and main tab appbar icons to shared centered `ui-icon` primitives instead of page-local hand-drawn small shapes
  - added a shared CSS `ui-icon--refresh` primitive
  - enlarged Nearby's filter action to a 64rpx prototype-scale capsule
  - enlarged privacy, report, block-list, pet-management, and pet-edit topbar touch targets/grid columns
  - enlarged privacy rows/icons, report reason/evidence/textarea controls, block-list cards/status/avatar, and invite-detail status pill
  - added a centered metadata icon row to `PetCard`
  - fixed `InviteCard` schedule/location icon alignment by removing left-biased transform origins and using 42rpx centered icon boxes
- Added regression coverage for:
  - main tab appbar icons using shared centered 64rpx controls
  - secondary settings topbars keeping Stitch-scale 84rpx/80rpx/64rpx touch targets
  - secondary settings content avoiding undersized controls
  - shared card metadata icons avoiding left-biased alignment origins
  - invite detail status pill and status icon scale
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 74/74 tests.
- Cleaned up obsolete unreferenced TabBar PNG assets from `src/assets/tabbar` so only the current cache-busting Stitch assets remain:
  - `nearby-stitch-v2*.png`
  - `feed-stitch-v3*.png`
  - `invite-stitch-v2*.png`
  - `mine-stitch-v2*.png`
- Tightened TabBar regression coverage so stale non-versioned icons and the previous `feed-stitch-v2` social icon cannot be reintroduced silently.
- Updated README WeChat Developer Tools guidance to mention the current mixed TabBar cache-busting paths: `nearby/invite/mine-stitch-v2` and `feed-stitch-v3`.
- Reconfirmed Stitch MCP/design-system connectivity for `projects/5635601718767463341`.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 74/74 tests.
- Replaced the stale README scaffold-next-step section with the current implemented MVP state and current mini-program handoff guidance.
- Softened the Mine default-pet `ACTIVE` badge from `font-weight: 700` to `600` so the account page stays closer to the Stitch soft label hierarchy.
- Added regression coverage for the README current-state handoff and Mine default-pet badge font weight.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 75/75 tests.
- Removed obsolete SVG placeholder mock assets from `src/assets/mock` so only the current local JPEG pet/owner/post/empty-state assets remain.
- Added regression coverage requiring both source and compiled mock visual asset directories to stay free of SVG placeholder leftovers.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-ran verification; `npm run typecheck`, `npm run build:weapp`, and `npm test` all pass with 76/76 tests.
- Repaired the Mine account visual regression after the latest Stitch alignment pass:
  - regression coverage now accepts the page's dynamic `ui-icon--${item.icon}` rendering pattern
  - menu data is locked to the Stitch icons `pets`, `sparkle`, `group`, and `lock`
  - the `宠圈精彩动态` menu item is locked to `switchTab` with `/pages/feed/index`
  - shared theme coverage locks the corresponding CSS-drawn account menu icons
- Re-verified `npm test`, `npm run typecheck`, `npm run build:weapp`, and `npm test` after the Mine regression fix; all checks pass with 76/76 tests.
- Continued the source-level Stitch comparison for secondary pages using cached Stitch HTML plus live Stitch MCP connectivity.
- Aligned secondary-page visual vocabulary closer to the Stitch prototype:
  - privacy settings now uses the prototype copy for `在“附近”可见`, stranger invites, owner nickname display, location privacy safety text, shield footer, and `Version 2.4.0 (Build 82)`
  - report now starts with no selected reason, shows `请先选择一个举报理由` before submitting, uses prototype reason labels, and treats report details as optional copy
  - create-post now uses prototype visibility labels `公开` / `附近` / `粉丝` / `私密`, adds visibility icons, a pet-identity swap icon, a tag icon, and a send icon in the publish action
  - pet management summary now matches the prototype count rhythm with `{pets.length} 只萌宠`
- Extended `PostVisibility` with `followers` for the current Mock-first UI option without adding a real following/follower backend.
- Added CSS-drawn shared `ui-icon` primitives for `person-add`, `badge`, `map`, `tag`, `send`, and `walk`.
- Added architecture regression coverage for the secondary Stitch visual vocabulary so these labels, icons, and the `followers` visibility option do not silently regress.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test`, `npm run typecheck`, `npm run build:weapp`, and `npm test`; all checks pass with 77/77 tests.
- Continued the Stitch form-page alignment pass for create-pet and invite creation using cached Stitch HTML/PNG references plus live Stitch MCP design-system connectivity.
- Aligned the create-pet form closer to the prototype:
  - avatar upload badge now uses a centered CSS camera icon instead of text-like styling
  - `体重 (kg)` matches the prototype label
  - `性格标签` and `兴趣爱好` now use prototype-style section title rows with `face` and `star` CSS icons
  - sticky submit action now renders a centered `rocket` icon beside `保存并开始探索`
- Aligned invite creation closer to the prototype:
  - visible invitation type cards are fixed to `walk` / `play` / `park` / `coffee` / `custom`, matching `遛弯儿` / `玩耍` / `公园见` / `宠物店` / `自定义`
  - the previous accidental fifth card `一起拍照` is no longer shown in the first prototype row
  - safety tips now use a shield icon
  - sticky send action now includes a centered send icon beside `发送邀请`
  - create-invite styles gained hard Stitch color/shadow fallbacks for WeChat-safe rendering
- Added regression coverage for the create-pet form title icons, submit rocket icon, invite type ordering/copy, shield safety icon, send icon, and shared `face` / `star` / `rocket` icon primitives.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test`, `npm run typecheck`, `npm run build:weapp`, and `npm test`; all checks pass with 77/77 tests.
- Continued secondary form-page visual alignment using cached Stitch PNG/HTML references plus live Stitch MCP design-system connectivity.
- Aligned the create-post page closer to the prototype:
  - pet identity card now uses an avatar wrapper with a small bottom-right swap badge instead of a separate large trailing switch icon
  - public visibility now uses a shared CSS `globe` icon to match the prototype's public/world symbol
  - visibility section now has a title row with a visibility icon
  - photo add tile is simplified to camera + `0/9` style count, closer to the prototype upload grid
  - location remains editable but is presented inside the lightweight utility pill instead of as a heavy extra input row
  - sticky publish action now explicitly centers NutUI button children so the send icon and text do not drift
- Aligned the report page closer to the prototype:
  - target card now uses a local pet photo (`MOCK_IMAGES.dog`) instead of a text initial placeholder
  - reason heading uses the flag/report icon vocabulary
  - evidence upload tile uses the softer Stitch upload surface while preserving the larger touch area
- Cleaned up the privacy shield footer by removing the residual `transform: scale(...)` icon enlargement and using a stable centered icon container.
- Added regression coverage for create-post identity badge/send alignment/globe icon, report target image/flag icon, and the privacy shield no-scale rule.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test`, `npm run typecheck`, `npm run build:weapp`, and `npm test`; all checks pass with 78/78 tests.
- Increased the active shared WeChat capsule reserve from the earlier 232px checkpoint to `--wechat-capsule-reserve: 280px` after the latest screenshots still showed right-side search/action controls too close to the native capsule.
- Applied and verified the 280px/280rpx reserve in the compiled package for Feed, Invite, and Mine shared appbars, invite creation, invite detail, post detail, and pet-detail floating navigation.
- Added dist-level WeChat visual regression coverage in `frontend/pet-social-mini/tests/weapp-runtime.test.ts` so compiled WXSS must keep Stitch proportions, 280rpx capsule safety, and centered `ui-icon` offsets.
- Added dist-level stale-measurement coverage rejecting old compact navigation values such as `padding:88rpx 232rpx`, `right:232rpx`, `grid-template-columns:84rpx`, and old 64rpx icon touch targets on critical navigation/topbar files.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 80/80.
- Continued the visual hardening pass for critical secondary/detail pages after the 280px capsule-safe checkpoint.
- Added architecture regression coverage requiring critical secondary/detail SCSS token declarations to be paired with same-property hard visual fallbacks before the `var(...)` declaration.
- Added hard Stitch color/shadow/border fallbacks to:
  - `subpackages/invite/detail/index.scss`
  - `subpackages/pet/detail/index.scss`
  - `subpackages/post/detail/index.scss`
  - `subpackages/settings/privacy/index.scss`
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test` and `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 81/81.
- Extended the same hard visual fallback rule to main pages and shared components so page-level tab underlines, checkbox borders, active pet rings, menu dividers, filter chips, and post-card location icons do not rely on token-only border-color declarations.
- Added same-property hard border fallbacks to:
  - `pages/feed/index.scss`
  - `pages/login/index.scss`
  - `pages/mine/index.scss`
  - `pages/nearby/index.scss`
  - `components/PostCard/index.scss`
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test` and `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 82/82.
- Expanded the secondary-page hard fallback rule from only critical detail pages to every `subpackages/**/index.scss` file.
- Added remaining same-property hard fallbacks for:
  - create-pet avatar/segment/form/chip borders
  - edit-pet form/switch/chip borders
  - pet-management empty-state icon/copy colors
  - create-post avatar and visibility-card borders
  - report reason/textarea borders
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm test` and `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 82/82.
- Reconfirmed live Stitch MCP access and downloaded current Stitch HTML references for Mine, Feed, and Nearby screens for this visual pass.
- Continued the screenshot-driven proportion/icon pass after the 280px capsule-safe checkpoint:
  - Feed publish FAB now uses flex centering and a 68px icon box instead of transform-based scale/translate positioning.
  - Mine profile verification badge icon and location icon now use full 44px centered boxes.
  - Mine default-pet `ACTIVE` badge is larger and more readable at 34px height / 20px text.
  - Invite detail pet tags and stat labels no longer use undersized 18px labels.
  - Privacy footer copy/version, report target badge/description/hints, block-list status chip, and pet-edit switch helper copy no longer use sub-20px text.
- Extended source-level and compiled-WXSS visual regression coverage for:
  - Feed FAB flex centering and 68rpx icon geometry.
  - Mine badge/location icon boxes and active-pet badge readable scale.
  - Invite detail, privacy, report, block-list, and pet-edit secondary text/chip scale.
  - transform-based icon drift patterns such as `translate(-50%, -50%) scale(...)`.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 82/82.
- Continued the secondary-page Stitch parity pass using cached Stitch HTML references and the existing `frontend-design`/Superpowers workflow.
- Reworked pet management so the card switch now controls `pet.visible` through `petStore.updatePet(...)` instead of acting as a default-pet button; default/delete actions were reduced to a lightweight management row to better match the Stitch pet-management card structure.
- Added a shared `settings-switch` visual primitive and replaced native WeChat `Switch` controls on create-pet, pet-edit, and privacy-settings pages so secondary form toggles keep consistent 82px/44px Stitch proportions, color, and alignment.
- Added source and compiled-WXSS regression coverage to prevent native switches from returning on those secondary form pages and to lock the compiled 82rpx/44rpx switch geometry.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 83/83.
- Continued the secondary settings polish pass to remove remaining half-finished visual cues.
- Reworked the block-list rows from `#id` letter/number avatars into local photo avatars with a CSS-drawn block overlay, so the page reads as a finished settings list instead of a placeholder implementation.
- Replaced the privacy account-cancellation development copy `该能力当前仅作为设置入口展示` with user-facing safety-process copy.
- Added source and compiled-WXSS regression coverage so block-list rows keep local photo avatars, the 56rpx block overlay, and do not regress to numbered placeholder avatars or development-state copy.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 83/83.
- User accepted the current visual baseline and redirected follow-up work back to the project plan rather than further prototype restoration.
- Tightened the Mine page so non-current-phase entries do not behave like dead links:
  - `特别关注列表`, `消息与通知中心`, and `关于宠友圈` now show an `即将开放` status pill.
  - static entries no longer render the chevron affordance or bind an empty click handler.
  - architecture coverage now locks this current-phase boundary.
- Added a P0 safety closure on post detail:
  - non-owner post detail now exposes `拉黑作者`.
  - the action calls `blockService.create(post.userId, '不想再看到该作者内容')`, shows success/failure feedback, and returns to the previous page.
  - the action remains service-layer based and uses existing Mock block rules to hide blocked users' content and interactions.
- Tightened post-detail comment actions inside the current P0 scope:
  - removed the previous static `回应` / `喜欢` comment action labels because reply and comment-like features are out of the current phase.
  - added a working `举报评论` action that routes to the existing report page with `targetType=comment`.
  - kept own/comment-owner delete behavior through the existing ownership helper.
- Continued project-plan/P0 functional execution after the user manually confirmed the current visual baseline:
  - added `getPetDetailActions` so pet detail shows `编辑资料` / `发布动态` for the current user's own pets, and `拉黑` / `发起邀请` for other users' pets.
  - updated own-pet profile publishing so it routes to create-post with `petId`, and create-post selects that owned pet after loading the pet list.
  - added Mock report-target validation so reports for missing or inaccessible users, pets, posts, comments, or invites are rejected before persistence.
  - added duplicate-send protection to post-detail comment submission with a `commenting` state and disabled send control.
  - updated Mock post deletion so deleting a post also hides its comments and resets the post comment count.
  - tightened Mock comment deletion so a deleted comment cannot be deleted again and cannot decrement post comment counts twice.
  - shared Mock pet payload validation between create and edit so edited pets cannot save empty names, over-limit tag lists, or over-limit descriptions.
  - added regression coverage for all of the above.
- Performed a final P0 static handoff scan after the user asked to continue until final delivery organization.
- Closed a remaining dead-affordance gap on invite creation:
  - the right-side more icon now routes to the existing report page for the target pet.
  - invalid target-pet route params show `接收宠物参数无效` instead of doing nothing.
  - architecture regression coverage now locks the invite-creation report route.
- User manually completed the WeChat Developer Tools P0 walkthrough and did not report a blocking defect in the continuation message.
- Prepared the current MVP for version-control integration:
  - added `**/project.private.config.json` to `.gitignore` so WeChat Developer Tools local private config is not committed.
  - staged shared source, tests, docs, local visual assets, lockfile, and WeChat shared project configs.
  - excluded generated build/test artifacts such as `dist`, `.test-dist`, and `node_modules`.
- Rebuilt `frontend/pet-social-mini/dist`.
- Re-verified `npm run typecheck && npm run build:weapp && npm test`; build succeeds without warnings and tests pass 89/89.
- Committed the previously uncommitted backend `store.Store` contract, gormstore persistence, and `PAWMIGO_STORE` runtime selection as one focused commit, and checked in `CLAUDE.md` project guidance.
- Added a black-box `store.Store` contract suite under `internal/store/storetest` exercising P0 rules through the interface only, wired from both memory and gorm `contract_test.go`; raised memory store direct coverage from 0% to 63.2%.
- Found and closed a real parity gap: the Go memory/gorm stores did not enforce four P0 rules the frontend Mock already had. Added to both stores — pet tag count (<=10) and description length (<=500) limits, a per-user daily invite cap (<10/local day, separate from the existing 24h duplicate guard), post content length (<=1000), and report target existence/visibility validation reusing each store's block/visibility rules.
- Un-skipped the four pending-contract cases; the shared suite now asserts all four rules across both stores. Coverage: memory 67.9%, gorm 71.7%, http 74.1%.
- Added unit tests for the `internal/http/response` and `internal/http/middleware` packages (envelope helpers and the auth middleware), taking both from 0% to 100% statement coverage. `cmd/server` is left at 0% on purpose since it is only `main()` wiring and would need a refactor to test.

## In Progress

No product code is currently in progress after this checkpoint.

Remote API / Go P0 backend skeleton integration is complete:

- Merged PR: https://github.com/Keven-2048/-pawmigo/pull/2
- Merge commit: `d3c46f6678c499ce10de4c6ce521260b822b91ed`
- Current branch: `plan1-foundation-auth`

## Next Recommended Step

Next backend step, only with explicit user approval: run a real MySQL DSN integration pass and plan production persistence migration/deployment around the existing `store.Store` contract.

Keep default local server behavior on memory store unless `PAWMIGO_STORE=gorm` is explicitly selected. Alternative next phases still require explicit user selection: production WeChat login, upload/COS, Docker/deployment, admin app, message center, chat, or follow/friend work.

## Known Constraints

- The current approved Go backend work is limited to `backend/api` P0 in-memory skeleton and contract validation.
- Do not implement MySQL/Redis, Docker Compose, React admin app, production WeChat login, upload/COS, message center, chat, or follow/friend features unless the user explicitly changes scope.
- Do not modify `功能需求.md` or `技术文档.md` unless explicitly requested.
- Do not wire pages directly to Mock data; use `services/*`.
- Use Stitch project `projects/5635601718767463341` for visual direction.
- Current visual baseline has been accepted by the user; do not continue visual one-to-one restoration unless new visual feedback is provided.
- Keep `ui-button`/`ui-icon` primitives and NutUI Button overrides unless a page has been visually verified with an equal or better replacement.
- Docker was not installed locally during planning, so do not make it a required verification step.

## Validation Status

Latest verification run:

```sh
cd backend/api
GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/go-path GOMODCACHE=/private/tmp/go-mod-cache go build ./...
GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/go-path GOMODCACHE=/private/tmp/go-mod-cache go vet ./...
GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/go-path GOMODCACHE=/private/tmp/go-mod-cache go test -count=1 ./...
GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/go-path GOMODCACHE=/private/tmp/go-mod-cache go run ./cmd/server
curl -fsS http://localhost:8080/healthz
PAWMIGO_STORE=gorm PAWMIGO_DB_PATH=/tmp/pawmigo_t4.db GOCACHE=/private/tmp/go-build-cache GOPATH=/private/tmp/go-path GOMODCACHE=/private/tmp/go-mod-cache go run ./cmd/server
curl -fsS http://localhost:8080/healthz

cd frontend/pet-social-mini
npm run typecheck && npm run build:weapp && npm test

TARO_APP_API_MODE=remote TARO_APP_API_BASE_URL=http://localhost:8080 npm run build:weapp

cd backend/api
go build -o /tmp/pawmigo-api-smoke ./cmd/server
/tmp/pawmigo-api-smoke
curl -fsS http://localhost:8080/healthz
curl -fsS -X POST http://localhost:8080/api/v1/auth/wechat-login -H 'Content-Type: application/json' -d '{"code":"dev-login-code"}'
```

Results:

- `go build ./...`, `go vet ./...`, and `go test -count=1 ./...` passed for `backend/api` with isolated Go caches.
- Default `go run ./cmd/server` returned `{"code":0,"message":"ok","data":{"status":"ok"}}` from `/healthz` and logged `store mode: memory`.
- `PAWMIGO_STORE=gorm PAWMIGO_DB_PATH=/tmp/pawmigo_t4.db go run ./cmd/server` returned the same `/healthz` response and logged `store mode: gorm`.
- `/tmp/pawmigo_t4.db` was removed after the gorm smoke test.
- `go test ./...` passed for `backend/api`.
- Local backend build/start smoke passed; `/healthz` and `/api/v1/auth/wechat-login` returned standard `{ code: 0, message: "ok" }` responses.
- Port `8080` was checked after smoke and no listener remained.
- `npm run typecheck` passed.
- `npm run build:weapp` passed and generated `frontend/pet-social-mini/dist`.
- Remote-mode `TARO_APP_API_MODE=remote TARO_APP_API_BASE_URL=http://localhost:8080 npm run build:weapp` passed.
- After PR #2 merge into `plan1-foundation-auth`, `go test ./...`, `npm run typecheck && npm run build:weapp && npm test`, and remote-mode `npm run build:weapp` were re-run and passed.
- `npm test` passed with 95 Node test cases covering:
  - no Unsplash image-domain dependencies in static source
  - local Mock image assets exist in the compiled WeChat package
  - pages/stores use the service layer instead of Mock internals
  - exported service methods enforce the current-phase Mock-only API boundary before calling Mock internals
  - protected pages install the shared auth guard, including the first-pet creation page
  - all rendered MVP pages use custom navigation to avoid duplicate WeChat native top bars
  - core MVP screens keep Stitch prototype alignment anchors for theme tokens, login, create-pet, nearby, and pet cards
  - pet profile and invite creation keep Stitch flow alignment anchors
  - create-pet form labels/icons and submit rocket action keep Stitch anchors
  - invite creation type cards keep the prototype five-card order and include shield/send icon anchors
  - create-post identity badge, public globe icon, visibility title icon, and publish send alignment keep Stitch anchors
  - report target image and flag icon keep Stitch anchors
  - privacy footer shield avoids transform-based icon scaling
  - invite list and invite detail keep Stitch transaction alignment anchors
  - feed and post flow keep Stitch social alignment anchors
  - mine, pet management, privacy, and report keep Stitch account/settings alignment anchors
  - secondary Stitch vocabulary keeps prototype copy/icons for privacy, report, create-post, and pet-management count rhythm
  - Mine stats labels and default-pet `ACTIVE` badge match the Stitch account prototype
  - Mine quick actions keep the Stitch `切换主宠` / `宠书管理` structure and do not revert to `记录生活`
  - nearby empty state and filter sheet keep Stitch discovery alignment anchors
  - primary visual surfaces and key secondary pages avoid placeholder icon text/symbols
  - visual-critical actions use local `ui-button` classes instead of fragile NutUI Button rendering
  - remaining NutUI form/detail buttons keep Stitch color overrides
  - Stitch visual tokens are bound to `page` for reliable WeChat Mini Program rendering
  - shared `ui-button` variants keep hard `background-color` fallbacks for WeChat WXSS rendering
  - screenshot-reported primary screens keep hard Stitch colors and softened type
  - screenshot-reported shared cards avoid gray wireframe fallback styling
  - main pages and shared components keep WeChat-safe Stitch hard fallbacks
  - screenshot-reported nearby/mine controls avoid bare wireframe declarations
  - screenshot-reported secondary pages keep Stitch-scale custom-navigation proportions
  - main tab appbars reserve right-side WeChat capsule space before placing search/action icons with `--wechat-capsule-reserve: 280px`
  - secondary form toggles use the shared Stitch-scale custom `settings-switch` instead of native WeChat switches
  - block-list rows keep local photo avatars with a visible CSS block overlay instead of numbered placeholder avatars
  - secondary topbar right controls reserve right-side WeChat capsule space on post detail, invite create, invite detail, and pet detail with the same 280px token
  - screenshot-reported primary surfaces keep prototype-scale typography and icon dimensions
  - primary flow styles do not shrink clickable icon containers below prototype scale
  - Feed publish FAB avoids transform-based icon drift and keeps a 68rpx visible icon box in compiled WXSS
  - Mine profile badge/location icons and active-pet badge keep readable compiled scale
  - invite detail, privacy, report, block-list, and pet-edit secondary text/chip sizes avoid sub-20px visual regressions
  - shared icon primitives preserve centered drawing inside scaled containers with `inline-flex` and a minimum 38px drawing box
  - common login, Mine, invite-card, privacy, report, and block-list icon-only controls remain flex-centered
  - compiled WeChat WXSS keeps Stitch proportions, 280rpx capsule safety, and centered icon offsets in `dist`
  - compiled WeChat WXSS rejects stale compact navigation measurements such as 232rpx capsule padding, 84rpx topbar side columns, and old 64rpx icon touch targets on critical files
  - main tab appbar icons use shared centered 80rpx prototype-scale controls
  - secondary settings topbars keep Stitch-scale 100rpx side columns and 80rpx touch targets
  - secondary settings content avoids undersized controls on privacy/report/block-list pages
  - shared PetCard/InviteCard metadata icons avoid left-biased alignment origins
  - post action rows use dedicated centered icon geometry for heart/comment/share controls
  - secondary detail layouts avoid screenshot-reported crowding, bottom composer stretch, and undersized invite-detail status pills
  - remaining NutUI sticky action buttons render full-width
  - pet edit and block-list secondary pages keep Stitch account/settings anchors
  - secondary MVP pages keep WeChat-safe Stitch color fallbacks and avoid bare variable-only color/background/shadow/border declarations
  - all secondary MVP pages pair Stitch token declarations with same-property hard visual fallbacks before `var(...)`
  - main pages and shared components pair Stitch token declarations with same-property hard visual fallbacks before `var(...)`
  - main visual actions use CSS-drawn icons instead of text glyph placeholders
  - secondary topbar controls use CSS-drawn icons instead of text glyphs
  - regenerated TabBar icon assets match the expected hashes
  - TabBar config references cache-busting `assets/tabbar/nearby-stitch-v2*.png`, `assets/tabbar/feed-stitch-v3*.png`, `assets/tabbar/invite-stitch-v2*.png`, and `assets/tabbar/mine-stitch-v2*.png` paths
  - root, mini-program subproject, and generated dist WeChat project configs point at the correct mini-program output roots
  - generated WeChat JS bundles do not compile Taro runtime APIs through callable default-import wrappers such as `x().getStorageSync(...)`
  - README handoff state reflects the implemented MVP instead of the stale scaffold-next-step text
  - local photo assets are used instead of SVG placeholders
  - source and compiled mock visual asset directories contain no SVG placeholder leftovers
  - local mock photo assets stay below the mini-program warning threshold
  - high-risk page actions keep explicit user-friendly failure feedback
  - key form submit pages guard against duplicate submissions with early-return and disabled-button states
  - invite accept/reject/cancel actions guard against duplicate processing with disabled/loading buttons
  - shared component SCSS stays centralized in the app stylesheet to avoid CSS order warnings
  - CSS minimizer calc optimization stays disabled for NutUI rpx CSS variables
  - route params are parsed through shared utilities and invalid params show explicit states
  - app code imports NutUI components through the local wrapper
  - app imports only the NutUI component styles used by the MVP
  - current-user ownership and invite perspective helpers
  - safe pet-detail action selection for own pets versus other users' pets
  - comment deletion permission rules
  - auth guard destination rules for login, first-pet, and ready states
  - bootstrap data-load failure feedback on key pages
  - pet-management load and action paths keep explicit failure and duplicate-operation protections
  - login keeps full-flow duplicate-submit protection across session and pet bootstrap
  - route ID and report-target parsing helpers
  - invite-creation right-side action routes to the existing report page for the target pet instead of remaining a dead visual control
  - own-pet profile publishing carries the selected `petId` into create-post and selects that owned pet
  - post-detail comment submission duplicate-send protection
  - `followers` post visibility remains part of the current Mock-first create-post UI vocabulary
  - duplicate invite, invite time, daily invite limit, invite action ownership, shared create/edit pet validation, post content, post image count, like idempotency, comment counts, duplicate comment-delete count protection, comment privacy, privacy visibility, blocked invite/comment visibility, block interaction, default pet reassignment, fuzzy nearby distance, report persistence, report target validation, post-delete comment cleanup, and block persistence rules
  - full WeChat JS runtime bundle `process` leakage
- Generated `dist/app-origin.wxss` contains `:root,page` Stitch tokens and hard-value button fallbacks.
- Generated `dist/assets/tabbar/feed-stitch-v3*.png` and `*-stitch-v2.png` assets match the pin/pets/mail/person semantic icon hashes.
- Source `src/assets/tabbar` now contains only the eight current cache-busting TabBar icons and no obsolete non-versioned or `feed-stitch-v2` PNG files.
- Generated `dist/app.json` contains TabBar `backgroundColor: "#f7fbed"`, `selectedColor: "#326b00"`, `color: "#727a68"`, `borderStyle: "black"`, feed `assets/tabbar/feed-stitch-v3*.png` icon paths, and the remaining `*-stitch-v2.png` tab icon paths.
- Every generated `dist/**/index.json` page config contains `navigationStyle: "custom"` for the 16 rendered MVP pages, preventing duplicate native top navigation.
- Generated `dist/app-origin.wxss` includes `--wechat-capsule-reserve: 280rpx`, the shared `.capsule-safe-appbar` pattern, updated larger Mine/Feed/Invite/Pet Management/Nearby scale anchors, centered `ui-icon` geometry including `ui-icon--refresh`, post action icon geometry, post-detail composer grid, pet-detail identity/metric layout fixes, and secondary topbar capsule-safe padding.
- Generated `dist` key WXSS files contain `padding:88rpx 280rpx`, `right:280rpx`, 80rpx appbar controls, and 100rpx secondary topbar side columns where expected.
- A targeted `rg` scan still finds one legitimate `height:64rpx` on the invite-creation location input; this is not a topbar/icon touch target and should not be mechanically replaced.
- Generated `dist/pages/mine/index.wxss` contains the softened `font-weight: 600` default-pet `ACTIVE` badge.
- Direct `rg` scans found no callable-wrapper Taro runtime API calls for storage, login, route, or toast APIs in generated `dist/**/*.js`.
- Root `project.config.json` contains `miniprogramRoot: "frontend/pet-social-mini/dist/"`.
- Generated `dist/pages/mine/index.wxss` and `dist/pages/nearby/index.wxss` contain the latest hard visual fallbacks for mine search/add/dot and nearby search icon.
- Generated critical secondary/detail WXSS for invite detail, pet detail, post detail, and privacy settings now keeps hard color/shadow/border values before Stitch token declarations.
- Generated main/shared WXSS now keeps hard border-color fallbacks before Stitch token declarations for feed tabs, login checkbox, Mine brand/active pet/menu divider, nearby filter chips, and PostCard location icons.
- Generated all secondary-page WXSS now keeps same-property hard visual fallbacks before Stitch token declarations across pet create/edit/manage, post create/detail, invite create/detail, privacy, report, and block-list surfaces.
- Generated `dist/pages/feed/index.wxss` contains a flex-centered 108rpx publish FAB with a 68rpx icon box and no transform scale/translate positioning.
- Generated `dist/pages/mine/index.wxss` contains 44rpx profile badge/location icon boxes and a readable 34rpx / 20rpx active-pet badge.
- Generated `dist/app-origin.wxss` contains the shared `settings-switch` at 82rpx x 44rpx with a 32rpx dot and 44rpx active offset.
- Create-pet, pet-edit, and privacy-settings source pages no longer rely on native WeChat `Switch` controls.
- Generated `dist/subpackages/settings/block/index.wxss` contains a 56rpx blocked-avatar overlay.
- Block-list and privacy source pages no longer contain the previous `#id` placeholder avatar or development-state account-cancellation copy.
- Generated invite detail, privacy, report, block-list, and pet-edit WXSS contains the latest non-tiny secondary label/chip sizes.
- `frontend/pet-social-mini/dist/assets/mock` contains the local JPEG Mock photo assets after rebuild.
- `frontend/pet-social-mini/src/assets/mock` and `frontend/pet-social-mini/dist/assets/mock` contain no SVG placeholder assets after rebuild.
- `pnpm build:weapp` completed without warnings after centralizing shared component styles and disabling CSS minimizer calc optimization.
- Generated `dist/app-origin.wxss` is roughly 28K after removing the full NutUI stylesheet import.

## Open Risks

- The original requirement and technical documents are currently untracked in git.
- The real-device runtime crash was fixed at the generated-bundle pattern level, and the user manually completed the WeChat Developer Tools P0 walkthrough on 2026-06-10 without reporting a new blocker in the continuation message.
- The latest duplicate-navigation, 280px capsule-safe appbar, proportion, icon-centering, Nearby main icons, secondary settings scale, custom settings switches, block-list finished-state rows, pet-management visibility/default row semantics, card metadata icon alignment, post-detail composer, pet-detail layout, invite-detail status scale, and sticky-button fixes are verified in source/build/test outputs and have passed the user's latest manual P0 walkthrough checkpoint.
- Current Mock image assets now use compressed local JPEG pet/owner photography for primary visuals; production should move uploaded pet/post media to the approved upload/COS flow later.
- `backend/api` now routes through the `store.Store` contract: router/middleware use the interface, gormstore is implemented and tested, and `cmd/server` can switch to seeded gorm persistence with `PAWMIGO_STORE=gorm`.
- Production MySQL persistence migration, real WeChat login, upload/COS, and deployment topology still need explicit future-phase approval.
- Superpowers skills are available as local skill files in this session. There is no separate `Skill` tool exposed, so the skill instructions were read from disk and followed with local shell/edit tooling.
- CodeGraph MCP is configured in `AGENTS.md`, but this repository currently has no `.codegraph/` index initialized. Use native search/read until the user approves initializing it.
