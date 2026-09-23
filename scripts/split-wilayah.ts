// Regenerates all wilayah data from the new (valid) source:
//   public/data/raw/{provinces,regencies,districts}.json
//   (yusufsyaifudin/wilayah-indonesia @ 54c4f4003292c39e5033ccc3b4df886bafa42046)
//
// Outputs (same {id, JENIS, DESKRIPSI} shape — server lib + seed-wilayah unchanged):
//   public/data/wilayah.json                 — merged (server: lookupName/searchWilayah)
//   public/data/provinces.json               — client lazy-load
//   public/data/regencies/{provId}.json      — client lazy-load
//   public/data/districts/{regencyId}.json   — client lazy-load
//
// Also (first run only, while old invalid wilayah.json still exists) writes
//   scripts/data/wilayah-code-map.json       — old→new code maps for
//   scripts/migrate-wilayah-codes.ts         — DB migration of users.province/city/district
//
// Run: npx tsx scripts/split-wilayah.ts

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import path from "path";

type OldItem = { id: string; JENIS: number; DESKRIPSI: string };
type NewItem = { id: string; name: string; province_id?: string; regency_id?: string };

const ROOT = path.resolve(process.cwd());
const dataDir = path.join(ROOT, "public/data");
const rawDir = path.join(dataDir, "raw");
const mapDir = path.join(ROOT, "scripts/data");
const mapFile = path.join(mapDir, "wilayah-code-map.json");

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v));

// Match key: uppercase, strip admin prefixes, drop spaces/punctuation.
function key2(s: string): string {
  return s
    .toUpperCase()
    .replace(/^ADM\.\s*/, "")
    .replace(/^(KAB\.|KABUPATEN|KOTA|KEC\.|KECAMATAN)\s+/, "")
    .replace(/[^A-Z0-9]/g, "");
}

function toOld(items: NewItem[], jenis: number): OldItem[] {
  return items.map((x) => ({ id: x.id, JENIS: jenis, DESKRIPSI: x.name }));
}

// ---- 1. Load new source ----
const newProvinces = readJson<NewItem[]>(path.join(rawDir, "provinces.json"));
const newRegencies = readJson<NewItem[]>(path.join(rawDir, "regencies.json"));
const newDistricts = readJson<NewItem[]>(path.join(rawDir, "districts.json"));
console.log(`new source: provinces=${newProvinces.length} regencies=${newRegencies.length} districts=${newDistricts.length}`);

// ---- 2. Build old→new maps (only while old invalid file exists) ----
const oldPath = path.join(dataDir, "wilayah.json");
if (existsSync(oldPath) && !existsSync(mapFile)) {
  const old = readJson<OldItem[]>(oldPath);
  const oldDistricts = old.filter((w) => w.JENIS === 3);

  // Old district ids are 6-digit, new are 7 (regency_id + 3) → old format marker
  const isOldFormat = oldDistricts.length > 0 && oldDistricts.some((d) => d.id.length !== newDistricts[0].id.length);

  if (isOldFormat) {
    const newProvByKey = new Map(newProvinces.map((p) => [key2(p.name), p.id]));
    const provMap: Record<string, string> = {};
    const provNameMap: Record<string, string> = {};
    for (const p of old.filter((w) => w.JENIS === 1)) {
      const hit = newProvByKey.get(key2(p.DESKRIPSI));
      if (hit) {
        provMap[p.id] = hit;
        provNameMap[key2(p.DESKRIPSI)] = hit;
      }
    }

    // Regency: scope candidates to mapped province, then global name fallback
    const provIdToNew = provMap;
    const regByKeyGlobal = new Map<string, string>();
    for (const r of newRegencies) {
      const k = key2(r.name);
      if (!regByKeyGlobal.has(k)) regByKeyGlobal.set(k, r.id);
    }
    const regByKeyByProv = new Map<string, Map<string, string>>();
    for (const r of newRegencies) {
      if (!r.province_id) continue;
      if (!regByKeyByProv.has(r.province_id)) regByKeyByProv.set(r.province_id, new Map());
      const k = key2(r.name);
      const m = regByKeyByProv.get(r.province_id)!;
      if (!m.has(k)) m.set(k, r.id);
    }
    const regMap: Record<string, string> = {};
    const regNameMap: Record<string, string> = {};
    for (const r of old.filter((w) => w.JENIS === 2)) {
      const oldProv = r.id.slice(0, 2);
      const newProv = provIdToNew[oldProv];
      const k = key2(r.DESKRIPSI);
      const hit = (newProv && regByKeyByProv.get(newProv)?.get(k)) || regByKeyGlobal.get(k);
      if (hit) {
        regMap[r.id] = hit;
        regNameMap[k] = hit;
      }
    }

    // District: scope candidates to mapped regency, then global name fallback
    const distByKeyGlobal = new Map<string, string>();
    for (const d of newDistricts) {
      const k = key2(d.name);
      if (!distByKeyGlobal.has(k)) distByKeyGlobal.set(k, d.id);
    }
    const distByKeyByReg = new Map<string, Map<string, string>>();
    for (const d of newDistricts) {
      if (!d.regency_id) continue;
      if (!distByKeyByReg.has(d.regency_id)) distByKeyByReg.set(d.regency_id, new Map());
      const k = key2(d.name);
      const m = distByKeyByReg.get(d.regency_id)!;
      if (!m.has(k)) m.set(k, d.id);
    }
    const distMap: Record<string, string> = {};
    const distNameMap: Record<string, string> = {};
    for (const d of oldDistricts) {
      const oldReg = d.id.slice(0, 4);
      const newReg = regMap[oldReg];
      const k = key2(d.DESKRIPSI);
      const hit = (newReg && distByKeyByReg.get(newReg)?.get(k)) || distByKeyGlobal.get(k);
      if (hit) {
        distMap[d.id] = hit;
        // First-wins for ambiguous global names — numeric exact map is authoritative
        if (!distNameMap[k]) distNameMap[k] = hit;
      }
    }

    mkdirSync(mapDir, { recursive: true });
    writeJson(mapFile, {
      province: provMap,
      city: regMap,
      district: distMap,
      provinceByName: provNameMap,
      cityByName: regNameMap,
      districtByName: distNameMap,
    });
    console.log(
      `code map written: provinces ${Object.keys(provMap).length}/` +
        `${old.filter((w) => w.JENIS === 1).length}, ` +
        `cities ${Object.keys(regMap).length}/${old.filter((w) => w.JENIS === 2).length}, ` +
        `districts ${Object.keys(distMap).length}/${oldDistricts.length}`
    );
  } else {
    console.log("old file already new-format — skipping code map");
  }
}

// ---- 3. Write merged wilayah.json (server lib + seed-wilayah shape) ----
const merged: OldItem[] = [
  ...toOld(newProvinces, 1),
  ...toOld(newRegencies, 2),
  ...toOld(newDistricts, 3),
];
writeJson(oldPath, merged);
console.log(`wilayah.json merged: ${merged.length}`);

// ---- 4. Write client split files ----
writeJson(path.join(dataDir, "provinces.json"), toOld(newProvinces, 1));

const regDir = path.join(dataDir, "regencies");
const distDir = path.join(dataDir, "districts");
rmSync(regDir, { recursive: true, force: true });
rmSync(distDir, { recursive: true, force: true });
mkdirSync(regDir, { recursive: true });
mkdirSync(distDir, { recursive: true });

for (const p of newProvinces) {
  writeJson(path.join(regDir, `${p.id}.json`), toOld(newRegencies.filter((r) => r.province_id === p.id), 2));
}
for (const r of newRegencies) {
  writeJson(path.join(distDir, `${r.id}.json`), toOld(newDistricts.filter((d) => d.regency_id === r.id), 3));
}
console.log(`split files written: regencyFiles=${newProvinces.length} districtFiles=${newRegencies.length}`);