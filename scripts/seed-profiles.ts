import { Pool } from "pg";
import axios from "axios";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";
import crypto from "crypto";

const PROFILES_API_URL =
  "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/profiles?select=*";
const DONORS_API_URL =
  "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/donors?select=*";
const ANON_KEY = process.env.KS_ANON_KEY || "";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function normalizePhone(raw: string | null): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08") && cleaned.length >= 10)
    return `628${cleaned.slice(2)}`;
  if (cleaned.startsWith("62")) return cleaned;
  return cleaned;
}

function parseBloodType(raw: string | null): {
  blood_type: string;
  rhesus: string;
} {
  if (!raw) return { blood_type: "O", rhesus: "+" };
  const m = raw.match(/^(A|B|AB|O)([+-])$/);
  if (m) return { blood_type: m[1], rhesus: m[2] };
  return { blood_type: raw, rhesus: "+" };
}

function mapGender(raw: string | null): string {
  if (raw === "Laki-laki") return "male";
  if (raw === "Perempuan") return "female";
  return raw || "male";
}

function isRealEmail(email: string | null): boolean {
  if (!email || email.trim() === "") return false;
  if (email.endsWith("@wa.kawansedarah.org")) return false;
  return true;
}

async function seedProfiles() {
  console.log("fetching profiles from API...");
  const res = await axios.get(PROFILES_API_URL, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Accept-Profile": "public",
    },
    timeout: 30000,
  });

  const profiles: any[] = res.data || [];
  console.log(`fetched ${profiles.length} profiles`);

  // Filter to real emails only
  const valid = profiles.filter((p) => isRealEmail(p.email));
  console.log(
    `  ${valid.length} have real email (${profiles.length - valid.length} skipped: no email or @wa.kawansedarah.org)`
  );

  // Pre-check existing emails in batch
  const emails = valid.map((p) => p.email!.toLowerCase().trim());
  const { rows: existing } = await pool.query(
    `SELECT LOWER(TRIM(email)) as email FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
    [emails]
  );
  const existingSet = new Set(existing.map((r: any) => r.email));

  const passwordHash = await bcrypt.hash("donor123", 12);

  let inserted = 0;
  let skipped = 0;

  for (const p of valid) {
    const email = p.email!.toLowerCase().trim();

    if (existingSet.has(email)) {
      skipped++;
      continue;
    }

    const { blood_type, rhesus } = parseBloodType(p.blood_type);
    const phone = normalizePhone(p.phone_number);
    const province = p.province_id ? String(p.province_id) : "";
    const city = p.regency_id ? String(p.regency_id) : "";
    const district = p.district_id ? String(p.district_id) : "";
    const gender = mapGender(p.gender);
    const total_donations = p.donation_count || p.total_donations || 0;

    try {
      await pool.query(
        `INSERT INTO users (email, full_name, phone, password_hash, role, blood_type, rhesus, province, city, district, gender, avatar_url, address, date_of_birth, weight_kg, height_cm, total_donations, last_donation_date, email_verified, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,60,165,$15,$16,true,NOW(),NOW())
         ON CONFLICT DO NOTHING`,
        [
          email,
          p.full_name || "Donor",
          phone,
          passwordHash,
          "donor",
          blood_type,
          rhesus,
          province,
          city,
          district,
          gender,
          p.avatar_url || null,
          p.address || null,
          null,
          total_donations,
          p.last_donation_date || null,
        ]
      );
      inserted++;
      existingSet.add(email); // prevent duplicate in same batch

      // Cache avatar to Vercel Blob to avoid rate limits on external URLs
      if (p.avatar_url && p.avatar_url.startsWith("http") && !p.avatar_url.includes("blob.vercel-storage.com")) {
        try {
          const imgRes = await axios.get(p.avatar_url, {
            responseType: "arraybuffer",
            timeout: 10000,
          });
          const buffer = Buffer.from(imgRes.data);
          const contentType = String(imgRes.headers["content-type"] || "image/jpeg");
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const blobPath = `avatars/${crypto.createHash("md5").update(email).digest("hex")}.${ext}`;
          const blob = await put(blobPath, buffer, { access: "private", contentType });
          await pool.query("UPDATE users SET avatar_url = $1 WHERE email = $2", [blob.url, email]);
        } catch {
          // avatar caching is optional — skip silently
        }
      }
    } catch (err: any) {
      console.error(`  ERROR inserting ${email}: ${err.message}`);
    }
  }

  console.log(`\nseed-profiles complete:`);
  console.log(`  total fetched: ${profiles.length}`);
  console.log(`  valid emails:  ${valid.length}`);
  console.log(`  inserted:      ${inserted}`);
  console.log(`  skipped:       ${skipped}`);

  // ── Donors ──────────────────────────────────────────
  console.log("\nfetching donors from API...");
  const donorRes = await axios.get(DONORS_API_URL, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Accept-Profile": "public",
    },
    timeout: 30000,
  });

  const donors: any[] = donorRes.data || [];
  console.log(`fetched ${donors.length} donors`);

  // Pre-check existing phones in batch
  const donorPhones = donors
    .map((d) => normalizePhone(d.phone))
    .filter(Boolean);
  const { rows: existingPhones } = await pool.query(
    `SELECT phone FROM users WHERE phone = ANY($1)`,
    [donorPhones]
  );
  const phoneSet = new Set(existingPhones.map((r: any) => r.phone));

  let donorsInserted = 0;
  let donorsSkipped = 0;

  for (const d of donors) {
    const phone = normalizePhone(d.phone);
    if (!phone || phone.length > 15) {
      donorsSkipped++;
      continue;
    }

    if (d.name && /\b(unit|komunitas|community|layanan|foundation)\b/i.test(d.name)) {
      donorsSkipped++;
      continue;
    }

    if (phoneSet.has(phone) || existingSet.has(`${phone}@donor.ambildarahku.id`)) {
      donorsSkipped++;
      continue;
    }

    const { blood_type, rhesus } = (() => {
      const bt = d.blood_type || "O";
      const rh = d.rhesus_type === "Positif" ? "+" : d.rhesus_type === "Negatif" ? "-" : "+";
      const m = bt.match(/^(A|B|AB|O)([+-])$/);
      if (m) return { blood_type: m[1], rhesus: m[2] };
      return { blood_type: bt, rhesus: rh };
    })();

    const city = d.regency_id ? String(d.regency_id) : "";
    const gender = mapGender(d.gender);
    const donorEmail = `${phone}@donor.ambildarahku.id`;

    try {
      await pool.query(
        `INSERT INTO users (email, full_name, phone, password_hash, role, blood_type, rhesus, province, city, district, gender, date_of_birth, weight_kg, height_cm, total_donations, last_donation_date, email_verified, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'','','',$8,null,60,165,$9,$10,true,NOW(),NOW())
         ON CONFLICT DO NOTHING`,
        [
          donorEmail,
          d.name || "Donor",
          phone,
          passwordHash,
          "donor",
          blood_type,
          rhesus,
          gender,
          d.donation_count || 0,
          d.last_donation_date || null,
        ]
      );
      donorsInserted++;
      phoneSet.add(phone);
      existingSet.add(donorEmail);
    } catch (err: any) {
      console.error(`  ERROR inserting donor ${phone}: ${err.message}`);
    }
  }

  console.log(`\nseed-donors complete:`);
  console.log(`  total fetched: ${donors.length}`);
  console.log(`  inserted:      ${donorsInserted}`);
  console.log(`  skipped:       ${donorsSkipped}`);

  await pool.end();
}

seedProfiles().catch((err) => {
  console.error("seed-profiles failed:", err);
  process.exit(1);
});
