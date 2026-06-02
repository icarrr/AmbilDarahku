# API — AmbilDarahku (v3.0)

Base URL: `/api/v1`

## Common Response Structure

**Success**: `{ "user": {...}, "badges": [...], "requests": [...], "donors": [...], "leaderboard": [...], "message": "..." }`
**Error**: `{ "error": "description" }`

---

## Public Endpoints (no auth)

### Health
```
GET /api/v1/health → { "status": "ok" }
```

### Stats
```
GET /api/v1/stats → { "active_donors": N, "lives_saved": N, "partner_hospitals": 450, "cities_reached": N }
```

### Auth
```
POST /api/v1/auth/register
{ "full_name", "phone", "email", "password", "date_of_birth", "gender", "blood_type", "weight_kg", "height_cm", "province", "city", "district" }
→ 201 { "user": {...}, "access_token": "...", "refresh_token": "..." }
```
Note: Register no longer includes rhesus (defaults to "+"), latitude, or longitude.

```
POST /api/v1/auth/login
{ "email", "password" }
→ 200 { "user": {...}, "access_token": "...", "refresh_token": "..." }

POST /api/v1/auth/refresh
{ "refresh_token": "..." }
→ 200 { "user": {...}, "access_token": "...", "refresh_token": "..." } (old token rotated)

POST /api/v1/auth/verify-email
{ "token": "..." }
→ 200 { "user": {...}, "access_token": "...", "refresh_token": "..." }

POST /api/v1/auth/forgot-password
{ "email": "..." } → 200 { "message": "..." } (1-min rate limit)

POST /api/v1/auth/reset-password
{ "token": "...", "new_password": "..." } → 200 { "message": "..." }
```

### Public Profiles & Data
```
GET /api/v1/u/:username
→ { "full_name", "blood_type", "city", "total_donations", "donation_volume_total", "verification_level", "national_donor_id", "badges": [...] }

GET /api/v1/requests?blood_type=O&urgency=critical&limit=10
→ { "requests": [{ patient_name, hospital, blood_type, urgency, city, contact_phone, ... }] }

GET /api/v1/requests/:id → { "request": {...}, "fulfillments": [...] }

GET /api/v1/requests/:id/fulfillments → { "fulfillments": [{ donor_name, bags, ... }] }

GET /api/v1/leaderboard/national → { "leaderboard": [top 100] }
GET /api/v1/leaderboard/regional?city=Bandung → { "leaderboard": [top 50] }

GET /api/v1/events → { "events": [upcoming/ongoing] }

GET /api/v1/passport/verify/:token → { "valid": true, "passport_number": "...", "full_name": "...", "blood_type": "..." }
GET /api/v1/passport/:username → { "passport": {...}, "user": {...}, "badges": [...] }

GET /api/v1/timeline/:username?limit=20&offset=0
→ { "entries": [{ "type": "donation"|"badge", "title": "...", "description": "...", "date": "..." }] }

GET /api/v1/recognition/:username
→ { "user": {...}, "badges": [...], "titles": [...], "passport": {...} }

GET /api/v1/trust-score/:username → { "trust_score": N, "breakdown": {...} }
```

### Donor Search
```
GET /api/v1/donors?blood_type=A&city=Jakarta&availability_status=available&compatible_with=O&lat=-6.2&lng=106.8&radius=10
```
**Auth required** (JWT). Returns donors with `button_state` (enabled/disabled) and `reason_if_disabled`.
Sorted by distance (haversine). Query params all optional.

---

## Authenticated Endpoints (JWT required)

```
GET /api/v1/auth/me → { "user": {...}, "badges": [...] }
PUT /api/v1/auth/me → { "user": {...} }  (partial update, all fields optional)
POST /api/v1/auth/logout → { "message": "logged out successfully" }
POST /api/v1/auth/resend-verification → { "message": "..." }
PUT /api/v1/auth/change-password → { "message": "..." }
  { "current_password", "new_password" }
```

---

## Verified-Email Endpoints (JWT + email_verified)

### Donor History
```
GET /api/v1/donor-history → { "histories": [...] }
POST /api/v1/donor-history
  { "donation_date", "location", "institution", "bags", "notes", "proof_photo", "proof_card", "proof_letter" }
PUT /api/v1/donor-history/:id → { "history": {...} } (updates proof_photo)
```

### Blood Requests
```
POST /api/v1/requests
  { "patient_name", "hospital", "blood_type", "bags", "urgency", "city", "contact_phone", "notes" }
  (rhesus defaults to "+")

GET /api/v1/requests/mine → { "requests": [...] }
PUT /api/v1/requests/:id/status → { "request": {...} }  ({ "status": "cancelled"|"fulfilled" })

POST /api/v1/requests/:id/fulfill → { "success": true, "history": {...} }
  (auto-creates verified donor history, duplicate-date guard)
```

### Donor Status
```
GET /api/v1/donor-status → { "eligibility_status", "last_donation_date", "search_priority", "availability_mode/status", "reasons": [...] }
PUT /api/v1/donor-status → { "donor_status": {...} }
  { "availability_mode": "manual", "availability_status": "temporarily_unavailable", "ready_again_date", "unavailable_reason" }
```

### Passport
```
GET /api/v1/passport → { "passport": {...}, "user": {...}, "badges": [...] }
POST /api/v1/passport/request → { "passport": {...} } (creates passport, sets national_donor_id)
POST /api/v1/passport/renew → { "passport": {...} } (updates last_renewed_at)
```

### Donation Claims
```
GET /api/v1/claims → { "claims": [...] }
GET /api/v1/claims/:id → { "claim": {...} }
POST /api/v1/claims
  { "donation_date", "location", "institution_name", "blood_type", "volume_ml", "proof_photo_url", "proof_document_url", "additional_notes" }
PUT /api/v1/claims/:id (only pending) → { "claim": {...} }
DELETE /api/v1/claims/:id (only pending) → { "message": "..." }
```

### Donor Verification
```
GET /api/v1/donor-verification → { "current_level": N, "max_level": 3, "history": [...] }
POST /api/v1/donor-verification → { "verification": {...} }
  { "level": 2, "verifier_role": "community", "notes": "..." }
```

### Timeline
```
GET /api/v1/timeline?limit=20&offset=0 → { "entries": [...] }
```

### Recognition
```
GET /api/v1/recognition → { "user": {...}, "badges": [...], "titles": [...], "passport": {...} }
```

### Trust Score
```
GET /api/v1/trust-score → { "trust_score": N, "breakdown": {...} }
POST /api/v1/trust-score/refresh → { "trust_score": N, "breakdown": {...} }
```

---

## Admin Endpoints (super_admin)

```
GET /api/v1/admin/users → { "users": [...] }
PUT /api/v1/admin/users/:id/role → { "user": {...} }  ({ "role": "donor"|"super_admin"|... })

POST /api/v1/events → { "event": {...} }
  { "title", "location", "city", "event_date", "start_time", "end_time", "description", "organizer", "contact_phone", "quota", "banner_url" }

GET /api/v1/admin/awards → { "awards": [...] }
POST /api/v1/admin/awards → { "award": {...} }
  { "name", "description", "award_type": "title"|"badge"|"certificate", "criteria": {...}, "scope": "national"|"regional"|"city", "scope_value": "..." }
PUT /api/v1/admin/awards/:id → { "award": {...} }
DELETE /api/v1/admin/awards/:id → { "message": "..." }

POST /api/v1/admin/titles → { "title": {...} }
  { "user_id", "title": "...", "description": "..." }
GET /api/v1/admin/titles → { "titles": [...] }
```

---

## PMI Review Endpoints (super_admin OR pmi_admin)

```
GET /api/v1/admin/stats → { "pending_claims": N, "pending_verifications": N, "total_users": N, "total_donors": N, "total_donations": N }

GET /api/v1/admin/claims → { "claims": [{ user details, claim details, ... }] }
GET /api/v1/admin/claims/:id → { full claim with user info }

PUT /api/v1/admin/claims/:id/review → { "claim": {...} }
  { "status": "approved"|"rejected", "rejection_reason": "..." }

GET /api/v1/admin/verifications → { "verifications": [{ user details, ... }] }
PUT /api/v1/admin/verifications/:id/review → { "verification": {...} }
  { "status": "approved"|"rejected", "notes": "..." }

GET /api/v1/admin/analytics/institutions → { "institutions": [top 20] }
GET /api/v1/admin/analytics/cities → { "cities": [top 20] }
GET /api/v1/admin/analytics/years → { "years": [yearly counts] }
GET /api/v1/admin/analytics/months → { "months": [last 12 months] }
GET /api/v1/admin/analytics/age → { "buckets": [{ "range": "17-20", "count": N }, ...] }
GET /api/v1/admin/analytics/top-donors → { "donors": [top 10] }
```
