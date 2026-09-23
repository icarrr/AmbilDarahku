// Shared server-side field allowlists for public API responses.
// Privacy rule: NEVER send phone/contact_phone/address/nik/email to public clients.
// Private fields are only added by authorized admin/owner endpoints.

export const PUBLIC_USER_FIELDS = [
  "id",
  "full_name",
  "username",
  "blood_type",
  "rhesus",
  "city",
  "province",
  "district",
  "avatar_url",
  "availability_status",
  "unavailable_reason",
  "eligibility_status",
  "ready_again_date",
  "total_donations",
  "total_points",
  "last_donation_date",
  "donation_volume_total",
  "verification_level",
  "trust_score",
  "national_donor_id",
  "gender",
  "created_at",
] as const;

export const PUBLIC_BLOOD_REQUEST_FIELDS = [
  "id",
  "patient_name",
  "hospital",
  "blood_type",
  "rhesus",
  "bags",
  "fulfilled_bags",
  "urgency",
  "city",
  "notes",
  "status",
  "created_at",
  "updated_at",
] as const;

export const PUBLIC_EVENT_FIELDS = [
  "id",
  "title",
  "description",
  "location",
  "city",
  "event_date",
  "start_time",
  "end_time",
  "organizer",
  "quota",
  "status",
  "poster_url",
  "is_archived",
  "created_at",
  "updated_at",
] as const;

const PRIVATE_USER_FIELDS = new Set(["phone", "email", "password_hash", "address", "nik", "date_of_birth", "weight_kg", "height_cm"]);

/** Filter any user row to public-only fields. */
export function toPublicUser<T extends Record<string, unknown>>(user: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const f of PUBLIC_USER_FIELDS) {
    if (f in user) out[f] = user[f];
  }
  return out as Partial<T>;
}

/** Filter any blood_request row to public-only fields (drops contact_phone). */
export function toPublicRequest<T extends Record<string, unknown>>(row: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const f of PUBLIC_BLOOD_REQUEST_FIELDS) {
    if (f in row) out[f] = row[f];
  }
  return out as Partial<T>;
}

/** Filter any event row to public-only fields (drops contact_phone). */
export function toPublicEvent<T extends Record<string, unknown>>(row: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const f of PUBLIC_EVENT_FIELDS) {
    if (f in row) out[f] = row[f];
  }
  return out as Partial<T>;
}

/** Internal (server/admin) full pick incl. phone/email, minus password only. */
export function stripPrivate(user: Record<string, unknown>): Record<string, unknown> {
  const { password_hash, ...rest } = user;
  return rest;
}

export function isPrivateField(field: string): boolean {
  return PRIVATE_USER_FIELDS.has(field);
}