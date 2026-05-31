# Business Rules — AmbilDarahku

## Donor Eligibility

**Rule**: A donor is eligible to donate again 90 days after their last donation.

- Source: `donor_status_service.go:17` (`const eligibilityDays = 90`)
- If `last_donation_date` is NULL → eligible (new donor)
- If `days_since >= 90` → "eligible"
- If `days_since < 90` → "recovery"
- Evaluation happens on-demand via `GET /donor-status` and during `PUT /donor-status`

## Availability Mode

| Mode | Behavior |
|---|---|
| `automatic` (default) | Status follows eligibility: Eligible → Available, Recovery → Temporarily Unavailable |
| `manual` | User controls status directly; can set reason and ready-again date |

- Source: `donor_status_service.go:47-58`

## Search Priority (P1-P4)

| Priority | Condition |
|---|---|
| P1 | Eligible + Available |
| P2 | Eligible + Ready Again Date <= 3 days from now |
| P3 | Eligible + Ready Again Date <= 7 days from now |
| P4 | Recovery (or any other state) |

- Source: `donor_status_service.go:102-123`

## User Registration Validation

- Email must be unique (checked before insert)
- Phone must be unique
- Password hashed with bcrypt
- Required fields: full_name, phone, email, password, date_of_birth, gender, blood_type, rhesus, weight_kg, height_cm, province, city, district, latitude, longitude
- Role defaults to "donor"

- Source: `auth_service.go:58-92`

## Blood Request Rules

| Field | Validation |
|---|---|
| `blood_type` | Must be A, B, AB, or O |
| `rhesus` | Must be + or - |
| `urgency` | Must be critical, urgent, or normal |
| `status` | Default "open"; can be "fulfilled" or "cancelled" |
| `bags` | Defaults to 1 if < 1 |

- Open requests sorted by urgency then recency: critical → urgent → normal
- Source: `blood_request_repository.go:59`

## Badge Thresholds

| Donations | Badge |
|---|---|
| 1 | First Drop |
| 5 | Lifesaver |
| 10 | Hero |
| 25 | Guardian |
| 50 | Legend |
| 100 | Blood Champion |

- Badges are seeded on startup but **not** automatically awarded — no trigger logic exists.

## Donor History Verification

| Status | Meaning |
|---|---|
| `pending` | Default on creation |
| `verified` | Admin confirmed |
| `rejected` | Admin rejected |

- Up to 3 proof types: photo, card, letter
- Verification can be done by community or PMI (verifier_role in `donor_verifications`)

## User Roles

| Role | Allowed Actions |
|---|---|
| `donor` | All authenticated endpoints |
| `super_admin` | All donor actions + admin endpoints |
| `community_admin` | Schema-only; no specific routes enforced |
| `pmi_admin` | Schema-only; no specific routes enforced |
| `hospital_admin` | Schema-only; no specific routes enforced |

- Admin routes protected by `middleware.AdminRequired()` which checks `role == "super_admin"`
- Source: `middleware/auth.go:55-63`

## Password Rules

- Min length: 6 characters (frontend placeholder hint)
- Hashing: bcrypt (DefaultCost)
- Source: `pkg/utils/password.go`

## Token Rules

| Token | TTL | Default |
|---|---|---|
| Access Token | Configurable | 15 minutes |
| Refresh Token | Configurable | 7 days |

- Refresh token rotation: old token deleted on use, new pair issued
- Refresh token stored as SHA-256 hash in DB
- Logout deletes all refresh tokens for the user
- Source: `auth_service.go`, `refresh_token_repository.go`

## Privacy Rule (PRD)

- Phone numbers should not be exposed publicly on portfolio pages
- **Implemented**: Public portfolio (`/u/:username`) does NOT include phone
- **NOT Implemented**: Search results (`GET /donors`) include phone numbers (exposed to any caller)
- Source: `user_handler.go:158-176`, `search_handler.go` returns full user model incl phone
