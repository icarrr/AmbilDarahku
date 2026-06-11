# MEMORY — AmbilDarahku

## 1. CORE SUMMARY

Next.js 16 donor platform (Indonesia), 58+ API routes via Supabase JS client, custom JWT auth, Vercel Blob storage, PostgreSQL 16 (Supabase Cloud). 14 tables with RLS (service_role bypasses). Monorepo = frontend only at root (no Go backend). UI: Indonesian, Base UI + TailwindCSS 4 glassmorphism ("Vitality Flow"). 30 pages, 14 custom components. Event discovery via web scrapers (axios+cheerio). Dev password: `donor123`. Admin: `admin@ambildarahku.id` / `admin123`.

## 2. DOMAIN BREAKDOWN

### Auth
- Custom JWT (jsonwebtoken), bcrypt (12 rounds), refresh rotation (SHA-256 in `refresh_tokens`)
- `AuthContext` in React Context — `user`, `isUnverified`, `login()/register()/logout()`
- Access 15m / Refresh 7d (configurable via `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY`)
- Unverified users blocked from all non-auth endpoints (403 "email not verified")
- Email via Nodemailer/SMTP (Brevo), optional (no-op if `SMTP_HOST` empty)

### Donor
- Eligibility: age 18–65, weight ≥50kg, donation interval ≥56d
- Volume: always 0.45L/bag (no weight-based split)
- Statuses: `eligible`, `waiting_period`, `not_eligible`, `needs_clearance`
- Availability modes: `automatic` (follows eligibility) / `manual` (user chooses)
- Search priority: P1 (eligible+available), P2 (ready ≤3d), P3 (ready ≤7d), P4 (other)
- Duplicate-date guard: 409 if donor_history exists for same user+date

### Blood Requests
- Create → share card (QR + WhatsApp) → donor fulfills (auto-creates `pending` history)
- Fulfillment: atomic increment `fulfilled_bags`, auto-close when `>= bags`
- Urgency sort: critical → urgent → normal, then newest first
- Rhesus defaults to `"+"` (not exposed in UI)

### Passport
- Format: `ADK-YYYY-NNNNNN`, QR token: 64-char hex (URL path `/passport/verify/:token`)
- One per user (UNIQUE `user_id`). `/recognition` → 301 → `/passport`
- Stats: total donations, lives saved (×3), volume (×0.45), titles, badges (nested `badge` object)

### Claims & Verification
- Claims: pending → approved/rejected. Approved triggers `RefreshDonationStats` (no auto-create history)
- Verification levels: 0=None, 1=Self, 2=Community, 3=PMI. Level computed as `currentLevel + 1`
- Trust score: donation count (30%), verification (30%), claim accuracy (20%), profile (10%, 11 fields), age (10%)
- API response key: `verifications` (not `history`)

### Events
- CRUD + automatic discovery from PMI websites (ayodonor.pmi.or.id, pmibali.online, etc.)
- `event_sources` table defines scraper endpoints. `events` has `is_archived` for stale events
- Deduplication via `(source_type, source_id)` unique index
- Admin-only POST `/api/v1/events/discover` triggers scraping

### Admin
- Roles: `super_admin` (full), `pmi_admin` (review queue only), `donor` (default)
- 6 analytics endpoints (institutions, cities, years, months, age, top-donors) — JS-aggregated
- Award config CRUD, title assignment, user role management

## 3. API MAP

### Public (no auth)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/health` | `{ "status": "ok" }` |
| GET | `/api/v1/stats` | active_donors, lives_saved, etc. |
| POST | `/api/v1/auth/register` | Full registration |
| POST | `/api/v1/auth/login` | Returns user + token pair |
| POST | `/api/v1/auth/refresh` | Token rotation |
| POST | `/api/v1/auth/verify-email` | Token verification |
| POST | `/api/v1/auth/forgot-password` | 1/min rate limit |
| POST | `/api/v1/auth/reset-password` | Token + new password |
| GET | `/api/v1/u/[username]` | Public profile |
| GET | `/api/v1/requests` | Open requests (filterable) |
| GET | `/api/v1/requests/[id]` | Request + fulfillments |
| GET | `/api/v1/requests/[id]/fulfillments` | Fulfillment list |
| GET | `/api/v1/leaderboard/national` | Top 100 |
| GET | `/api/v1/leaderboard/regional?city=` | Top 50 |
| GET | `/api/v1/events` | Upcoming/ongoing |
| GET | `/api/v1/events/archive?city=&page=&per_page=` | Archived events |
| GET | `/api/v1/passport/verify/[token]` | SSR QR verification |
| GET | `/api/v1/passport/[username]` | Public passport |
| GET | `/api/v1/timeline/[username]?limit=&offset=` | Public timeline |
| GET | `/api/v1/recognition/[username]` | Public portfolio |
| GET | `/api/v1/trust-score/[username]` | Public trust score |

### Authenticated (JWT)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/auth/me` | User profile |
| PUT | `/api/v1/auth/me` | Partial update |
| POST | `/api/v1/auth/logout` | Delete all refresh tokens |
| POST | `/api/v1/auth/resend-verification` | Resend email |
| PUT | `/api/v1/auth/change-password` | Current + new |
| GET | `/api/v1/donors?blood_type=&city=&compatible_with=&lat=&lng=&radius=` | Search with distance |

### Verified Email Required (JWT + email_verified)
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/v1/donor-history` | List/Create history |
| PUT/DELETE | `/api/v1/donor-history/[id]` | Edit/Delete with stats recalc |
| GET/PUT | `/api/v1/donor-status` | Eligibility + availability |
| GET/POST | `/api/v1/donor-verification` | Verification levels |
| POST | `/api/v1/requests` | Create request |
| GET | `/api/v1/requests/mine` | My requests |
| PUT | `/api/v1/requests/[id]/status` | Cancel/fulfill |
| POST | `/api/v1/requests/[id]/fulfill` | Record donation (1 bag, pending) |
| GET | `/api/v1/passport` | My passport |
| POST | `/api/v1/passport/request` | Create passport |
| POST | `/api/v1/passport/renew` | Renew passport |
| GET | `/api/v1/recognition` | My portfolio |
| GET | `/api/v1/timeline?limit=&offset=` | My timeline |
| GET | `/api/v1/trust-score` | My score |
| POST | `/api/v1/trust-score/refresh` | Recalculate |
| GET/POST | `/api/v1/claims` | List/Create |
| GET/PUT/DELETE | `/api/v1/claims/[id]` | Get/Update/Cancel |
| POST | `/api/v1/upload` | File upload → Vercel Blob URL |
| GET | `/api/v1/files?url=` | Proxy private blob |

### Admin (super_admin)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/stats` | Dashboard stats |
| GET | `/api/v1/admin/users` | List all |
| PUT | `/api/v1/admin/users/[id]/role` | Change role |
| POST | `/api/v1/events` | Create event |
| POST | `/api/v1/events/discover` | Trigger scraping |
| GET/POST/PUT/DELETE | `/api/v1/events/sources` | Event source CRUD |
| GET/POST | `/api/v1/admin/awards` | Awards CRUD |
| PUT/DELETE | `/api/v1/admin/awards/[id]` | Award update/delete |
| GET/POST | `/api/v1/admin/titles` | Title management |

### PMI/Admin (super_admin OR pmi_admin)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/claims` | Pending claims list |
| GET | `/api/v1/admin/claims/[id]` | Claim detail |
| PUT | `/api/v1/admin/claims/[id]/review` | Approve/reject |
| GET | `/api/v1/admin/verifications` | Pending verifications |
| PUT | `/api/v1/admin/verifications/[id]/review` | Approve/reject |
| GET | `/api/v1/admin/analytics/*` | 6 aggregation endpoints |

## 4. DATA MAP

### Entities (14 tables)
| Table | Key Columns | Relations |
|-------|------------|-----------|
| `users` | id (UUID PK), full_name, phone (UNIQUE), email (UNIQUE), blood_type, role, total_donations, verification_level, trust_score, address, nik | FK child of all user-related tables |
| `donor_histories` | user_id (FK CASCADE), donation_date, bags, verification_status, proof_photo | user_id → users |
| `donor_verifications` | user_id (FK), level (1-3), status | user_id → users |
| `blood_requests` | requester_id (FK), patient_name, blood_type, bags, fulfilled_bags, urgency, status | requester_id → users |
| `request_fulfillments` | request_id (FK), donor_id (FK), bags | request_id → blood_requests, donor_id → users |
| `badges` | name (UNIQUE), min_donations | Seeded: 1/5/10/25/50/100 |
| `user_badges` | user_id (FK), badge_id (FK) | UNIQUE(user_id, badge_id) |
| `refresh_tokens` | user_id (FK), token_hash (SHA-256), expires_at | user_id → users |
| `verification_tokens` | user_id (FK), token, type, expires_at | user_id → users |
| `events` | title, city, event_date, source_url, source_type, source_id, is_archived, raw_data | UNIQUE(source_type, source_id) WHERE source_id NOT NULL |
| `event_organizers` | name, city, is_active | events.organizer_id → event_organizers |
| `event_sources` | source_type, source_url, scraper_config (JSONB), detection_keywords (TEXT[]) | Scraper configuration |
| `donor_passports` | user_id (FK UNIQUE), passport_number (UNIQUE ADK-YYYY-NNNNNN), qr_token (UNIQUE 64-char hex) | user_id → users |
| `donation_claims` | user_id (FK), status, reviewed_by | user_id → users |
| `award_configs` | name, award_type, criteria (JSONB), scope | Config for titles |
| `user_titles` | user_id (FK), title, source, config_id | user_id → users, config_id → award_configs |

### Storage
- Vercel Blob (private) — proof photos, avatars → proxied through `/api/v1/files?url=...`
- No local file storage

## 5. UI MAP

### Page Tree
```
/login                    → Login form
/register                 → 3-step registration (profile→blood→domicile)
/forgot-password          → Email form
/reset-password           → Token + new password (Suspense)
/verify-email             → Token verification (Suspense)
/                         → Landing with live stats
/search                   → Donor search (filters, map, cards)
/profile                  → Dashboard (stats ring, badges, trust, edit, availability toggle)
/donor-history            → CRUD history list + proof photo upload
/requests                 → Open request list
/requests/new             → Create request form
/requests/share/[id]      → Share card (QR, WhatsApp, confirm + fulfill)
/passport                 → Passport (QR, stats, badges, titles, verification)
/passport/verify/[token]  → SSR public verification page
/recognition              → 301 → /passport
/verification             → Submit verification request
/claims                   → Claim list
/claims/new               → New claim form
/timeline                 → Activity feed
/leaderboard              → National/regional ranking (podium)
/events                   → Event list
/events/new               → Admin create event
/events/archive           → Archived events with city filter
/u/[username]             → SSR public profile
/admin                    → Dashboard with stats
/admin/claims             → Review claims
/admin/verifications      → Review verifications
/admin/awards             → Award config CRUD
/admin/analytics          → Bar charts (6 dimensions)
/privacy                  → SSR privacy policy
/terms                    → SSR terms of service
```

### Component Hierarchy
```
RootLayout
├── AuthProvider (context)
├── DesktopSidebar (md+ only)
│   └── Nav links: Search, Requests, Profile, Passport, Leaderboard, Events, Timeline, Admin
├── <main>
│   └── Page content
├── BottomNav (mobile fixed)
│   └── Nav links: Home, Search, Requests, Profile, Passport
└── Toaster (sonner)
```

Custom components: `GlassCard`, `ConfirmDialog` (portal-based), `AvatarWithBadge`, `BloodTypeBadge`, `StatusBadge`, `UrgencyBadge`, `DonorCard`, `StatCard`, `SectionTitle`, `Timeline`, `RankBadge`, `Navbar`, `DesktopSidebar`, `BottomNav`

## 6. INFRA MAP

| Environment | DB | Storage | Auth | Deploy |
|---|---|---|---|---|
| Dev (local) | Supabase Cloud or Docker PG | Vercel Blob (dev token) | Custom JWT (local SECRET) | `npm run dev` |
| Production | Supabase Cloud PG | Vercel Blob (prod token) | Custom JWT (prod SECRET) | Vercel or `npm run build` + `npm start` |
| CI | None (build only) | None | None | GitHub Actions, ubuntu-latest, node 22 |

Docker Compose: `postgres:16-alpine`, `redis:7-alpine` (unused), `frontend` (node:22-alpine, standalone output)
No K8s, no staging environment declared.

## 7. CHANGE DIGEST

- **Migrated from Go/Gin backend to Next.js API routes + Supabase** — all backend logic now in `src/app/api/v1/*/route.ts`
- **File storage from MinIO/S3 to Vercel Blob** — private blobs proxied through `/api/v1/files`
- **RLS enabled on all 14 tables** — service_role bypasses, anon key unused
- **Donation volume always 0.45L** — removed weight-based split (≤55kg=0.35L)
- **Age rule simplified**: min 18, max 65 (removed first-time 17-60 / repeat up to 65 split)
- **Weight rule**: 50kg minimum (was 45kg)
- **Verification API response key**: `verifications` (not `history`)
- **Recognition → Passport merge**: `/recognition` 301 redirects to `/passport`
- **Event discovery**: scrapers for 6+ PMI sources, dedup via `(source_type, source_id)` index
- **Donor history auto-verify**: photo upload sets `verification_status: "verified"`
- **Fulfill via share page**: creates `pending` history (requires photo to auto-verify)
- **Profile fields for trust score**: expanded to 11 fields (denominator 11)
- **DB schema additions**: `address`, `nik` on users; `source_url`, `source_type`, `source_id`, `is_archived`, `archived_at`, `raw_data` on events; `event_organizers` table; `event_sources` table
- **Refresh stats**: removed `refresh_donor_stats` RPC, JS fallback always executes
- **Availability toggle**: always sends `"manual"` mode so user choice is respected
- **QR URLs**: use `NEXT_PUBLIC_APP_URL` env var instead of `window.location.origin`
