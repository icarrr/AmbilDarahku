const DEFAULT_KEYWORDS = [
  "donor darah", "kegiatan donor", "aksi donor", "donor darah massal",
  "mobile unit", "blood donation", "blood drive", "ayo donor",
  "jadwal donor", "event donor", "donor bersama", "donor sukarela",
  "hari donor darah", "donor", "udd pmi",
];

export function getDetectionKeywords(sourceKeywords: string[] | null): string[] {
  if (sourceKeywords && sourceKeywords.length > 0) return sourceKeywords;
  return DEFAULT_KEYWORDS;
}

export function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

const INDONESIAN_DAY_NAMES = [
  "minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu",
];

const DATE_PATTERNS = [
  /(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i,
  /(\d{4})-(\d{2})-(\d{2})/,
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  /(\d{1,2})\s+-\s+(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i,
];

export function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    if (m.length === 4 && INDONESIAN_MONTHS[m[2]] !== undefined) {
      const day = parseInt(m[1]);
      const month = INDONESIAN_MONTHS[m[2]];
      const year = parseInt(m[3]);
      if (day >= 1 && day <= 31 && year >= 2024 && year <= 2030) {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
    if (m.length === 4 && m[2] && m[1] && m[3]) {
      const y = parseInt(m[1]), mo = parseInt(m[2]), d = parseInt(m[3]);
      if (y >= 2024 && y <= 2030 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    if (m.length === 4 && m[1] && m[2] && m[3]) {
      const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3]);
      if (y >= 2024 && y <= 2030 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    if (m.length === 5 && INDONESIAN_MONTHS[m[3]] !== undefined) {
      const d1 = parseInt(m[1]);
      const month = INDONESIAN_MONTHS[m[3]];
      const year = parseInt(m[4]);
      if (d1 >= 1 && d1 <= 31 && year >= 2024 && year <= 2030) {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(d1).padStart(2, "0")}`;
      }
    }
  }
  return null;
}

export function extractTime(text: string): string | null {
  const m = text.match(/(\d{1,2}):(\d{2})\s*(WIB|WITA|WIT)?/);
  if (m) {
    const h = parseInt(m[1]);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  return null;
}

export function extractCity(text: string, knownCities: string[]): string | null {
  const lower = text.toLowerCase();
  for (const city of knownCities) {
    const idx = lower.indexOf(city.toLowerCase());
    if (idx >= 0) return city;
  }
  return null;
}

export function isValidEvent(event: {
  title?: string;
  eventDate?: string | null;
  location?: string;
  city?: string;
}): boolean {
  if (!event.title || !event.eventDate || !event.location || !event.city) return false;
  const d = new Date(event.eventDate);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 2);
  if (d < now || d > maxFuture) return false;
  return true;
}
