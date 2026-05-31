# Features — AmbilDarahku

## User Roles

| Role | Access |
|---|---|
| `donor` (default) | Own profile, donor history, blood requests, search |
| `super_admin` | All donor access + admin panel (user management, role assignment) |
| `community_admin` | Defined in schema but no specific routes implemented |
| `pmi_admin` | Defined in schema but no specific routes implemented |
| `hospital_admin` | Defined in schema but no specific routes implemented |

## Feature Inventory

### Authentication & User Management

| Feature | Status | Source |
|---|---|---|
| Email/password registration | ✅ Complete | `auth_handler.go`, `auth_service.go` |
| Login with JWT | ✅ Complete | `auth_handler.go`, `auth_service.go` |
| Token refresh with rotation | ✅ Complete | `auth_service.go`, `api.ts` |
| Logout (invalidate tokens) | ✅ Complete | `auth_service.go`, `auth_handler.go` |
| Get/update own profile | ✅ Complete | `user_handler.go` |
| Admin list all users | ✅ Complete | `user_handler.go` ListAll |
| Admin update user role | ✅ Complete | `user_handler.go` UpdateUserRole |
| Public user portfolio by username | ✅ Complete | `user_handler.go` GetPublicProfile |
| 3-step registration form | ✅ Complete | `frontend/src/app/register/page.tsx` |
| Profile editing | ✅ Complete | `frontend/src/app/profile/page.tsx` |

### Donor Search

| Feature | Status | Source |
|---|---|---|
| Search donors by blood type | ✅ Complete | `search_handler.go` |
| Search by rhesus | ✅ Complete | `search_handler.go` |
| Search by city | ✅ Complete | `search_handler.go` |
| Filter by availability (defaults to available) | ✅ Complete | `search_handler.go` |
| Search priority sorting (P1-P4) | ✅ Computed | `donor_status_service.go` |
| Grid/list view toggle | ✅ Complete | `frontend/src/app/search/page.tsx` |
| WhatsApp contact button | ✅ Complete | `donor-card.tsx`, search page |
| Radius filter | 🟡 UI only | Frontend sends but backend ignores radius param |
| Distance calculation | ❌ Missing | No geospatial queries implemented |
| Map view | ❌ Missing | Leaflet declared but not used |

### Donor Status Management

| Feature | Status | Source |
|---|---|---|
| Eligibility auto-calculation (90-day rule) | ✅ Complete | `donor_status_service.go` |
| Availability mode (automatic/manual) | ✅ Complete | `donor_status_service.go` |
| Auto-mode: syncs with eligibility | ✅ Complete | `donor_status_service.go` |
| Manual mode: user sets status + reason | ✅ Complete | `donor_status_service.go` |
| Ready-again date for temp unavailable | ✅ Complete | `donor_status_service.go` |
| Search priority calculation (P1-P4) | ✅ Complete | `donor_status_service.go` |
| Dashboard status toggle | ✅ Complete | `frontend/src/app/profile/page.tsx` |
| Auto-reactivation scheduler | ❌ Missing | PRD mentions daily scheduler — not implemented |

### Blood Requests

| Feature | Status | Source |
|---|---|---|
| Create emergency blood request | ✅ Complete | `blood_request_handler.go` |
| List open requests (with filters) | ✅ Complete | `blood_request_handler.go` |
| List my requests | ✅ Complete | `blood_request_handler.go` |
| Update request status (open/fulfilled/cancelled) | ✅ Complete | `blood_request_handler.go` |
| Urgency levels (critical/urgent/normal) | ✅ Complete | Model, UI |
| Request form with validation | ✅ Complete | `frontend/src/app/requests/new/page.tsx` |
| Shareable request card page | ✅ Complete | `frontend/src/app/requests/share/[id]/page.tsx` |
| WhatsApp template messages | ✅ Complete | `whatsapp_service.go` |
| Request sharing (native share/clipboard) | ✅ Complete | share page |
| Request card download | 🟡 Placeholder | Shows "coming soon" toast |

### Donor History

| Feature | Status | Source |
|---|---|---|
| Add donation history record | ✅ Complete | `donor_history_handler.go` |
| List own history | ✅ Complete | `donor_history_handler.go` |
| Verification status (pending/verified/rejected) | ✅ Complete | Model |
| Upload proof (photo, card, letter) | 🟡 Stored as URL | Model stores proof URLs but no upload endpoint wired |
| Verification by admin | 🟡 Repo exists | `donor_verification_repository.go` but no handler routes |
| Badge auto-awarding | 🟡 Repo exists | `badge_repository.go` AwardBadge exists but not wired to any trigger |

### Badge System

| Badge | Threshold | Status |
|---|---|---|
| First Drop | 1 donation | ✅ Seeded in DB |
| Lifesaver | 5 donations | ✅ Seeded in DB |
| Hero | 10 donations | ✅ Seeded in DB |
| Guardian | 25 donations | ✅ Seeded in DB |
| Legend | 50 donations | ✅ Seeded in DB |
| Blood Champion | 100 donations | ✅ Seeded in DB |

Badges are seeded on startup but never automatically awarded — no trigger logic wired.

### Leaderboard

| Feature | Status | Source |
|---|---|---|
| National leaderboard (top 100) | ✅ Complete | `leaderboard_handler.go` |
| Regional leaderboard (top 50, by city) | ✅ Complete | `leaderboard_handler.go` |
| National/regional tab toggle | ✅ Complete | `frontend/src/app/leaderboard/page.tsx` |
| Points system UI display | ✅ Complete | Frontend shows pts, but formula not fully implemented |

### Landing Page

| Feature | Status | Source |
|---|---|---|
| Hero section with CTA | ✅ Complete | `page.tsx` |
| Stats display (hardcoded) | ✅ Complete | `page.tsx` |
| How it works section | ✅ Complete | `page.tsx` |
| Badge showcase | ✅ Complete | `page.tsx` |
| Event cards (hardcoded mock data) | ✅ Complete | `page.tsx` |
| Footer | ✅ Complete | `page.tsx` |

### Infrastructure

| Feature | Status | Source |
|---|---|---|
| Docker Compose (5 services) | ✅ Complete | `docker-compose.yml` |
| Backend Dockerfile (multi-stage) | ✅ Complete | `backend/Dockerfile` |
| Frontend Dockerfile (multi-stage) | ✅ Complete | `frontend/Dockerfile` |
| CI pipeline (GitHub Actions) | ✅ Complete | `.github/workflows/ci.yml` |
| Environment config template | ✅ Complete | `.env.example` |

## Planned / Not Implemented Features (from PRD)

- Event donor management (Phase 2)
- QR check-in for events
- Donor certificate (PDF/PNG)
- PMI official account integration (Phase 3)
- Blood stock monitoring
- Low stock alerts
- Mass WhatsApp campaigns
- Hospital integration (Phase 3)
- Smart donor matching
- Donor broadcast
- Response tracking
- Emergency campaigns
- Community leaderboard
