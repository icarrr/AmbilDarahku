import { Pool } from "pg";
import axios from "axios";

const ANON_KEY = process.env.KS_ANON_KEY || "";
const CONCURRENCY = 5;

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

function parseBloodType(raw: string): { blood_type: string; rhesus: string } {
  const m = raw.match(/^(A|B|AB|O)([+-])$/);
  if (m) return { blood_type: m[1], rhesus: m[2] };
  return { blood_type: raw, rhesus: "+" };
}

function parseAmount(raw: string): number {
  const m = raw.match(/\d+/);
  return m ? parseInt(m[0], 10) : 1;
}

function mapStatus(apiStatus: string): string {
  if (apiStatus.toLowerCase() === "selesai") return "fulfilled";
  return "open";
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s-]/g, "");
  if (cleaned.startsWith("08") && cleaned.length >= 10) return `628${cleaned.slice(2)}`;
  if (cleaned.startsWith("62")) return cleaned;
  return cleaned;
}

function extractHospital(notes: string | null): string {
  if (!notes) return "";
  const m = notes.match(/dirawat di:\s*(.+)/i);
  if (m) return m[1].trim();
  const m2 = notes.match(/di\s+(?:RS[.\s]*|RSUD[.\s]*|Rumah Sakit[.\s]*)(.+)/i);
  if (m2) return `RS ${m2[1].trim()}`;
  return "";
}

export interface BloodRequestDiscoverResult {
  total: number;
  affected: number;
  errors: number;
  durationMs: number;
}

export async function discoverBloodRequests(): Promise<BloodRequestDiscoverResult> {
  const start = Date.now();
  const result: BloodRequestDiscoverResult = { total: 0, affected: 0, errors: 0, durationMs: 0 };

  const pool = getPool();

  try {
    // Fetch admin user ID for scraped records (requester_id is required for local requests
    // but we use an admin as stand-in for external scraped data)
    const { rows: adminRows } = await pool.query(
      `SELECT id FROM users WHERE role IN ('super_admin', 'admin') ORDER BY created_at ASC LIMIT 1`
    );
    const adminUserId = adminRows.length > 0 ? adminRows[0].id : null;

    // Full seed on first run, incremental for non-completed requests on subsequent runs
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM blood_requests");
    const baseUrl = "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/blood_requests?select=*";
    const apiUrl = countRows[0].cnt === 0
      ? baseUrl
      : `${baseUrl}&status=not.in.(selesai,Selesai)`;

    // Paginate through all rows (Supabase REST API caps at 1000 rows per request)
    const PAGE_SIZE = 1000;
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

      const res = await axios.get(apiUrl, { headers, timeout: 30000 });
      const data: any[] = res.data || [];
      allRecords.push(...data);

      if (offset === 0) {
        const contentRange: string = res.headers["content-range"] || "";
        const m = contentRange.match(/\/(\d+)$/);
        total = m ? parseInt(m[1], 10) : data.length;
      }
      offset += PAGE_SIZE;
    } while (offset < total);

    const records = allRecords;
    result.total = records.length;
    console.log(`Fetched ${records.length} blood requests from API (total in remote: ${total})`);

    for (let i = 0; i < records.length; i += CONCURRENCY) {
      const batch = records.slice(i, i + CONCURRENCY);
      const promises = batch.map(async (r) => {
        try {
          const { blood_type, rhesus } = parseBloodType(r.blood_type || "O+");
          const status = mapStatus(r.status || "");
          const hospital = extractHospital(r.notes);
          let city = "";
          if (r.notes) {
            const cityMatch = r.notes.match(/\bdi\s+(kota|kab\.?)\s+(\w+)/i);
            if (cityMatch) city = cityMatch[2];
          }

          const cols = [
            "patient_name", "blood_type", "rhesus", "bags", "status",
            "contact_phone", "notes", "hospital", "city", "urgency",
            "requester_id", "fulfilled_bags",
            "source_request_id", "source_type", "raw_data", "created_at",
          ];

          const values = [
            r.patient_name,
            blood_type,
            rhesus,
            parseAmount(r.amount),
            status,
            normalizePhone(r.contact_number || ""),
            r.notes || null,
            hospital,
            city,
            "normal",
            adminUserId,
            0,
            r.id,
            "kawan_sedarah",
            JSON.stringify(r),
            r.created_at || new Date().toISOString(),
          ];

          const setClause = `
            status = CASE
              WHEN blood_requests.status = 'fulfilled' THEN blood_requests.status
              ELSE EXCLUDED.status
            END,
            patient_name = EXCLUDED.patient_name,
            blood_type = EXCLUDED.blood_type,
            rhesus = EXCLUDED.rhesus,
            bags = EXCLUDED.bags,
            contact_phone = EXCLUDED.contact_phone,
            notes = EXCLUDED.notes,
            hospital = EXCLUDED.hospital,
            city = EXCLUDED.city,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()
          `;

          const placeholders = cols.map((_, j) => `$${j + 1}`).join(", ");
          const sql = `
            INSERT INTO blood_requests (${cols.join(", ")})
            VALUES (${placeholders})
            ON CONFLICT (source_type, source_request_id) WHERE source_request_id IS NOT NULL
            DO UPDATE SET ${setClause}
          `;

          const dbRes = await pool.query(sql, values);
          result.affected += dbRes.rowCount || 0;
        } catch (err: any) {
          console.error(`  ERROR processing blood request ${r.id}: ${err.message}`);
          result.errors++;
        }
      });

      await Promise.all(promises);
    }

    // Backfill: normalize existing phone numbers (idempotent, runs every cycle)
    await pool.query(`
      UPDATE blood_requests SET contact_phone =
        CASE
          WHEN contact_phone ~ '^08' THEN '628' || substring(contact_phone from 3)
          ELSE contact_phone
        END
      WHERE contact_phone ~ '^08'
    `);
    await pool.query(`
      UPDATE blood_requests SET contact_phone = regexp_replace(contact_phone, '[\s-]', '', 'g')
      WHERE contact_phone ~ '[\s-]'
    `);

    // Backfill: set created_at from raw_data for scraped records
    await pool.query(`
      UPDATE blood_requests SET created_at = (raw_data->>'created_at')::timestamptz
      WHERE source_type = 'kawan_sedarah'
        AND raw_data->>'created_at' IS NOT NULL
        AND created_at IS DISTINCT FROM (raw_data->>'created_at')::timestamptz
    `);

    console.log(`Done: ${result.total} total, ${result.affected} affected, ${result.errors} errors`);
  } finally {
    await pool.end();
  }

  result.durationMs = Date.now() - start;
  return result;
}
