# Documentation Audit — AmbilDarahku

## Audit Methodology

Full source code analysis against existing documentation (README.md, PRD.md, DESIGN.md, frontend AGENTS.md/CLAUDE.md).

---

## Critical Issues

### 1. Phone Number Privacy Violation

- **Location**: `backend/internal/repositories/user_repository.go:216-248` (Search returns full `User` struct)
- **Detail**: The `Search` function uses `SELECT *` which includes `phone`. The endpoint `GET /api/v1/donors` exposes all phone numbers to any caller.
- **PRD says**: "Nomor WhatsApp tidak tampil publik" (WhatsApp number not publicly displayed)
- **Severity**: Security / Privacy
- **Recommendation**: Create a separate search response type that excludes `phone`, `email`, `password_hash`. Limit phone exposure to authenticated users who initiate contact.

### 2. Go Version Mismatch

- **Location**: `go.mod` says `go 1.26.1`, CI uses `go-version: "1.22"`
- **Detail**: Go 1.26 has different grammar than 1.22. CI will likely fail.
- **Severity**: Build failure in CI
- **Recommendation**: Either downgrade go.mod to 1.22 or upgrade CI to 1.26

### 3. No Tests

- **Location**: Entire repository
- **Detail**: Zero test files exist for backend or frontend
- **Severity**: Quality
- **Recommendation**: Add unit tests for services, handler tests for API

---

## Documentation Gaps

### What IS Documented

- ✅ README: Quick start, project structure, API endpoints, features, env vars
- ✅ PRD: Full product requirements, user stories, phases
- ✅ DESIGN: Complete design system (Vitality Flow)
- ✅ frontend/AGENTS.md: Next.js version warning
- ✅ frontend/CLAUDE.md: Points to AGENTS.md

### What is NOT Documented (gaps filled by this audit)

- ❌ Architecture diagrams (now in ARCHITECTURE.md)
- ❌ Complete API reference (now in API.md)
- ❌ Database schema with relationships (now in DATABASE.md)
- ❌ Business rules (now in BUSINESS_RULES.md)
- ❌ Feature inventory with status (now in FEATURES.md)
- ❌ Infrastructure details (now in INFRASTRUCTURE.md)
- ❌ Troubleshooting guide (now in TROUBLESHOOTING.md)
- ❌ Architecture decisions (now in DECISIONS.md)

---

## Undocumented Features (from code, not in PRD)

- Admin panel: user management, role assignment
- Shareable request card page (with native share API)
- Landing page with mock data (hardcoded stats, events)
- 3-step registration form (step indicator wizard)
- Dark mode variables in CSS (not active, but `@custom-variant dark` exists)

## Dead Code / Unused Components

| Item | Location | Status |
|---|---|---|
| `DonorCard` component | `frontend/src/components/donor-card.tsx` | Defined but **not used** by any page |
| `StatCard` component | `frontend/src/components/stat-card.tsx` | Defined but **not used** by any page |
| `donor_verification_repository.go` | Backend repo | Exists but **no routes/handlers** wire to it |
| `file_service.go` | Backend service | Exists but not wired to any handler and `GetPublicURL` returns "TODO" |
| `whatsapp_service.go` | Backend service | Exists but not wired to any handler (template functions are standalone) |

---

## Missing Implementations (from PRD)

| Feature | Phase | Code Status |
|---|---|---|
| Redis integration | MVP | In config/docker-compose but never used |
| OpenStreetMap / Leaflet | MVP | Not used in frontend |
| Radius-based search | MVP | UI sends radius param, backend ignores it |
| Auto-reactivation scheduler | MVP | No cron/goroutine checks ready_again_date |
| Badge auto-awarding | MVP | `AwardBadge` repo function exists but never called |
| File upload endpoints | MVP | `FileService` exists but no upload route |
| Point formula | MVP | `total_points` column exists but no calculation logic |
| Email service | MVP | Not implemented |
| Event management | Phase 2 | Not implemented |
| QR check-in | Phase 2 | Not implemented |
| Donor certificate | Phase 2 | Not implemented |
| PMI integration | Phase 3 | Not implemented |
| Hospital integration | Phase 3 | Not implemented |
| Donor broadcast | Phase 3 | Not implemented |
| Community leaderboard | Phase 2 | Not implemented |

---

## Naming Issues

- `frontend/CLAUDE.md` references AGENTS.md — this is Claude-specific. Should be named for the AI tool being used.
- Some frontend components mix variable naming: `form` object in register uses snake_case (`full_name`) while in profile uses camelCase (`form.full_name`) — consistent with API patterns but inconsistent across components

---

## Security Concerns

1. **CORS allows all origins** (`*`) — should be restricted in production
2. **Default credentials** (JWT secret, DB, MinIO) — documented but easily overlooked
3. **Phone exposure** in search results (see Critical Issues)
4. **No rate limiting** — endpoints vulnerable to brute force
5. **No audit logging** — no record of admin actions
6. **No HTTPS** — no TLS configuration

---

## Technical Debt

1. **No migration versioning** — schema changes require manual tracking
2. **Inline SQL in repositories** — no query builder, potential for errors with complex queries
3. **Inconsistent layer usage** — some handlers go through Service layer, others directly use Repository
4. **Frontend mock data** — landing page stats and events are hardcoded
5. **UUID-ossp extension required** — not all PostgreSQL installations include it

---

## Recommendations (Priority Order)

| Priority | Action |
|---|---|
| P0 | Fix Go version mismatch in go.mod or CI |
| P0 | Remove phone from search results or add auth gate |
| P1 | Add tests for critical business logic (eligibility, priority) |
| P1 | Wire badge awarding to donation history creation |
| P1 | Implement file upload endpoint and fix `GetPublicURL` |
| P2 | Implement Redis integration or remove from config |
| P2 | Restrict CORS in production |
| P2 | Add rate limiting middleware |
| P2 | Implement auto-reactivation scheduler |
| P3 | Remove unused components (DonorCard, StatCard) or use them |
| P3 | Connect whatsapp_service to blood request creation flow |
| P3 | Add migration versioning |
