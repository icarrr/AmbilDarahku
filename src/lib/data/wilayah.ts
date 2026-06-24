import * as fs from "fs";
import * as path from "path";

type WilayahItem = { id: string; JENIS: number; DESKRIPSI: string };

let _cache: WilayahItem[] | null = null;
let _codeMap: Map<string, string> | null = null;

function load(): WilayahItem[] {
  if (_cache) return _cache;
  const filePath = path.resolve(process.cwd(), "public/data/wilayah.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  _cache = JSON.parse(raw);
  return _cache as WilayahItem[];
}

function codeMap(): Map<string, string> {
  if (_codeMap) return _codeMap;
  _codeMap = new Map();
  for (const item of load()) {
    _codeMap.set(item.id, item.DESKRIPSI);
  }
  return _codeMap;
}

/** Resolve a wilayah code to its display name (title-cased). Returns code itself if not found. */
export function lookupName(code: string): string {
  const name = codeMap().get(code);
  if (!name) return code;
  return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve multiple codes at once. */
export function lookupNames(codes: string[]): string[] {
  return codes.map(lookupName);
}

/** Given a partial name (e.g. "Makassar"), find wilayah items that match case-insensitively. */
export function searchWilayah(query: string, jenis?: number): { id: string; name: string }[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  const items = load();
  let results = items.filter(
    (w) =>
      w.DESKRIPSI.toLowerCase().includes(lower) &&
      (jenis === undefined || w.JENIS === jenis)
  );
  return results.map((w) => ({
    id: w.id,
    name: w.DESKRIPSI.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

/** Get all provinces (JENIS=1). */
export function getProvinces(): { code: string; name: string }[] {
  return load()
    .filter((w) => w.JENIS === 1)
    .map((w) => ({
      code: w.id,
      name: w.DESKRIPSI.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
}

/** Get regencies under a province code prefix. */
export function getRegencies(provCode: string): { code: string; name: string }[] {
  return load()
    .filter((w) => w.JENIS === 2 && w.id.startsWith(provCode))
    .map((w) => ({
      code: w.id,
      name: w.DESKRIPSI.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
}

/** Get districts under a regency code prefix. */
export function getDistricts(regencyCode: string): { code: string; name: string }[] {
  return load()
    .filter((w) => w.JENIS === 3 && w.id.startsWith(regencyCode))
    .map((w) => ({
      code: w.id,
      name: w.DESKRIPSI.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
}
