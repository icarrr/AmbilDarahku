# API — AmbilDarahku

Base URL: `/api/v1`

## Common Response Structure

**Success**:
```json
{ "user": { ... }, "badges": [...] }
{ "requests": [...] }
{ "donors": [...] }
{ "leaderboard": [...] }
{ "message": "..." }
```

**Error**:
```json
{ "error": "description of error" }
```

## Public Endpoints (no auth)

### Health Check

```
GET /api/v1/health
```

Response: `{ "status": "ok" }`

### Register

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "6281234567890",
  "email": "john@example.com",
  "password": "password123",
  "date_of_birth": "1995-06-15T00:00:00Z",
  "gender": "male",
  "blood_type": "O",
  "rhesus": "+",
  "weight_kg": 70,
  "height_cm": 170,
  "province": "Jawa Barat",
  "city": "Bandung",
  "district": "Sumur Bandung",
  "latitude": -6.9147,
  "longitude": 107.6098
}
```

Response 201:
```json
{
  "user": { "id": "uuid", "full_name": "John Doe", "role": "donor", ... },
  "access_token": "eyJ...",
  "refresh_token": "abc123..."
}
```

- Unique email and phone required (409 on conflict)

### Login

```
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "john@example.com", "password": "password123" }
```

Response 200: Same structure as register
Response 401: `{ "error": "invalid email or password" }`

### Refresh Token

```
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refresh_token": "abc123..." }
```

Response 200: New `{ user, access_token, refresh_token }` (old token invalidated)

### Public Portfolio

```
GET /api/v1/u/:username
```

Response 200:
```json
{
  "full_name": "John Doe",
  "blood_type": "O",
  "rhesus": "+",
  "city": "Bandung",
  "total_donations": 12,
  "badges": [
    { "id": "uuid", "badge": { "name": "Hero", "description": "10 kali donor darah", "min_donations": 10 } }
  ]
}
```

Note: Phone number intentionally excluded from this endpoint.

### List Open Blood Requests

```
GET /api/v1/requests?blood_type=O&rhesus=+
```

Query params (optional): `blood_type`, `rhesus`

Response 200:
```json
{
  "requests": [
    {
      "id": "uuid",
      "patient_name": "Jane Doe",
      "hospital": "RS Harapan Kita",
      "blood_type": "O",
      "rhesus": "+",
      "bags": 2,
      "urgency": "critical",
      "latitude": -6.2,
      "longitude": 106.8,
      "city": "Jakarta",
      "contact_phone": "6281234567890",
      "notes": null,
      "status": "open",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

Sorted by: critical → urgent → normal, then by recency.

### Search Donors

```
GET /api/v1/donors?blood_type=A&rhesus=+&city=Jakarta
```

Query params (all optional): `blood_type`, `rhesus`, `city`, `availability_status` (default: "available")

Response 200:
```json
{
  "donors": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "phone": "6281234567890",
      "email": "john@example.com",
      "blood_type": "A",
      "rhesus": "+",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "latitude": -6.2,
      "longitude": 106.8,
      "total_donations": 10,
      "availability_status": "available",
      "eligibility_status": "eligible",
      ...
    }
  ]
}
```

Sorted by: `total_donations DESC`.

### Leaderboard

```
GET /api/v1/leaderboard/national
GET /api/v1/leaderboard/regional?city=Bandung
```

Regional requires `city` query param (400 otherwise).

Response 200:
```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "blood_type": "O",
      "rhesus": "+",
      "city": "Bandung",
      "total_donations": 50,
      "total_points": 5000,
      "last_donation_date": "2025-01-01T00:00:00Z"
    }
  ]
}
```

National: top 100; Regional: top 50. Ordered by `total_points DESC, total_donations DESC`.

---

## Authenticated Endpoints

Requires header: `Authorization: Bearer <access_token>`

### Get My Profile

```
GET /api/v1/auth/me
```

Response 200:
```json
{
  "user": { ... },
  "badges": [ ... ]
}
```

### Update My Profile

```
PUT /api/v1/auth/me
Content-Type: application/json

{
  "full_name": "John Updated",
  "phone": "6281234567890",
  "weight_kg": 72,
  "username": "john_updated",
  "avatar_url": "https://..."
}
```

All fields optional. Only provided fields are updated.

### Logout

```
POST /api/v1/auth/logout
```

Response 200: `{ "message": "logged out successfully" }`

Invalidates all refresh tokens for the user.

### Donor History

```
GET /api/v1/donor-history
```

Response 200: `{ "histories": [ { id, donation_date, location, institution, bags, verification_status, ... } ] }`

Ordered by `donation_date DESC`.

```
POST /api/v1/donor-history
Content-Type: application/json

{
  "donation_date": "2025-01-15",
  "location": "PMI Bandung",
  "institution": "PMI",
  "bags": 1,
  "notes": "Donor rutin",
  "proof_photo": "https://...",
  "proof_card": "https://...",
  "proof_letter": "https://..."
}
```

`verification_status` defaults to "pending".

### Blood Requests

```
POST /api/v1/requests
Content-Type: application/json

{
  "patient_name": "Jane Doe",
  "hospital": "RS Harapan Kita",
  "blood_type": "O",
  "rhesus": "+",
  "bags": 2,
  "urgency": "critical",
  "latitude": -6.2,
  "longitude": 106.8,
  "city": "Jakarta",
  "contact_phone": "6281234567890",
  "notes": "Segera"
}
```

```
GET /api/v1/requests/mine
```

Response: `{ "requests": [ ... ] }` — user's own requests, newest first.

```
PUT /api/v1/requests/:id/status
Content-Type: application/json

{ "status": "fulfilled" }
```

Valid statuses: `open`, `fulfilled`, `cancelled`.

### Donor Status

```
GET /api/v1/donor-status
```

Response:
```json
{
  "eligibility_status": "eligible",
  "last_donation_date": "2024-10-01T00:00:00Z",
  "search_priority": 1
}
```

```
PUT /api/v1/donor-status
Content-Type: application/json

{
  "availability_mode": "manual",
  "availability_status": "temporarily_unavailable",
  "ready_again_date": "2025-03-01",
  "unavailable_reason": "Sakit"
}
```

## Admin Endpoints

Requires `role = "super_admin"`.

```
GET /api/v1/admin/users
```

Response:
```json
{
  "users": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "6281234567890",
      "role": "donor",
      "blood_type": "O",
      "rhesus": "+",
      "city": "Bandung",
      "total_donations": 10,
      "eligibility_status": "eligible",
      "availability_status": "available",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

```
PUT /api/v1/admin/users/:id/role
Content-Type: application/json

{ "role": "community_admin" }
```

Valid roles: `donor`, `super_admin`, `community_admin`, `pmi_admin`, `hospital_admin`.
