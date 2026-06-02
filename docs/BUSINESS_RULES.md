# Business Rules — AmbilDarahku

## Donor Eligibility

**Rule**: A donor can donate again 56 days after their last donation.

- Source: `interval_rule.go`
- If `last_donation_date` is NULL → eligible (new donor)
- If `days_since >= 56` → "eligible"
- If `days_since < 56` → "waiting_period"
- First-time donor: age 17-60; repeat: up to 65 (60-65 = needs_clearance)
- Minimum weight: 45 kg

| Status | Meaning |
|---|---|
| `eligible` | Can donate now |
| `waiting_period` | Must wait (remaining days shown) |
| `not_eligible` | Fails a hard rule (age, weight) |
| `needs_clearance` | Age 60-65 (repeat donor), needs medical clearance |

## Availability Mode

| Mode | Behavior |
|---|---|
| `automatic` (default) | Status follows eligibility: Eligible → Available, Waiting → Temporarily Unavailable |
| `manual` | User controls status directly; can set reason and ready_again_date |

## Search Priority (P1-P4)

| Priority | Condition |
|---|---|
| P1 | Eligible + Available |
| P2 | Eligible + Ready Again Date ≤ 3 days from now |
| P3 | Eligible + Ready Again Date ≤ 7 days from now |
| P4 | Any other state |

## Donation Volume

- Weight ≤ 55 kg → **0.35 L** per bag
- Weight > 55 kg → **0.45 L** per bag
- Total volume = bags × volume_per_bag (displayed via `toFixed(2)`)

## Donation History

- Duplicate-date guard: 409 if record already exists for user on same day
- Creating a history record triggers `RefreshDonationStats` (recalculates total_donations, total_points, eligibility, donation_volume_total, and auto-awards badges)
- Updating proof photo auto-sets verification_status = "verified"
- Blood request fulfillment auto-creates a verified donor history (if none exists today)

## Blood Requests

| Field | Validation |
|---|---|
| `blood_type` | Must be A, B, AB, or O |
| `rhesus` | Hardcoded to "+" on creation (not requested from user) |
| `urgency` | critical, urgent, or normal |
| `status` | Default "open"; can be "fulfilled" or "cancelled" |
| `bags` | Defaults to 1 if < 1 |

- Open requests sorted by urgency (critical→urgent→normal), then created_at DESC
- Fulfillment: atomic increment of `fulfilled_bags` with row-level lock; auto-closes when fulfilled >= bags

## Badge Thresholds (auto-awarded)

| Donations | Badge |
|---|---|
| 1 | First Drop |
| 5 | Lifesaver |
| 10 | Hero |
| 25 | Guardian |
| 50 | Legend |
| 100 | Blood Champion |

Badges are auto-awarded by `RefreshDonationStats` whenever donation count changes (new history, approved claim, fulfilled request).

## Donor Passport

- Passport number format: `ADK-YYYY-NNNNNN` (year + 6-digit sequential)
- QR token: 64-char hex string (random, embedded in URL path)
- One passport per user (UNIQUE constraint on user_id)
- Passport can be renewed (updates `last_renewed_at`)
- Initial issuance sets `national_donor_id` on the user record

## Donation Claims

| Status | Meaning |
|---|---|
| `pending` | Default on creation; editable, cancelable |
| `approved` | Admin/PMI approved; triggers `RefreshDonationStats` (does NOT auto-create donor_history — manual reconciliation prevents duplicates) |
| `rejected` | Admin/PMI rejected; rejection_reason required |

- Only pending claims can be updated or cancelled
- Approved claims call `RefreshDonationStats` (recalculates donor totals)

## Verification Levels

| Level | Name | Description |
|---|---|---|
| 0 | None | Default; no verification |
| 1 | Self Report | Donor self-reports data |
| 2 | Community Verified | Community admin confirms |
| 3 | PMI Verified | Official PMI verification |

- Approval of a verification request auto-updates the user's `verification_level`
- Cannot submit duplicate pending request for same level

## Trust Score

5 components, calculated on-the-fly:

| Component | Weight | Description |
|---|---|---|
| Donation Count | 30% | Based on total_donations vs max (scored 0-100) |
| Verification Level | 30% | 0→0, 1→30, 2→60, 3→100 |
| Claim Accuracy | 20% | Ratio of approved claims to total claims |
| Profile Complete | 10% | Percentage of filled profile fields |
| Account Age | 10% | Years since created_at (capped at 5) |

Overall = weighted average, stored in `users.trust_score` (DECIMAL 5,2).

## Password Rules

- Min length: 6 characters
- Hashing: bcrypt (DefaultCost)

## Token Rules

| Token | TTL | Default |
|---|---|---|
| Access Token | Configurable | 15 minutes |
| Refresh Token | Configurable | 7 days |

- Refresh token rotation: old token deleted on use, new pair issued
- Refresh token stored as SHA-256 hash in DB
- Logout deletes all refresh tokens for the user

## User Roles

| Role | Allowed Actions |
|---|---|
| `donor` | All authenticated + verified-email endpoints |
| `super_admin` | All donor actions + admin endpoints + PMI review |
| `pmi_admin` | PMI review queue (claims, verifications, analytics) |
| `community_admin` | Schema-only; no specific routes enforced |
| `hospital_admin` | Schema-only; no specific routes enforced |

## Privacy Rules

- Public portfolio (`/u/:username`) excludes phone number and email
- Search results (`GET /donors`) include phone numbers but endpoint is now auth-gated (JWT required since the fix)
- Rhesus NOT shown in UI at all (removed from all frontend files)
- Navigation paths in bottom-nav show all links for logged-in users

## Unverified User Restrictions

Unverified users (email not verified) can only access:
- GET /api/v1/auth/me
- PUT /api/v1/auth/me
- POST /api/v1/auth/logout
- POST /api/v1/auth/resend-verification
- PUT /api/v1/auth/change-password

Frontend also blocks: /search, /requests, /requests/new, /requests/share/[id] with redirect to verify-email page.
