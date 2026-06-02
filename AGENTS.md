# AmbilDarahku — Agent Summary

## Goal
Build a blood donor platform in Indonesia that connects donors with recipients, manages donor history, blood requests, events, leaderboards, trust verification, and recognition.

## Constraints & Preferences
- Do NOT auto-build changes after editing.
- Users often don't know their blood rhesus; rhesus must not appear in UI at all.
- Backend must still handle rhesus internally (defaults to `"+"` when inserting) since DB column is NOT NULL.
- Blood donation volume per bag: 0.35 L if weight ≤ 55 kg, 0.45 L if weight > 55 kg.
- Register page layout must not overflow on mobile; buttons must stay on-screen.
- SMTP for emails is configured via env vars; test emails may be silently dropped by SMTP relay.
- File uploads: backend uses an S3-compatible driver; if env vars not set, it falls back to a no-op mock that returns a valid fake URL (no files actually saved).
- No Go toolchain in workspace to verify Go build; changes must be syntactically matched to existing patterns.
- No npm/node in workspace to install packages; QR code relies on external API (`api.qrserver.com`).
- Seed data uses `donor123` as the default password for all dummy accounts.

## Progress
### Done
- Initial project structure setup, CI pipeline, Docker setup.
- User registration + auth (JWT, refresh tokens, email verification, forgot/reset password).
- Blood donor profiles (public profile at `/u/[username]`, edit profile at `/profile`).
- Donor history tracking (add/view/edit donation records, proof uploads).
- Blood requests (list, create, fulfill, share page with QR).
- Events (list, create with form, event cards).
- Leaderboards (national + regional with city filter, podiums, stats cards, progress bars).
- Eligibility engine (status: eligible/waiting_period/not_eligible/needs_clearance).
- Public donor portfolios (`/u/[username]` with badges, stats, donation history).
- Admin and PMI roles (admin dashboard, seed admin user).
- Fixed `DateOfBirth` parsing in registration (accepts RFC3339 + YYYY-MM-DD).
- Removed rhesus from all frontend UI and API inputs; defaults to `"+"` on insert.
- Fixed CI workflow (`go-version` 1.26, explicit `working-directory: frontend`).
- Removed "Saya Sudah Donor" fulfill button from search page; now shows WhatsApp contact only.
- Added `contact_phone` WhatsApp links on blood request cards and share page.
- Redesigned share card as all-in-one screenshot card with QR, compatibility matrix, eligibility check.
- Replaced all hardcoded statCard/badge/feature content on landing page with live API data.
- Added donation progress ring and motivational banner on profile page.
- Fixed profile page data sync: fetches fresh stats from `/auth/me` instead of stale context.
- Created NGO-themed event card component with countdown, progress bar, gradient accents.
- Created event management pages: list (`/events`), create form (`/events/new`).
- Fixed `GetPublicURL` returning literal `"TODO"` → implemented S3 driver with mock fallback.
- Wired badge awarding into `RefreshDonationStats` so badges auto-award on donation count thresholds.
- Audited + rewrote all seed data: 22 → 1,500+ donors, 18 → 60 requests, 9 → 29 events.
- Made donor cards clickable on search page (links to `/u/[username]`).
- Fixed SMTP env var mismatch: `SMTP_SENDER` → `SMTP_FROM` in config loader.
- Fixed npm audit warnings (all dev-only, dismissed).
- Fixed email verification migration default: `DEFAULT true` → `DEFAULT false`.
- Designed full Donor Passport, Verification Framework, Historical Claims, Unified Timeline, Award Engine, Recognition Submission Package, PMI Review Portal, Trust Dashboard, and Donation Verification Portfolio page.
- Provided phased implementation plan (Phase 1–4) with schema, API, UI, security, and audit trail requirements.
- **Phase 1 implemented**: National Donor Passport + Historical Donation Claims:
  - `national_donor_id` and `donation_volume_total` columns on `users` table
  - `donor_passports` table (passport number, QR token, activation, renewal)
  - `donation_claims` table (pending/approved/rejected workflow, evidence, admin review)
  - `donor_histories` extended with `claim_id`, `verification_level`, `verification_source`
  - PMI review middleware (`pmi_admin` + `super_admin` access)
  - Passport API: request, view own, view by username, verify by QR token, renew
  - Claims API: create, list, update (while pending), cancel, admin review/approve/reject
  - Frontend: `/passport` page with QR code, print, stats, badges, renew
  - Frontend: `/passport/verify/[token]` public verification page (SSR)
  - Frontend: `/claims` list + `/claims/new` submission form
  - Frontend: Profile page passport link, bottom-nav passport & claims links
  - Frontend: Public profile now includes `national_donor_id` and `donation_volume_total`
- **Phase 1b implemented**: Verification Framework + Unified Timeline:
  - `verification_level INT` column on `users` table (0/1/2/3)
  - `DonorVerificationRepository` extended with `FindByID`, `FindLatestByUserID`, `FindPendingAll`, `GetTimeline`, `GetPublicTimeline`
  - `UserRepository` extended with `UpdateVerificationLevel`
  - Verification API: get status, submit request (level + verifier_role), admin review (approve/reject auto-updates user level)
  - Timeline API: `GET /timeline` (own), `GET /timeline/:username` (public) — UNION across donor_histories, donation_claims, user_badges
  - Frontend: `/verification` page with level progress, submit form, history
  - Frontend: `/timeline` page with filterable visual feed (donations/claims/badges)
  - Public profile `/u/[username]` shows verification level badge
  - Profile page shows verification level card with link to `/verification`
  - Donor-history page shows `verification_level` tag per record
  - Bottom-nav adds Verif (Shield) and Linimasa (Timeline) links
  - Admin review endpoint: `PUT /admin/verifications/:id/review`
- **Phase 2 implemented**: Award Engine + Recognition:
  - `award_configs` table (name, type, JSON criteria, scope, active)
  - `user_titles` table (title, source, config_id, description)
  - `AwardConfigRepository` with full CRUD + scope-based lookup
  - `UserTitleRepository` with create, find by user, list all, delete
  - Recognition handler: portfolio (own + public), award config CRUD (admin), title awarding (admin)
  - Frontend: `/recognition` page with printable portfolio (gradient header, stats, titles, badges, QR)
  - Frontend: `/admin/awards` page for managing award configurations
  - Profile page: recognition link, bottom-nav: Rekognisi link
  - API includes 7 admin routes for award configs and title management
- **Trust Score Engine**: 5-component weighted score (donation count 30%, verification level 30%, claim accuracy 20%, profile completeness 10%, account age 10%) with public and own endpoints, refresh endpoint
- **Analytics Dashboard** (admin): 6 endpoints (institutions, cities, years, months, age distribution, top donors)
- **Admin Dashboard**: stats overview, user management with role changer, claim review, verification review
- **Documentation rewrite**: comprehensive README.md, DESIGN.md (Vitality Flow design system), PRD.md, AGENTS.md
- Seed data now runs as background goroutine controlled by `SEED_DUMMY_DATA` env flag

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Rhesus removed from all frontend UI and API inputs; backend inserts `"+"` by default, preserving DB schema.
- Date-of-birth parsing accepts both RFC3339 (ISO) and `YYYY-MM-DD` formats.
- CI uses explicit `working-directory: frontend` per step (not `defaults.run`) to avoid setup-node cache conflicts.
- Blood compatibility on share page: simplified matrix without rhesus (O→O, A→O/A, B→O/B, AB→all).
- Donation volume: ≤55kg → 0.35L/bag, >55kg → 0.45L/bag, displayed with `toFixed(2)`.
- QR code uses external API (`api.qrserver.com`) since no QR library is installed in frontend.
- File upload: S3-compatible driver with mock fallback returning fake URL (no actual file persistence).
- Sort order for blood requests on landing page: urgency then newest-first (critical/urgent/normal first, then by created_at desc).
- Seed data uses `donor123` password for all dummy accounts to simplify manual testing.
- Badges auto-award on donation count thresholds in `RefreshDonationStats` (called after any donation history change).
- Passport QR token is a 64-char hex string embedded in URL path (not JWT) so verification is stateless and publicly cacheable.
- Claims use a simple pending→approved/rejected workflow; approved claims do NOT auto-create donor_history records (manual reconciliation prevents duplicates).
- Trust score computed from 5 weighted components: donation count (30%), verification level (30%), claim accuracy (20%), profile completeness (10%), account age (10%).
- Lat/lng removed from registration to simplify signup; users can set location later via profile.
- Seed dummy data runs as background goroutine so server startup is not blocked.
- Frontend proxies `/api/v1/*` to backend via Next.js rewrites (not direct API calls in production).
- Design system: "Vitality Flow" — glassmorphism, dual-font (Geist + Inter), Material Design 3-inspired color tokens.
- Styling: Tailwind CSS v4 with shadcn/ui "base-nova" style (new shadcn variant in v4).

## Next Steps
- Add automated tests (zero tests exist — highest risk gap)
- Restrict CORS in production from `*` to specific origins
- Implement rate limiting globally (only forgot-password currently rate-limited)
- Add proper audit logging for admin/claims/verification actions
- Add pagination for donor search, leaderboard, history, claims, timeline
- Fix `FileService.GetPublicURL` which returns literal `"TODO: generate presigned URL or use public bucket URL"`
- Restrict seed dummy to local/dev environments only (currently gated by env var but no env check)
- Integrate Redis (config exists but not wired into any service)
- Add WebSocket or polling for real-time blood request notifications
- Add mobile push notifications via Firebase Cloud Messaging
- Implement Phase 3: PMI Integration (official account, blood stock, low stock alerts, validation, WhatsApp campaigns)
- Implement Phase 3: Hospital Integration (account, request management, smart matching, broadcast, response tracking)
- Implement Phase 4: Trust Dashboard, Donation Verification Portfolio, Community Management
- Add i18n support for English-language fallback

## Critical Context
- DB schema unchanged: `rhesus VARCHAR(5) NOT NULL CHECK (rhesus IN ('+', '-'))` still exists; all inserts use `"+"`.
- No Go toolchain in workspace to verify Go build; changes must be matched to existing code patterns.
- No npm/node in workspace to install packages; QR code relies on external API.
- `package-lock.json` exists in `frontend/` with `lockfileVersion: 3`.
- SMTP env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (not `SMTP_SENDER`).
- File upload mock returns URL `https://storage.ambildarahku.id/uploads/<uuid>.jpg` regardless of actual file.
- Badges auto-award on any update to `total_donations` via `RefreshDonationStats`.
- No automated tests exist across entire project.
- Seed data runs as background goroutine — may cause race conditions on first startup.
- Frontend uses Next.js 16.2.6 + React 19.2.4 — cutting edge with potential breaking changes.
- No middleware.ts exists in frontend (all auth handled client-side via context + API interceptor).
- Backend Go module: `github.com/icarrr/ambildarahku-backend` (Go 1.26).
- 5 Docker Compose services: postgres 16, redis 7, minio, backend (Go), frontend (Next.js).
- Backend auto-migrates on startup via `database.RunMigrations`.
- 14 DB tables: users, donor_histories, donor_verifications, blood_requests, request_fulfillments, badges, user_badges, refresh_tokens, events, verification_tokens, donor_passports, donation_claims, award_configs, user_titles.
- 50+ API routes across 7 access tiers: public, auth, email-verified, admin-only, PMI/admin, donor-only, any-user.

## Relevant Files

### Backend — Core
- `backend/cmd/server/main.go`: Entry point — config load, DB connect, migrate, seed, start server
- `backend/internal/config/config.go`: Config loader (env vars, SMTP_FROM fallback)
- `backend/internal/database/migrations.go`: Full schema (14 tables + indexes)
- `backend/internal/routes/router.go`: All 50+ API routes with middleware wiring
- `backend/go.mod`: Module `github.com/icarrr/ambildarahku-backend`, Go 1.26, gin/sqlx/jwt/minio deps

### Backend — Models
- `backend/internal/models/user.go`: User struct (all 30+ fields)
- `backend/internal/models/donor_history.go`: DonorHistory struct
- `backend/internal/models/blood_request.go`: BloodRequest + RequestFulfillment
- `backend/internal/models/donor_passport.go`: DonorPassport struct
- `backend/internal/models/donation_claim.go`: DonationClaim struct
- `backend/internal/models/donor_verification.go`: DonorVerification struct
- `backend/internal/models/award_config.go`: AwardConfig + UserTitle
- `backend/internal/models/badge.go`: Badge + UserBadge
- `backend/internal/models/event.go`: Event struct
- `backend/internal/models/refresh_token.go`: RefreshToken
- `backend/internal/models/verification_token.go`: VerificationToken

### Backend — Handlers (16 files)
- `backend/internal/handlers/auth_handler.go`: Register, Login, RefreshToken, Logout, VerifyEmail, ResendVerification, ForgotPassword, ResetPassword, ChangePassword
- `backend/internal/handlers/user_handler.go`: GetProfile, UpdateProfile, ListAll, UpdateUserRole, GetPublicProfile
- `backend/internal/handlers/donor_history_handler.go`: List, Create, Update donor history
- `backend/internal/handlers/blood_request_handler.go`: GetByID, Create, ListOpen, MyRequests, UpdateStatus, Fulfill, ListFulfillments
- `backend/internal/handlers/search_handler.go`: Search (haversine, compatibility, radius)
- `backend/internal/handlers/leaderboard_handler.go`: National, Regional
- `backend/internal/handlers/donor_status_handler.go`: GetStatus, UpdateStatus (eligibility)
- `backend/internal/handlers/event_handler.go`: List, Create events
- `backend/internal/handlers/passport_handler.go`: GetMyPassport, GetPassportByUsername, VerifyByQR, RequestPassport, RenewPassport
- `backend/internal/handlers/claim_handler.go`: ListMyClaims, GetClaim, CreateClaim, UpdateClaim, CancelClaim, ReviewClaim, ListPendingClaims
- `backend/internal/handlers/verification_handler.go`: GetMyVerification, SubmitVerification, ReviewVerification, ListPendingVerifications
- `backend/internal/handlers/timeline_handler.go`: GetMyTimeline, GetPublicTimeline
- `backend/internal/handlers/recognition_handler.go`: GetPortfolio, GetPublicPortfolio, ListAwardConfigs, CreateAwardConfig, UpdateAwardConfig, DeleteAwardConfig, AwardTitle, ListAllTitles
- `backend/internal/handlers/admin_handler.go`: GetStats, ListPendingClaims, GetClaimDetail, ListPendingVerifications
- `backend/internal/handlers/trust_handler.go`: GetOwnTrustScore, GetPublicTrustScore, RefreshTrustScore
- `backend/internal/handlers/analytics_handler.go`: GetDonationsByInstitution/City/Year/Month, GetAgeDistribution, GetTopDonors

### Backend — Repositories (13 files)
- `backend/internal/repositories/user_repository.go`: CRUD, Search, RefreshDonationStats, SetNationalDonorID, UpdateTrustScore, UpdateVerificationLevel
- `backend/internal/repositories/donor_history_repository.go`: CRUD, FindByUserIDAndDate, UpdatePhoto, UpdateVerification
- `backend/internal/repositories/blood_request_repository.go`: CRUD, FindOpen (filtered), AddFulfillment (transactional)
- `backend/internal/repositories/fulfillment_repository.go`: Create, FindByRequestID (with donor join)
- `backend/internal/repositories/badge_repository.go`: FindAll, FindByUserID (nested), AwardBadge, SeedDefaults
- `backend/internal/repositories/refresh_token_repository.go`: Create, FindByToken, DeleteByUserID, DeleteByToken
- `backend/internal/repositories/verification_token_repository.go`: Create, FindByToken, MarkUsed, DeleteByUserID
- `backend/internal/repositories/donor_passport_repository.go`: Create, FindByUserID, FindByQRToken, FindByPassportNumber, Update
- `backend/internal/repositories/donation_claim_repository.go`: CRUD, FindPendingWithUser, FindAllByStatus, UpdateStatus
- `backend/internal/repositories/donor_verification_repository.go`: CRUD, FindLatestByUserID, FindPendingAll, FindPendingWithUser, GetTimeline, GetPublicTimeline
- `backend/internal/repositories/event_repository.go`: FindUpcoming, Create
- `backend/internal/repositories/award_config_repository.go`: CRUD, FindActiveByScope
- `backend/internal/repositories/user_title_repository.go`: Create, FindByUserID, FindAll, Delete

### Backend — Services (6 files)
- `backend/internal/services/auth_service.go`: Register (rhesus default), Login (access+refresh tokens), email verification flow, password change, forgot/reset password
- `backend/internal/services/donor_status_service.go`: EvaluateEligibility (eligibility engine wrapper), UpdateStatus, GetSearchPriority
- `backend/internal/services/email_service.go`: SMTP send with HTML templates (verification, password reset)
- `backend/internal/services/file_service.go`: S3 upload + no-op mock fallback
- `backend/internal/services/trust_service.go`: 5-component trust score calculation
- `backend/internal/services/whatsapp_service.go`: WhatsApp link generation, donor/requester notification messages

### Backend — Middleware
- `backend/internal/middleware/auth.go`: AuthRequired (JWT parse), AdminRequired (super_admin), PMIOrAdminRequired (super_admin/pmi_admin), EmailVerifiedRequired (block unverified)
- `backend/internal/middleware/cors.go`: CORS (all origins — TODO: restrict in production)

### Backend — Packages
- `backend/pkg/eligibility/rule.go`: Engine + Rule interface (Age/Weight/Interval rules)
- `backend/pkg/eligibility/age_rule.go`: 17-60 first-time, 65 repeat, 60+ needs clearance
- `backend/pkg/eligibility/weight_rule.go`: Minimum 45 kg
- `backend/pkg/eligibility/interval_rule.go`: 56-day minimum interval
- `backend/pkg/blood/compatibility.go`: Full 8-type compatibility matrix (canReceiveFrom, canDonateTo)
- `backend/pkg/utils/jwt.go`: JWT access token (HS256) + refresh token (random hex)
- `backend/pkg/utils/password.go`: Bcrypt hash + verify

### Backend — Seed
- `backend/internal/seed/admin.go`: Super admin creation from env vars
- `backend/internal/seed/dummy.go`: 1,500+ donors, 60 requests, 29 events (goroutine)

### Frontend — Pages (26 routes)
- `frontend/src/app/page.tsx`: Landing page (SSR) — live stats, hero, CTA
- `frontend/src/app/layout.tsx`: Root layout — fonts, AuthProvider, BottomNav, DesktopSidebar, Toaster
- `frontend/src/app/globals.css`: Tailwind v4 + shadcn/ui base-nova + glassmorphism utilities
- `frontend/src/app/login/page.tsx`: Login form (email + password)
- `frontend/src/app/register/page.tsx`: 3-step registration wizard
- `frontend/src/app/search/page.tsx`: Donor search with filters (blood type, city, radius, geolocation)
- `frontend/src/app/profile/page.tsx`: Profile with stats, badges, edit form, password change, verification, trust score, urgent requests
- `frontend/src/app/donor-history/page.tsx`: Donation history CRUD with photo upload
- `frontend/src/app/requests/page.tsx`: Blood request listing with progress, WhatsApp
- `frontend/src/app/requests/new/page.tsx`: Emergency blood request form
- `frontend/src/app/requests/share/[id]/page.tsx`: Share card — QR, compatibility, fulfill, donor list
- `frontend/src/app/events/page.tsx`: Event listing
- `frontend/src/app/events/new/page.tsx`: Event creation (admin)
- `frontend/src/app/leaderboard/page.tsx`: National/regional tabs, city filter, podium, progress bars
- `frontend/src/app/passport/page.tsx`: Donor passport — QR, stats, badges, print, renew
- `frontend/src/app/passport/verify/[token]/page.tsx`: Public QR verification (SSR)
- `frontend/src/app/claims/page.tsx`: Donation claims list
- `frontend/src/app/claims/new/page.tsx`: Claim submission form
- `frontend/src/app/recognition/page.tsx`: Printable portfolio — gradient header, stats, titles, badges, QR
- `frontend/src/app/verification/page.tsx`: Verification level progress, submit, history
- `frontend/src/app/timeline/page.tsx`: Filterable visual feed (donations/claims/badges)
- `frontend/src/app/u/[username]/page.tsx`: Public profile (SSR) — national_donor_id, trust score, badges
- `frontend/src/app/admin/page.tsx`: Admin dashboard — stats, user management, role changer
- `frontend/src/app/admin/analytics/page.tsx`: Analytics charts (institutions, cities, months, age, top donors)
- `frontend/src/app/admin/verifications/page.tsx`: Pending verification review
- `frontend/src/app/admin/claims/page.tsx`: Pending claim review (approve/reject)
- `frontend/src/app/admin/awards/page.tsx`: Award config CRUD
- `frontend/src/app/verify-email/page.tsx`: Email verification handler
- `frontend/src/app/forgot-password/page.tsx`: Password reset request
- `frontend/src/app/reset-password/page.tsx`: Password reset with token
- `frontend/src/app/privacy/page.tsx`: Privacy policy (static SSR)
- `frontend/src/app/terms/page.tsx`: Terms of service (static SSR)
- `frontend/src/app/robots.txt/route.ts`: Dynamic robots.txt
- `frontend/src/app/sitemap.xml/route.ts`: Dynamic sitemap

### Frontend — Components (23 files)
- `frontend/src/components/bottom-nav.tsx`: Mobile bottom nav — primary (3) + secondary (9) links + FAB
- `frontend/src/components/navbar.tsx`: Top nav with desktop links + mobile hamburger
- `frontend/src/components/desktop-sidebar.tsx`: Fixed left sidebar (w-64, md:flex)
- `frontend/src/components/glass-card.tsx`: Reusable glassmorphism card
- `frontend/src/components/donor-card.tsx`: Search result card (avatar, blood type, status, city, WhatsApp)
- `frontend/src/components/stat-card.tsx`: Icon + value + label stat display
- `frontend/src/components/status-badge.tsx`: Color-coded status (available, eligible, pending, etc.)
- `frontend/src/components/blood-type-badge.tsx`: Color-coded blood type (A/B/AB/O + +/- colors)
- `frontend/src/components/urgency-badge.tsx`: Urgency level (critical/urgent/normal)
- `frontend/src/components/avatar-with-badge.tsx`: Gradient circle avatar with rank badge overlay
- `frontend/src/components/rank-badge.tsx`: Rank number (1=gold, 2=silver, 3=bronze)
- `frontend/src/components/section-title.tsx`: Title + optional action link
- `frontend/src/components/timeline.tsx`: Vertical timeline (completed/current/upcoming)
- `frontend/src/components/event-card.tsx`: NGO-themed event card with countdown, progress bar, gradient
- `frontend/src/components/ui/button.tsx`: Base UI button (variants: default, outline, secondary, ghost, destructive, link)
- `frontend/src/components/ui/input.tsx`: Base UI input
- `frontend/src/components/ui/select.tsx`: Base UI select (full dropdown with groups)
- `frontend/src/components/ui/card.tsx`: Card with header/title/content/footer (sizes: default, sm)
- `frontend/src/components/ui/badge.tsx`: Base UI badge variants
- `frontend/src/components/ui/alert.tsx`: Alert with title/description/action (default, destructive)
- `frontend/src/components/ui/label.tsx`: Label with disabled/peer styling
- `frontend/src/components/ui/skeleton.tsx`: Skeleton + SkeletonCard + SkeletonTable
- `frontend/src/components/ui/sonner.tsx`: Toaster wrapper with theme support

### Frontend — Lib
- `frontend/src/lib/api.ts`: API client — fetch wrapper with auto-refresh, 401→redirect, 403→verify-email
- `frontend/src/lib/auth-context.tsx`: Auth context — login, register, logout, refreshUser, isAdmin, isUnverified
- `frontend/src/lib/utils.ts`: cn(), formatDate() (id-ID), getRecoveryEndDate() (+56 days)
- `frontend/src/lib/blood-compatibility.ts`: Full 8-type compatibility matrices

### Frontend — Config
- `frontend/package.json`: Next.js 16.2.6, React 19.2.4, lucide-react, shadcn, sonner, tailwindcss v4
- `frontend/next.config.ts`: Standalone output, API rewrites to backend
- `frontend/tsconfig.json`: ES2017, bundler module resolution, @/ path alias
- `frontend/postcss.config.mjs`: @tailwindcss/postcss
- `frontend/components.json`: shadcn/ui base-nova config
- `frontend/.env.local`: NEXT_PUBLIC_API_URL=/api/v1, DOMAIN

### Infrastructure
- `docker-compose.yml`: 5 services (postgres 16, redis 7, minio, backend, frontend) with healthchecks, volumes, env_file
- `backend/Dockerfile`: Multi-stage (golang:latest → alpine:3.19), static binary
- `frontend/Dockerfile`: Multi-stage (node:20-alpine), standalone output
- `.env.example`: All env vars with defaults and documentation
- `.github/workflows/ci.yml`: Go 1.26 (tidy+vet+build) + Node 22 (ci+build), postgres service

### Documentation
- `README.md`: Full project overview, quick start, features, API docs, architecture
- `DESIGN.md`: Vitality Flow design system — colors, typography, spacing, components, principles
- `PRD.md`: Product requirements — vision, problem statement, user roles, phased roadmap, success metrics
