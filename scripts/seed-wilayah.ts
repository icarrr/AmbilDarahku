import "dotenv/config";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

interface WilayahItem {
  id: string;
  JENIS: number;
  DESKRIPSI: string;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

async function seedWilayah() {
  console.log("reading wilayah.json...");
  const filePath = path.resolve(__dirname, "../public/data/wilayah.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const items: WilayahItem[] = JSON.parse(raw);

  console.log(`inserting ${items.length} wilayah rows...`);

  // Batch insert 1000 at a time
  const BATCH = 1000;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const placeholders = batch
      .map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`)
      .join(", ");
    const values = batch.flatMap((w) => [w.id, titleCase(w.DESKRIPSI), w.JENIS]);
    await pool.query(
      `INSERT INTO wilayah_regions (code, name, jenis) VALUES ${placeholders} ON CONFLICT (code) DO NOTHING`,
      values
    );
  }

  console.log("wilayah seeded. migrating existing user strings to codes...");

  // Migrate province: match by name
  const provResult = await pool.query(`
    UPDATE users u
    SET province = w.code
    FROM wilayah_regions w
    WHERE w.jenis = 1
      AND UPPER(TRIM(u.province)) = UPPER(TRIM(w.name))
      AND u.province IS NOT NULL
      AND u.province != ''
      AND u.province !~ '^\\d+$'
  `);
  console.log(`  provinces matched: ${provResult.rowCount}`);

  // Migrate city/regency: match by name
  const cityResult = await pool.query(`
    UPDATE users u
    SET city = w.code
    FROM wilayah_regions w
    WHERE w.jenis = 2
      AND UPPER(TRIM(u.city)) = UPPER(TRIM(w.name))
      AND u.city IS NOT NULL
      AND u.city != ''
      AND u.city !~ '^\\d+$'
  `);
  console.log(`  cities matched: ${cityResult.rowCount}`);

  // Migrate district: match by name
  const districtResult = await pool.query(`
    UPDATE users u
    SET district = w.code
    FROM wilayah_regions w
    WHERE w.jenis = 3
      AND UPPER(TRIM(u.district)) = UPPER(TRIM(w.name))
      AND u.district IS NOT NULL
      AND u.district != ''
      AND u.district !~ '^\\d+$'
  `);
  console.log(`  districts matched: ${districtResult.rowCount}`);

  console.log("seed-wilayah complete");
  await pool.end();
}

seedWilayah().catch((err) => {
  console.error("seed-wilayah failed:", err);
  process.exit(1);
});
