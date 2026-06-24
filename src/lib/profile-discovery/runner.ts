import { Pool } from "pg";
import axios from "axios";
import bcrypt from "bcryptjs";

const PROFILES_API_URL =
  "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/profiles?select=*";
const DONORS_API_URL =
  "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/donors?select=*";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydW1idHNmcnF2bm1kcGV6bG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTY0MzYsImV4cCI6MjA5MjIzMjQzNn0.xrk5qWUbr4JoaPBW5NdJlqT3AyBHdTS9a4ifami3vuo";
const PAGE_SIZE = 1000;

export interface ProfileDiscoverResult {
  profilesFetched: number;
  profilesInserted: number;
  profilesSkipped: number;
  donorsFetched: number;
  donorsInserted: number;
  donorsSkipped: number;
  durationMs: number;
}

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

function normalizePhone(raw: string | null): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08") && cleaned.length >= 10) return `628${cleaned.slice(2)}`;
  if (cleaned.startsWith("62")) return cleaned;
  return cleaned;
}

function parseBloodType(raw: string | null): { blood_type: string; rhesus: string } {
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

/** Fetch paginated data from a Supabase REST API endpoint. */
async function fetchPaginated(url: string): Promise<any[]> {
  const allRecords: any[] = [];
  let total = 0;
  let offset = 0;

  do {
    const headers: Record<string, string> = {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Accept-Profile": "public",
    };
    if (offset === 0) {
      headers["Prefer"] = "count=exact";
    } else {
      headers["Range"] = `${offset}-${offset + PAGE_SIZE - 1}`;
    }

    const res = await axios.get(url, { headers, timeout: 30000 });
    const data: any[] = res.data || [];
    allRecords.push(...data);

    if (offset === 0) {
      const contentRange: string = res.headers["content-range"] || "";
      const m = contentRange.match(/\/(\d+)$/);
      total = m ? parseInt(m[1], 10) : data.length;
      console.log(`  remote total: ${total} rows`);
    }
    offset += PAGE_SIZE;
  } while (offset < total);

  return allRecords;
}

export async function discoverProfiles(): Promise<ProfileDiscoverResult> {
  const start = Date.now();
  const result: ProfileDiscoverResult = {
    profilesFetched: 0,
    profilesInserted: 0,
    profilesSkipped: 0,
    donorsFetched: 0,
    donorsInserted: 0,
    donorsSkipped: 0,
    durationMs: 0,
  };

  const pool = getPool();

  try {
    // ── Seed profiles (users with email) ──────────────────
    console.log("Fetching profiles from API...");
    const profiles = await fetchPaginated(PROFILES_API_URL);
    result.profilesFetched = profiles.length;

    const valid = profiles.filter((p) => isRealEmail(p.email));
    console.log(`  ${valid.length} have real email (${profiles.length - valid.length} skipped: no email or @wa.kawansedarah.org)`);

    // Pre-check existing emails in batch
    const emails = valid.map((p) => p.email!.toLowerCase().trim());
    const { rows: existing } = await pool.query(
      `SELECT LOWER(TRIM(email)) as email FROM users WHERE LOWER(TRIM(email)) = ANY($1)`,
      [emails]
    );
    const existingSet = new Set(existing.map((r: any) => r.email));

    const passwordHash = await bcrypt.hash("donor123", 12);

    for (const p of valid) {
      const email = p.email!.toLowerCase().trim();

      if (existingSet.has(email)) {
        result.profilesSkipped++;
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
        result.profilesInserted++;
        existingSet.add(email);
      } catch (err: any) {
        console.error(`  ERROR inserting profile ${email}: ${err.message}`);
      }
    }

    console.log(`Profiles: ${result.profilesFetched} fetched, ${result.profilesInserted} inserted, ${result.profilesSkipped} skipped`);

    // ── Seed donors (phone-only from Kawan Sedarah) ──────
    console.log("Fetching donors from API...");
    const donorRecords = await fetchPaginated(DONORS_API_URL);
    result.donorsFetched = donorRecords.length;

    // Pre-check existing phones in batch
    const donorPhones = donorRecords
      .map((d) => normalizePhone(d.phone))
      .filter(Boolean);
    const { rows: existingPhones } = await pool.query(
      `SELECT phone FROM users WHERE phone = ANY($1)`,
      [donorPhones]
    );
    const phoneSet = new Set(existingPhones.map((r: any) => r.phone));

    for (const d of donorRecords) {
      const phone = normalizePhone(d.phone);
      if (!phone || phone.length > 15) {
        result.donorsSkipped++;
        continue;
      }

      if (d.name && /\b(unit|komunitas|community|layanan|foundation)\b/i.test(d.name)) {
        result.donorsSkipped++;
        continue;
      }

      if (phoneSet.has(phone) || existingSet.has(`${phone}@donor.ambildarahku.id`)) {
        result.donorsSkipped++;
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
        result.donorsInserted++;
        phoneSet.add(phone);
        existingSet.add(donorEmail);
      } catch (err: any) {
        console.error(`  ERROR inserting donor ${phone}: ${err.message}`);
      }
    }

    console.log(`Donors: ${result.donorsFetched} fetched, ${result.donorsInserted} inserted, ${result.donorsSkipped} skipped`);
  } finally {
    await pool.end();
  }

  result.durationMs = Date.now() - start;
  return result;
}
