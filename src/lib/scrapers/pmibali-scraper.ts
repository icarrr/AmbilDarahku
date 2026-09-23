import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import { ScrapedEvent } from "@/lib/event-discovery/types";
import {
  getDetectionKeywords,
  matchesKeywords,
  extractDate,
  extractCity,
  isValidEvent,
} from "@/lib/event-discovery/validator";

const ALL_CITIES = [
  "Denpasar", "Badung", "Gianyar", "Tabanan", "Klungkung",
  "Bangli", "Karangasem", "Buleleng", "Jembrana",
  "Jakarta", "Bandung", "Surabaya", "Medan", "Makassar",
  "Yogyakarta", "Semarang", "Palembang", "Tangerang", "Batam", "Bekasi",
  "Depok", "Bogor", "Malang", "Samarinda", "Balikpapan", "Pontianak",
  "Pekanbaru", "Manado", "Padang", "Bandar Lampung", "Ambon", "Jayapura",
  "Mataram", "Kupang", "Mamuju", "Palu", "Kendari", "Gorontalo",
  "Banjarmasin", "Banda Aceh", "Ternate", "Sorong", "Jambi", "Tarakan",
  "Cimahi", "Tasikmalaya", "Cilegon", "Serang", "Sukabumi", "Cirebon",
  "Kediri", "Madiun", "Mojokerto", "Pasuruan", "Probolinggo", "Salatiga",
  "Magelang", "Pekalongan", "Tegal", "Blitar", "Batu", "Pangkal Pinang",
  "Lubuklinggau", "Bengkulu", "Pagar Alam", "Prabumulih", "Dumai",
  "Sibolga", "Tanjungbalai", "Pematangsiantar", "Tebing Tinggi", "Binjai",
  "Padang Sidempuan", "Gunungsitoli", "Sungai Penuh", "Bau-Bau", "Palopo",
  "Parepare", "Bitung", "Tomohon", "Kotamobagu", "Tidore Kepulauan",
  "Subulussalam", "Lhokseumawe", "Langsa", "Sabang", "Sawahlunto",
  "Padang Panjang", "Bukittinggi", "Payakumbuh", "Solok", "Pariaman",
  "Metro", "Bontang", "Singkawang", "Palangka Raya", "Tanjung Pinang",
  "Tual", "Banjarbaru", "Prabumulih",
];

function contentHash(data: string): string {
  return crypto.createHash("md5").update(data).digest("hex").slice(0, 12);
}

function parseTimeRange(text: string): { start: string; end: string } {
  const m = text.match(/(\d{1,2}:\d{2})\s*[-–to]+\s*(\d{1,2}:\d{2})/i);
  if (m) return { start: m[1], end: m[2] };
  const single = text.match(/(\d{1,2}:\d{2})/);
  if (single) return { start: single[1], end: "16:00" };
  return { start: "08:00", end: "16:00" };
}

export async function scrapePmiBali(
  detectionKeywords: string[] | null,
): Promise<ScrapedEvent[]> {
  const keywords = getDetectionKeywords(detectionKeywords);
  let response;
  try {
    response = await axios.get("https://pmibali.online", {
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AmbilDarahkuBot/1.0; +https://ambildarahku.id)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err: any) {
    throw new Error(`fetch failed: ${err.message}`);
  }

  const html = response.data;
  if (typeof html !== "string") return [];

  const $ = cheerio.load(html);
  const bodyText = $("body").text();
  if (!matchesKeywords(bodyText, keywords)) return [];

  const results: ScrapedEvent[] = [];
  const tables = $("table");

  tables.each((_, table) => {
    const rows = $(table).find("tr");
    if (rows.length < 5) return;

    const firstRowCells = $(rows[0]).find("td, th").map((_, c) => $(c).text().trim().toLowerCase()).get();
    const hasScheduleHeader = firstRowCells.some(c =>
      ["tanggal", "hari", "jam", "tempat", "lokasi"].includes(c)
    );
    if (!hasScheduleHeader) return;

    for (let i = 1; i < rows.length; i++) {
      const cells = $(rows[i]).find("td").map((_, c) => $(c).text().trim()).get();
      if (cells.length < 4) continue;

      const [dateStr, dayName, timeStr, locationRaw] = cells;

      if (!dateStr || !locationRaw || locationRaw.length < 5) continue;

      const eventDate = extractDate(dateStr);
      if (!eventDate) continue;

      const title = locationRaw.slice(0, 255);
      const { start: startTime, end: endTime } = parseTimeRange(timeStr || "");
      const city = extractCity(locationRaw + " " + (dayName || ""), ALL_CITIES) || "Denpasar";
      const srcId = contentHash(`${eventDate}|${startTime}|${title}|${locationRaw}`);

      const event: ScrapedEvent = {
        title,
        description: `Jadwal donor darah PMI Bali: ${dayName || ""}, ${dateStr} pukul ${timeStr || ""}`.slice(0, 1000),
        location: locationRaw.slice(0, 255),
        city,
        eventDate,
        startTime,
        endTime,
        organizer: "PMI Bali",
        sourceUrl: "https://pmibali.online",
        sourceType: "pmi_bali",
        sourceId: srcId,
      };

      if (isValidEvent(event)) {
        results.push(event);
      }
    }
  });

  return results;
}
