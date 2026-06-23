# MEMORY — AmbilDarahku

## 1. CORE SUMMARY

Next.js 16 donor platform (Indonesia), 64 API routes via Supabase JS client, custom JWT auth, Vercel Blob storage, PostgreSQL 16 (Supabase Cloud). 15 tables with RLS (service_role bypasses). Monorepo = frontend only at root (no Go backend). UI: Indonesian, Base UI + TailwindCSS 4 glassmorphism ("Vitality Flow"). 31 pages, 14 custom components. Event discovery via web scrapers (axios+cheerio) + REST API. Blood request discovery via Supabase REST API (axios+pg Pool). Dev password: `donor123`. Admin: `admin@ambildarahku.id` / `admin123`.

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
- Phone normalization: `08xx` → `628xx`, strips dashes/spaces
- List page filters: status toggle (Aktif/Semua), search by patient name, hospital dropdown

### Blood Request Discovery
- Source: External Supabase REST API (Kawan Sedarah), hardcoded anon key
- Runs via `POST /api/v1/blood-requests/discover` (admin or cron)
- Cron: every 1h (`0 * * * *`)
- On first run (table empty): fetch ALL records (`?select=*&limit=1000`)
- On subsequent runs: fetch only non-completed (`?status=not.in.(selesai,Selesai)&limit=1000`)
- Field mapping:
  - `id` → `source_request_id`, `source_type` = `'kawan_sedarah'`
  - `patient_name`, `blood_type` (parses "A+" → type=A, rhesus=+), `amount` → `bags`
  - `status`: "Selesai" → `"fulfilled"`, others → `"open"`
  - `contact_number` → normalized via `normalizePhone()` (08→628, strip -/space)
  - `notes` → `notes`, also extracts hospital name via regex
  - `created_at` → uses API's original timestamp
  - `reason`, `slug`, etc. → `raw_data` (JSONB)
  - `requester_id` → first admin user's ID
- Dedup: `INSERT ... ON CONFLICT (source_type, source_request_id) DO UPDATE SET status = ...`
- Status guard: local `fulfilled` status never overwritten by API
- Backfill on every run: normalize phone numbers, fix `created_at` from `raw_data`
- Admin dashboard has "Scrape Permintaan Darah" button

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
- CRUD + automatic discovery from 7 sources:
  - 1x AyoDonor PMI Nasional (cheerio, 38 provinces)
  - 1x PMI Bali (cheerio)
  - 4x PMI City (cheerio, CSS selectors)
  - 1x REST API (Kawan Sedarah Supabase, axios)
- `event_sources` table defines scraper endpoints. `events` has `is_archived`, `poster_url`
- Dedup via `(source_type, source_id)` unique index, `ON CONFLICT DO NOTHING`
- Admin-only POST `/api/v1/events/discover` triggers scraping (also via cron every 3h)
- Image pipeline: download `image_url` from API → `put()` to Vercel Blob with original filename → `poster_url` (path-only key)
- Backfill: `backfillMissingPosters()` checks for events with no `poster_url` but with `raw_data.image_url`
- Fallback: Gemini image displayed when no `poster_url` exists
- Event pages: filter tabs (Akan Datang/Selesai/Semua), show-more button (6 per page), cards clickable via poster proxy

### Admin
- Roles: `super_admin` (full), `pmi_admin` (review queue only), `donor` (default)
- 6 analytics endpoints (institutions, cities, years, months, age, top-donors) — JS-aggregated
- Award config CRUD, title assignment, user role management
- Dashboard has 2 scrape buttons: Event Discovery + Blood Request Discovery

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
| GET | `/api/v1/requests` | All blood requests (filterable by blood_type, urgency; default 50) |
| GET | `/api/v1/requests/[id]` | Request + fulfillments |
| GET | `/api/v1/requests/[id]/fulfillments` | Fulfillment list |
| GET | `/api/v1/leaderboard/national` | Top 100 |
| GET | `/api/v1/leaderboard/regional?city=` | Top 50 |
| GET | `/api/v1/events` | All non-archived events |
| GET | `/api/v1/events/archive?city=&page=&per_page=` | Archived events |
| GET | `/api/v1/events/sources` | List event sources |
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
| GET | `/api/v1/files?url=` | Proxy private blob (accepts full URL or path) |

### Admin (super_admin)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/stats` | Dashboard stats |
| GET | `/api/v1/admin/users` | List all |
| PUT | `/api/v1/admin/users/[id]/role` | Change role |
| POST | `/api/v1/events` | Create event |
| POST | `/api/v1/events/discover` | Trigger event scraping |
| GET/POST/PUT/DELETE | `/api/v1/events/sources` | Event source CRUD |
| PATCH | `/api/v1/events/sources` | Seed sources from registry |
| POST | `/api/v1/blood-requests/discover` | Trigger blood request scraping |
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

### Entities (15 tables)
| Table | Key Columns | Relations |
|-------|------------|-----------|
| `users` | id (UUID PK), full_name, phone (UNIQUE), email (UNIQUE), blood_type, role, total_donations, verification_level, trust_score, address, nik | FK child of all user-related tables |
| `donor_histories` | user_id (FK CASCADE), donation_date, bags, verification_status, proof_photo | user_id → users |
| `donor_verifications` | user_id (FK), level (1-3), status | user_id → users |
| `blood_requests` | id (UUID PK), requester_id (FK, NULLABLE), patient_name, blood_type, rhesus, bags, fulfilled_bags, urgency, status, hospital, city, contact_phone, notes, source_request_id (VARCHAR), source_type (VARCHAR DEFAULT 'ambildarahku_users'), raw_data (JSONB), created_at | requester_id → users; UNIQUE(source_type, source_request_id) |
| `request_fulfillments` | request_id (FK), donor_id (FK), bags | request_id → blood_requests, donor_id → users |
| `badges` | name (UNIQUE), min_donations | Seeded: 1/5/10/25/50/100 |
| `user_badges` | user_id (FK), badge_id (FK) | UNIQUE(user_id, badge_id) |
| `refresh_tokens` | user_id (FK), token_hash (SHA-256), expires_at | user_id → users |
| `verification_tokens` | user_id (FK), token, type, expires_at | user_id → users |
| `events` | id (UUID PK), title, description, location, city, event_date, start_time, end_time, organizer, status, source_url, source_type, source_id, is_archived, raw_data, poster_url (TEXT), created_at | UNIQUE(source_type, source_id) WHERE source_id NOT NULL |
| `event_sources` | id (UUID PK), source_type, source_name, source_url, scraper_config (JSONB), detection_keywords (TEXT[]), is_active, last_scraped_at, scrape_frequency_minutes | UNIQUE(source_url) |
| `donor_passports` | user_id (FK UNIQUE), passport_number (UNIQUE ADK-YYYY-NNNNNN), qr_token (UNIQUE 64-char hex) | user_id → users |
| `donation_claims` | user_id (FK), status, reviewed_by | user_id → users |
| `award_configs` | name, award_type, criteria (JSONB), scope | Config for titles |
| `user_titles` | user_id (FK), title, source, config_id | user_id → users, config_id → award_configs |

### Storage
- Vercel Blob (private) — proof photos, avatars, event poster images → proxied through `/api/v1/files?url=...`
- Poster images stored at path-only key `events/{filename}`, no domain or SAS token in DB
- Gemini fallback image at `events/Gemini_Generated_Image_295p3i295p3i295p.jpg`
- No local file storage

### Removed Tables/Columns
- `event_organizers` — dropped (was unused)
- `events.organizer_id` — dropped (was unused FK)
- `events.banner_url` — dropped (replaced by `poster_url`)
- `event_sources.organizer_id` — never existed

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
/requests                 → Blood request list (search, hospital filter, status toggle)
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
/events                   → Event list (filter tabs, show-more, clickable poster cards)
/events/new               → Admin create event
/events/archive           → Archived events (city filter, pagination, clickable poster)
/u/[username]             → SSR public profile
/admin                    → Dashboard with stats + 2 scrape buttons
/admin/claims             → Review claims
/admin/verifications      → Review verifications
/admin/awards             → Award config CRUD
/admin/analytics          → Bar charts (6 dimensions)
/privacy                  → SSR privacy policy
/terms                    → SSR terms of service
```

### Blood Request Page Features
- Status toggle button: Aktif (default, hides fulfilled) / Semua Status
- Search input: filter by patient name
- Hospital dropdown: auto-populated from data
- Card shows: patient name + blood type badge, hospital/city, time ago, fulfilled/remaining count, progress bar, WhatsApp link, "Selesai" badge for fulfilled
- Click navigates to share page
- Phone numbers normalized to `628xx` format

### Event Page Features
- Filter tabs: Akan Datang (default, status=upcoming/ongoing) / Selesai (status=completed) / Semua
- Show-more button: loads 6 more per click
- Card shows: date box, title, location, time range, organizer, description (line-clamp-2)
- Card clickable: opens poster image via `/api/v1/files` proxy
- Fallback image: Gemini placeholder when no poster exists
- Archive page: same card pattern with pagination, city filter

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

### Cron Schedules
| Endpoint | Schedule | Purpose |
|---|---|---|
| `POST /api/v1/events/discover` | `0 */3 * * *` (3h) | Scrape event sources, download posters |
| `POST /api/v1/blood-requests/discover` | `0 * * * *` (1h) | Upsert blood requests from external API |

Docker Compose: `postgres:16-alpine`, `redis:7-alpine` (unused), `frontend` (node:22-alpine, standalone output).
No K8s, no staging environment declared.

## 7. CHANGE DIGEST

- **Event discovery**: Added `rest_api` source type (Kawan Sedarah Supabase REST API) alongside existing PMI scrapers
- **Image pipeline**: Download event images during scrape → upload to Vercel Blob → store path-only key as `poster_url`. Fallback to Gemini image when no poster exists.
- **No re-download**: `filterNewEvents()` runs before image download; only truly new events get poster images
- **Backfill poster**: `backfillMissingPosters()` runs each scrape cycle, catches any events missing posters
- **banner_url dropped**: Replaced by `poster_url`. Admin create-event form now saves to `poster_url`.
- **event_organizers dropped**: Unused FK table. `events.organizer_id` column dropped.
- **Proxy updated**: `/api/v1/files` now accepts path-only blob keys (prepends `BLOB_BASE`), removed complex fallback logic
- **Gemini fallback**: Internal constant `GEMINI_URL` used as last-resort image when blob not found
- **Blood request discovery**: New `src/lib/blood-request-discovery/runner.ts` — fetches from external REST API, maps fields, upserts with status guard
- **Phone normalization**: `08xx` → `628xx`, strips dashes/spaces on insert + backfill
- **Blood requests schema**: Added `source_request_id`, `source_type`, `raw_data` columns. `requester_id` made nullable.
- **Blood requests dedup**: `(source_type, source_request_id)` unique partial index. `ON CONFLICT DO UPDATE` with status guard.
- **Blood requests API**: Removed `.eq("status", "open")` filter — now returns all requests. Frontend filtering via status toggle.
- **Vercel Cron**: Added `blood-requests/discover` at `0 * * * *`, changed events from 6h to `0 */3 * * *`
- **Event page filters**: Added filter tabs (Akan Datang/Selesai/Semua), show-more button (6 per page)
- **Event card clickability**: Cards open poster through `/api/v1/files` proxy. Uses `poster_url` → `FALLBACK_EVENT_PATH` fallback.
- **Admin dashboard**: Added "Scrape Permintaan Darah" button + result panel
- **15 tables total**: Removed `event_organizers` (was 16). Added `event_sources` (not previously counted).
