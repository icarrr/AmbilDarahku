import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapedEvent } from "@/lib/event-discovery/types";
import {
  getDetectionKeywords,
  matchesKeywords,
  extractDate,
  isValidEvent,
} from "@/lib/event-discovery/validator";

const PROVINCES: Record<string, string> = {
  Aceh: "Aceh", "Sumatera Utara": "Sumatera Utara", "Sumatera Barat": "Sumatera Barat",
  Riau: "Riau", Jambi: "Jambi", "Sumatera Selatan": "Sumatera Selatan",
  Bengkulu: "Bengkulu", Lampung: "Lampung", "Bangka Belitung": "Kepulauan Bangka Belitung",
  "Kepulauan Riau": "Kepulauan Riau", "DKI Jakarta": "DKI Jakarta",
  "Jawa Barat": "Jawa Barat", "Jawa Tengah": "Jawa Tengah",
  "DI Yogyakarta": "Daerah Istimewa Yogyakarta", "Jawa Timur": "Jawa Timur",
  Banten: "Banten", Bali: "Bali", "Nusa Tenggara Barat": "Nusa Tenggara Barat",
  "Nusa Tenggara Timur": "Nusa Tenggara Timur",
  "Kalimantan Barat": "Kalimantan Barat", "Kalimantan Tengah": "Kalimantan Tengah",
  "Kalimantan Selatan": "Kalimantan Selatan", "Kalimantan Timur": "Kalimantan Timur",
  "Kalimantan Utara": "Kalimantan Utara",
  "Sulawesi Utara": "Sulawesi Utara", "Sulawesi Tengah": "Sulawesi Tengah",
  "Sulawesi Selatan": "Sulawesi Selatan", "Sulawesi Tenggara": "Sulawesi Tenggara",
  Gorontalo: "Gorontalo", "Sulawesi Barat": "Sulawesi Barat",
  Maluku: "Maluku", "Maluku Utara": "Maluku Utara",
  Papua: "Papua", "Papua Barat": "Papua Barat",
  "Papua Selatan": "Papua Selatan", "Papua Tengah": "Papua Tengah",
  "Papua Pegunungan": "Papua Pegunungan", "Papua Barat Daya": "Papua Barat Daya",
};

interface RowData {
  date: string;
  location: string;
  city: string;
  quota: number;
}

function parseTableRow($: cheerio.CheerioAPI, row: any): RowData | null {
  const cells = $(row).find("td");
  if (cells.length < 4) return null;

  const rawDate = $(cells[0]).text().trim();
  const nameCell = $(cells[1]).text().trim();
  const locationRaw = $(cells[2]).text().trim();
  const quotaRaw = $(cells[3]).text().trim();

  if (!rawDate || !nameCell) return null;

  const dateNormalized = rawDate
    .replace(/(\d{2})-(\d{2})-(\d{2,4})/, (_, d, m, y) => {
      const fullYear = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      return `${fullYear}-${m}-${d}`;
    });

  const eventDate = extractDate(dateNormalized);
  if (!eventDate) return null;

  const instMatch = nameCell.match(/^(.+?)(?:\s*\(|\s*-|\s*$)/);
  const instName = instMatch ? instMatch[1].trim() : nameCell.trim();

  const locParts = locationRaw.split(",").map(s => s.trim()).filter(Boolean);
  const city = locParts.length > 1 ? locParts[locParts.length - 1] : locParts[0] || "";

  const quota = parseInt(quotaRaw.replace(/[^0-9]/g, "")) || 50;

  return {
    date: eventDate,
    location: instName || locationRaw,
    city,
    quota,
  };
}

export async function scrapeAyodonor(
  provinceName: string,
  detectionKeywords: string[] | null
): Promise<ScrapedEvent[]> {
  const keywords = getDetectionKeywords(detectionKeywords);

  const provinceSlug = PROVINCES[provinceName];
  if (!provinceSlug) return [];

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const url = `https://ayodonor.pmi.or.id/?module=${y}-${m}-${d}&page=mobile&prov=${encodeURIComponent(provinceSlug)}`;

  let response;
  try {
    response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AmbilDarahkuBot/1.0; +https://ambildarahku.id)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err: any) {
    throw new Error(`fetch failed for ${provinceName}: ${err.message}`);
  }

  const html = response.data;
  if (typeof html !== "string") return [];

  const $ = cheerio.load(html);

  const textContent = $("body").text();
  if (!matchesKeywords(textContent, keywords)) return [];

  const table = $("table").first();
  if (!table.length) return [];

  const rows = table.find("tr");
  const results: ScrapedEvent[] = [];

  rows.each((_, row) => {
    const data = parseTableRow($, row);
    if (!data) return;

    const scraped: ScrapedEvent = {
      title: `Mobile Unit Donor Darah - ${data.location}`,
      description: `Donor darah mobile unit di ${data.location}, ${data.city}`,
      location: data.location,
      city: data.city,
      eventDate: data.date,
      startTime: "08:00",
      endTime: "16:00",
      organizer: "PMI",
      quota: data.quota,
      sourceUrl: url,
      sourceType: "ayodonor",
    };

    if (isValidEvent(scraped)) {
      results.push(scraped);
    }
  });

  return results;
}
