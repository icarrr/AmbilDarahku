# AI Memory Layer — AmbilDarahku

> Generated: 2026-06-02
> Version: 3.0

---

## 1. CORE SUMMARY

**AmbilDarahku** — Indonesian community blood donor platform. Monorepo: Go/Gin backend + Next.js 16 frontend. JWT auth with refresh rotation, glassmorphism UI ("Vitality Flow"), PostgreSQL 16, Docker Compose (5 services).

**Flow:** Donors register (blood type, location) → Requesters post blood requests by type/urgency/hospital → Donors search by location/blood type/compatibility → Requesters share cards via WhatsApp with QR → Fulfillments create auto-verified donor history → Stats/badges auto-updated.

**Architecture:** Backend layered (handler→service→repository). 16 handlers, 6 services, 13 repositories. Frontend: 30 page.tsx in 27 routes, 22 components, single root layout with sidebar/nav/bottom-nav.

**Phases implemented:**
- Core auth, donor search, requests, history, badges, leaderboard, events
- Phase 1: Donor Passport + Historical Claims
- Phase 1b: Verification Framework + Unified Timeline
- Phase 2: Award Engine + Recognition Portfolio
- Phase 3: PMI Review Portal
- Phase 4: Trust Dashboard + Analytics

All seed accounts use password: `donor123`. No tests.

---

## 2. DOMAIN BREAKDOWN

### auth
- Register (12 fields, no rhesus/lat/lng) → sends verification email (SMTP optional, no-op when `SMTP_HOST` empty)
- Login → JWT pair (15m access + 7d refresh with rotation)
- Email verification via `verification_tokens` table; VerifyEmail returns new JWT
- Forgot/reset password via token; change-password requires current password; 1-min rate limit on forgot
- Middleware chain: `AuthRequired` (JWT) → `EmailVerifiedRequired` → `AdminRequired`/`PMIOrAdminRequired`
- Unverified users restricted: only GET/PUT `/auth/me`, logout, resend-verification, change-password
- Frontend blocks unverified on: /search, /requests, /requests/new, /requests/share/[id]
- `refreshUser()` called after verify-email to update AuthContext with `email_verified: true`

### donor
- **Profile** — blood_type, rhesus (hidden in UI, "+" default), date_of_birth, gender, weight, height, location (prov/city/district), avatar, username
- **Eligibility engine** (`pkg/eligibility/`) — modular `Rule` interface: `AgeRule` (17-60 first, 65 repeat), `WeightRule` (≥45kg), `DonationIntervalRule` (56 days). Statuses: `eligible | not_eligible | waiting_period | needs_clearance`
- **Availability** — automatic mode syncs with eligibility; manual mode allows override with reason + ready_again_date
- **Donor history** — chronological log with proof photo upload; verification; duplicate-day guard (409)
- **Badges** — 6 tiers (Pemula=1, Penolong=5, Pahlawan=10, Guardian=25, Legend=50, Champion=100). Auto-awarded on `RefreshDonationStats`
- **Search priority** — P1=eligible+available, P2=ready≤3d, P3=ready≤7d, P4=other
- **Donor search** — auth-gated (JWT), filter by blood_type, city, radius (haversine), `compatible_with`, availability

### request
- Blood requests: patient_name, hospital, blood_type (rhesus hardcoded "+"), urgency (critical/urgent/normal), city, contact_phone
- **Fulfillment** — `request_fulfillments` table; atomic increment of fulfilled_bags with row lock
- **Share card** — public page with QR (api.qrserver.com), compatibility matrix, progress bar, WhatsApp deep link
- "Saya Sudah Donor" button with compatibility guard + tooltip

### blood compatibility (`pkg/blood/` + `lib/blood-compatibility.ts`)
- Full ABO+Rh rules: O- universal donor, AB+ universal recipient
- Frontend mirrors with `compatibleDonorsFor()`, `canDonateTo()`
- Rhesus + encoding fix for search URLs

### passport (Phase 1)
- National Donor Passport: passport number (ADK-YYYY-NNNNNN), QR token (64-char hex), renew, print
- Public QR verification page (SSR)
- Non-JWT token (stateless, publicly cacheable)

### claims (Phase 1)
- Historical Donation Claims: pending→approved/rejected workflow
- Approved claims call RefreshDonationStats (no auto-create donor_history — prevents duplicates)

### verification (Phase 1b)
- Levels: 0 (none) → 1 (self) → 2 (community) → 3 (PMI)
- Approval auto-updates user's verification_level
- One pending request per level

### timeline (Phase 1b)
- UNION: donor_histories + donation_claims + user_badges, paginated (limit/offset)
- Public timeline excludes claims (only donations + badges)

### recognition (Phase 2)
- Printable portfolio with gradient header, stats, titles, badges, QR code
- Admin CRUD for award configs (title/badge/certificate, JSON criteria, scope)
- Manual title awarding

### admin / pmi (Phase 3-4)
- Dashboard: stats (pending claims/verifications, users, donors, donations)
- Claims review queue (approve/reject with reason)
- Verifications review queue (approve/reject with notes)
- Analytics: institutions, cities, years, months, age distribution, top donors
- Award config CRUD, title management

### trust score (Phase 4)
- 5 components: donation count 30%, verification level 30%, claim accuracy 20%, profile complete 10%, account age 10%
- Calculated on-the-fly, stored to users.trust_score
- Public endpoint returns score only

### event
- Blood drive events: title, date/time, location, city, quota, status
- NGO-themed cards with countdown, progress bar, gradient accents
- Admin creates; public lists upcoming

### leaderboard
- National (top 100) and regional (top 50 by city) with gold/silver/bronze podium
- Current user highlighted in red

---

## 3. API MAP

All under `/api/v1`. [P]=public, [A]=auth, [V]=verified(email), [AD]=admin(super_admin), [PMI]=super_admin|pmi_admin.

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/stats` | Dashboard stats |
| POST | `/auth/register` | Register (12 fields, no rhesus/lat/lng) |
| POST | `/auth/login` | Login → JWT pair |
| POST | `/auth/refresh` | Token refresh + rotation |
| POST | `/auth/verify-email` | Verify email → new JWT |
| POST | `/auth/forgot-password` | Send reset token (1-min rate limit) |
| POST | `/auth/reset-password` | Reset password via token |
| GET | `/u/:username` | Public profile (national_donor_id, donation_volume, verification_level, trust_score, badges) |
| GET | `/requests` | Open requests (filters: blood_type, urgency, limit) |
| GET | `/requests/:id` | Request by ID |
| GET | `/requests/:id/fulfillments` | List fulfillments |
| GET | `/leaderboard/national` | Top 100 |
| GET | `/leaderboard/regional` | Top 50 by city |
| GET | `/events` | Upcoming events |
| GET | `/passport/verify/:token` | Public QR verification |
| GET | `/passport/:username` | Passport by username |
| GET | `/timeline/:username` | Public timeline |
| GET | `/recognition/:username` | Public recognition portfolio |
| GET | `/trust-score/:username` | Public trust score |

### Auth (JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/donors` | Search donors (blood_type, city, radius, compatible_with) |
| GET | `/auth/me` | Profile + badges |
| PUT | `/auth/me` | Update profile |
| POST | `/auth/logout` | Invalidate all refresh tokens |
| POST | `/auth/resend-verification` | Resend verification email |
| PUT | `/auth/change-password` | Change password |

### Verified Email (JWT + email_verified)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/donor-history` | List/add donation records |
| PUT | `/donor-history/:id` | Upload proof photo |
| POST | `/requests` | Create blood request |
| GET | `/requests/mine` | My requests |
| PUT | `/requests/:id/status` | Update status |
| POST | `/requests/:id/fulfill` | Fulfill request |
| GET/PUT | `/donor-status` | Eligibility + availability |
| GET/POST | `/donor-verification` | Verification levels |
| GET | `/passport` | My passport |
| POST | `/passport/request` | Request passport |
| POST | `/passport/renew` | Renew passport |
| GET/POST/PUT/DEL | `/claims`, `/claims/:id` | Donation claims CRUD |
| GET | `/timeline` | My timeline |
| GET | `/recognition` | My recognition portfolio |
| GET/POST | `/trust-score`, `/trust-score/refresh` | Trust score |

### Admin (super_admin)
| Method | Path | Description |
|--------|------|-------------|
| GET/PUT | `/admin/users`, `/admin/users/:id/role` | User management |
| POST | `/events` | Create event |
| GET/POST/PUT/DEL | `/admin/awards`, `/admin/awards/:id` | Award config CRUD |
| POST/GET | `/admin/titles`, `/admin/titles` | Title management |

### PMI Review (super_admin|pmi_admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| GET | `/admin/claims` | Pending claims list |
| GET | `/admin/claims/:id` | Claim detail |
| PUT | `/admin/claims/:id/review` | Approve/reject claim |
| GET | `/admin/verifications` | Pending verifications |
| PUT | `/admin/verifications/:id/review` | Approve/reject verification |
| GET | `/admin/analytics/*` (6) | Analytics endpoints |

---

## 4. DATA MAP

### Tables (14)
`users`, `donor_histories`, `donor_verifications`, `blood_requests`, `request_fulfillments`, `badges`, `user_badges`, `refresh_tokens`, `verification_tokens`, `events`, `donor_passports`, `donation_claims`, `award_configs`, `user_titles`

### Key Notes
- Migrations: auto-run idempotent DDL on startup (CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS)
- No soft deletes, no audit logging, no migration versioning
- `rhesus` column NOT NULL; all inserts use `"+"` (never shown in UI)
- `latitude`/`longitude` DEFAULT 0

---

## 5. UI MAP

### Pages (30 page.tsx in 27 routes)
| Route | Auth | Description |
|---|---|---|
| `/` | No | Landing page with live API stats |
| `/login` | No | Login form |
| `/register` | No | 3-step form (profile→blood→domicile) |
| `/forgot-password` | No | Email → success + WhatsApp contact (Suspense) |
| `/reset-password` | No | Token from URL → new password (Suspense) |
| `/verify-email` | No | Token → auto-store JWT + refreshUser (Suspense) |
| `/profile` | JWT | Dashboard: stats ring, verification card, trust score, timeline, edit form, change password, availability toggle |
| `/search` | JWT | Donor search: filters, geolocation, clickable cards |
| `/requests` | JWT | Blood request listing |
| `/requests/new` | V | Create request form with blood type hint |
| `/requests/share/[id]` | V | Share card with QR, compatibility, fulfill flow |
| `/donor-history` | V | Donation log: list, add, proof upload |
| `/leaderboard` | No | National/regional with animated podium |
| `/events` | No | Upcoming events list |
| `/events/new` | AD | Create event form |
| `/passport` | V | Passport card with QR, print, renew |
| `/passport/verify/[token]` | No | Public QR verification (SSR) |
| `/claims` | V | Donation claims list |
| `/claims/new` | V | Claim submission form |
| `/verification` | V | Verification level progress + submit form |
| `/timeline` | V | Filterable activity feed |
| `/recognition` | V | Printable portfolio with QR |
| `/admin` | AD | Dashboard + user management |
| `/admin/analytics` | PMI | Analytics with bar charts |
| `/admin/verifications` | PMI | Verification review queue |
| `/admin/claims` | PMI | Claim review queue |
| `/admin/awards` | AD | Award config CRUD |
| `/u/[username]` | No | Public portfolio (SSR) |
| `/privacy` | No | Privacy policy (SSR) |
| `/terms` | No | Terms of service (SSR) |

### Components (22)
- **Nav**: `navbar.tsx`, `bottom-nav.tsx`, `desktop-sidebar.tsx`
- **Display**: `glass-card.tsx`, `donor-card.tsx`, `stat-card.tsx`, `timeline.tsx`, `section-title.tsx`
- **Badges**: `blood-type-badge.tsx`, `status-badge.tsx`, `urgency-badge.tsx`, `rank-badge.tsx`, `avatar-with-badge.tsx`
- **UI** (base-ui/shadcn): button, input, label, select, card, badge, skeleton, sonner, alert

### Key Patterns
- `params` is `Promise<T>` — unwrapped with `use()` (Next.js 16)
- `useSearchParams()` requires `<Suspense>` boundary
- Auth via `useAuth()` context: user, loading, isAdmin, isUnverified, login, register, logout, refreshUser
- API client auto-attaches JWT, handles 401→refresh→retry, 403→redirect verify-email

---

## 6. INFRA MAP

### Docker Compose (5 services)
postgres:16-alpine (:5432), redis:7-alpine (:6379), minio/minio (:9000/9001), backend (Go→alpine, :8080), frontend (Node 20→standalone, :3000)

### Build
- Backend: multi-stage (golang→alpine 3.19, CGO_ENABLED=0)
- Frontend: multi-stage (node:20-alpine, npm ci → npm run build, standalone output)

### Config
- Required: `DB_*`, `JWT_SECRET`, `APP_URL`, `SERVER_PORT`
- Optional SMTP: `SMTP_HOST`/`PORT`/`USER`/`PASS`/`FROM` (fallback `SMTP_SENDER`)
- Optional storage: `S3_ENDPOINT`/`BUCKET`/`KEY`/`SECRET` (empty = mock)
- Frontend: `NEXT_PUBLIC_API_URL=/api/v1` (proxied via rewrites), `BACKEND_URL=http://backend:8080`

### Known Issues
- Redis container running but zero usage in code
- No production deployment config (no k8s, terraform, monitoring)
- No HTTPS termination
- File upload mock only (no real storage unless S3 env vars set)

---

## 7. CHANGE DIGEST (post-v2.0)

| # | Date | Change | Key Files |
|---|---|---|---|
| 1 | Jun 02 | **Phase 1 — Donor Passport** | passport_handler.go, donor_passport_repository.go, passport/page.tsx, passport/verify/[token]/page.tsx |
| 2 | Jun 02 | **Phase 1 — Donation Claims** | claim_handler.go, donation_claim_repository.go, claims/page.tsx, claims/new/page.tsx |
| 3 | Jun 02 | **Phase 1b — Verification Framework** | verification_handler.go, donor_verification_repository.go, verification/page.tsx |
| 4 | Jun 02 | **Phase 1b — Unified Timeline** | timeline_handler.go, timeline/page.tsx |
| 5 | Jun 02 | **Phase 2 — Award Engine** | recognition_handler.go, award_config_repository.go, user_title_repository.go, recognition/page.tsx, admin/awards/page.tsx |
| 6 | Jun 02 | **Phase 3 — PMI Review Portal** | admin_handler.go, admin/claims/page.tsx, admin/verifications/page.tsx |
| 7 | Jun 02 | **Phase 4 — Trust Dashboard** | trust_handler.go, trust_service.go, admin/analytics/page.tsx |
| 8 | Jun 02 | **Phase 4 — Analytics** | analytics_handler.go (6 endpoints) |
| 9 | Jun 02 | **UI Polish** | register redesign, skeleton loading, empty states, animations, bottom-nav links |
| 10 | Jun 02 | **Rhesus removed from all frontend** | 12 frontend files, 8 backend files; default "+" on insert |
| 11 | Jun 02 | **Registration lat/lng removed** | auth_service.go, register/page.tsx (DB DEFAULT 0) |
| 12 | Jun 02 | **Search auth-gated** | GET /donors moved to auth group in router.go |
| 13 | Jun 02 | **Unverified user page blocks** | search, requests, requests/new, requests/share pages |
| 14 | Jun 02 | **SMTP_SENDER fallback** | config.go getEnvWithFallback |
| 15 | Jun 02 | **Email templates redesigned** | email_service.go (branded HTML) |
| 16 | Jun 02 | **Seed background goroutine** | main.go "go seed.SeedDummy(db)" |
| 17 | Jun 02 | **Seed batch INSERT + dedup** | dummy.go transaction + globalEmailCounter |
| 18 | Jun 02 | **GetPublicURL fix** | file_service.go (was literal "TODO") |
| 19 | Jun 02 | **Badge auto-award** | RefreshDonationStats awards badges on count thresholds |
| 20 | Jun 02 | **Donation volume calculation** | 0.35L ≤55kg / 0.45L >55kg |
| 21 | Jun 02 | **.env.local not excluded from Docker** | frontend/.dockerignore |
| 22 | Jun 02 | **Logout redirect** | auth-context.tsx router.push("/") |
| 23 | Jun 02 | **Email verification state bug** | verify-email/page.tsx — added await refreshUser() post-verification |

---

## 8. MISSING AREAS

- **Tests**: Zero across entire project
- **Error boundaries**: No `error.tsx` or `loading.tsx` in any route
- **Redis**: Container running, zero usage in code
- **Production infra**: No k8s, terraform, monitoring, backups, HTTPS
- **Rate limiting**: Only forgot-password (in-memory); no general rate limiter
- **Privacy**: Phone numbers exposed via search API to authenticated users
- **Audit logging**: None
- **Pagination**: None on most list endpoints (donor history, requests, search, admin users)
- **Notifications**: No push/email alert when urgent request matches donor's blood type
- **PDF certificate**: Not implemented
- **Event QR check-in**: Not implemented
