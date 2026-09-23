// Self-check: privacy sanitizers never leak private fields to public clients.
// Run: npx tsx scripts/test-privacy.ts  (or npm run typecheck)
import assert from "node:assert";
import {
  toPublicUser,
  toPublicRequest,
  toPublicEvent,
  PUBLIC_USER_FIELDS,
  PUBLIC_BLOOD_REQUEST_FIELDS,
  PUBLIC_EVENT_FIELDS,
} from "../src/lib/privacy";
import { signBlobPath, verifyBlobSig } from "../src/lib/file-sign";

const donor = {
  id: "d1",
  full_name: "Budi",
  phone: "08123456789",
  email: "b@x.id",
  password_hash: "hash",
  address: "Jl. Rahasia 1",
  nik: "7301010101000001",
  date_of_birth: "1990-01-01",
  weight_kg: 70,
  height_cm: 170,
  blood_type: "O",
  city: "73.01",
  contact_consent: true,
  avatar_url: null,
};

const pubUser = toPublicUser(donor as any);
for (const field of ["phone", "email", "password_hash", "address", "nik", "date_of_birth", "weight_kg", "height_cm"]) {
  assert.ok(!(field in pubUser), `public user must not contain ${field}`);
}
// every allowlisted field that exists on the source row must be present
for (const field of PUBLIC_USER_FIELDS) {
  if (field in donor) assert.ok(field in pubUser, `public user must keep ${field}`);
}
assert.strictEqual(pubUser.full_name, "Budi");
assert.strictEqual(pubUser.contact_consent, true);

const req = {
  id: "r1",
  requester_id: "u1",
  patient_name: "Pasien",
  contact_phone: "08111111111",
  hospital: "RS X",
  blood_type: "O",
  bags: 2,
  city: "Jakarta",
  created_at: "2026-01-01T00:00:00Z",
};
const pubReq = toPublicRequest(req as any);
assert.ok(!("contact_phone" in pubReq), "public request must not contain contact_phone");
assert.ok(!("requester_id" in pubReq), "public request must not contain requester_id");
for (const field of PUBLIC_BLOOD_REQUEST_FIELDS) {
  if (field in req) assert.ok(field in pubReq, `public request must keep ${field}`);
}

const ev = {
  id: "e1",
  title: "Donor PMI",
  contact_phone: "08122222222",
  organizer: "PMI",
  event_date: "2026-02-01",
};
const pubEv = toPublicEvent(ev as any);
assert.ok(!("contact_phone" in pubEv), "public event must not contain contact_phone");

// file signatures
const signed = signBlobPath("uploads/abc.jpg");
assert.ok(signed.startsWith("/api/v1/files?url=") && signed.includes("&sig="));
assert.strictEqual(verifyBlobSig("uploads/abc.jpg", signed.split("sig=")[1]), true);
assert.strictEqual(verifyBlobSig("uploads/abc.jpg", "deadbeef"), false);

console.log("privacy self-check: OK");