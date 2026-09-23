// Migrates users.province / users.city / users.district from the old invalid
// wilayah codes to the new valid codes (yusufsyaifudin/wilayah-indonesia).
// Reads scripts/data/wilayah-code-map.json (written by scripts/split-wilayah.ts).
// Also refreshes wilayah_regions table from the new public/data/wilayah.json.
//
// Run AFTER scripts/split-wilayah.ts:  npx tsx scripts/migrate-wilayah-codes.ts
// (also available as: npm run migrate:wilayah)

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

type OldItem = { id: string; JENIS: number; DESKRIPSI: string };
type CodeMap = {
  province: Record<string, string>;
  city: Record<string, string>;
  district: Record<string, string>;
  provinceByName: Record<string, string>;
  cityByName: Record<string, string>;
  districtByName: Record<string, string>;
};

function key2(s: string): string {
  return s
    .toUpperCase()
    .replace(/^ADM\.\s*/, "")
    .replace(/^(KAB\.|KABUPATEN|KOTA|KEC\.|KECAMATAN)\s+/, "")
    .replace(/[^A-Z0-9]/g, "");
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function remap(value: string | null, byCode: Record<string, string>, byName: Record<string, string>): string | null {
  if (!value) return value;
  // Legacy dotted code "73.01" -> "7301"
  const normalized = value.replace(/\./g, "");
  if (/^\d+$/.test(normalized)) {
    return byCode[normalized] ?? value; // unmapped numeric → keep original
  }
  return byName[key2(normalized)] ?? value;
}

async function migrateUsers(map: CodeMap) {
  const { rows } = await pool.query<{ id: string; province: string | null; city: string | null; district: string | null }>(
    "SELECT id, province, city, district FROM users"
  );

  let pChanged = 0, cChanged = 0, dChanged = 0, rowsChanged = 0;
  for (const r of rows) {
    const province = remap(r.province, map.province, map.provinceByName);
    const city = remap(r.city, map.city, map.cityByName);
    const district = remap(r.district, map.district, map.districtByName);
    if (province !== r.province || city !== r.city || district !== r.district) {
      await pool.query("UPDATE users SET province = $1, city = $2, district = $3, updated_at = NOW() WHERE id = $4", [
        province, city, district, r.id,
      ]);
      rowsChanged++;
      if (province !== r.province) pChanged++;
      if (city !== r.city) cChanged++;
      if (district !== r.district) dChanged++;
    }
  }
  console.log(`users updated: ${rowsChanged}/${rows.length} (province=${pChanged} city=${cChanged} district=${dChanged})`);
}

async function refreshWilayahRegions() {
  const items: OldItem[] = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "public/data/wilayah.json"), "utf-8")
  );

  await pool.query("DELETE FROM wilayah_regions");

  const BATCH = 1000;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const placeholders = batch.map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`).join(", ");
    const values = batch.flatMap((w) => [w.id, titleCase(w.DESKRIPSI), w.JENIS]);
    await pool.query(`INSERT INTO wilayah_regions (code, name, jenis) VALUES ${placeholders}`, values);
  }
  console.log(`wilayah_regions refreshed: ${items.length} rows`);
}

async function main() {
  const mapPath = path.resolve(process.cwd(), "scripts/data/wilayah-code-map.json");
  if (!fs.existsSync(mapPath)) {
    console.error("scripts/data/wilayah-code-map.json not found — run: npx tsx scripts/split-wilayah.ts first");
    process.exit(1);
  }
  const map: CodeMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));

  await migrateUsers(map);
  await refreshWilayahRegions();

  console.log("migrate-wilayah-codes complete");
  await pool.end();
}

main().catch((err) => {
  console.error("migrate-wilayah-codes failed:", err);
  process.exit(1);
});