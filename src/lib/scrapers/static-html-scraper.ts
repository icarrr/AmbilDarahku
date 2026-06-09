import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapedEvent } from "@/lib/event-discovery/types";
import {
  getDetectionKeywords,
  matchesKeywords,
  extractDate,
  extractTime,
  extractCity,
  isValidEvent,
} from "@/lib/event-discovery/validator";

const ALL_CITIES = [
  "Jakarta", "Bandung", "Surabaya", "Medan", "Makassar", "Denpasar",
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

const KNOWN_ORGANIZERS = [
  "PMI", "Palang Merah Indonesia", "UDD PMI", "Unit Donor Darah",
];

function identifyOrganizer(text: string): string | undefined {
  for (const org of KNOWN_ORGANIZERS) {
    if (text.includes(org)) return org;
  }
  return undefined;
}

function extractLocation(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  const locSelectors = [".location", ".alamat", ".venue", ".tempat", "[class*=location]", "[class*=alamat]"];
  for (const sel of locSelectors) {
    const el = $(sel, element).first();
    if (el.text().trim()) return el.text().trim();
  }
  return "";
}

interface ScraperConfig {
  containerSelector?: string;
  titleSelector?: string;
  dateSelector?: string;
  linkSelector?: string;
  contentSelector?: string;
}

export async function scrapeStaticHtml(
  url: string,
  config: ScraperConfig,
  detectionKeywords: string[] | null
): Promise<ScrapedEvent[]> {
  const keywords = getDetectionKeywords(detectionKeywords);
  const results: ScrapedEvent[] = [];

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
    throw new Error(`fetch failed: ${err.message}`);
  }

  const html = response.data;
  if (typeof html !== "string") return [];

  const $ = cheerio.load(html);

  const textContent = $("body").text();
  if (!matchesKeywords(textContent, keywords)) return [];

  const containerSel = config.containerSelector || "article, .post, .berita-item, .news-item, .kegiatan-item, [class*=berita], [class*=news], [class*=post], tr, .agenda-item";
  const containers = $(containerSel);

  if (containers.length === 0) {
    const event = tryParseFromBody($, url, keywords);
    if (event) results.push(event);
    return results;
  }

  containers.each((_, el) => {
    const element = $(el);
    const html = element.html() || "";
    const text = element.text();

    if (!matchesKeywords(text, keywords)) return;

    const titleSel = config.titleSelector || "h1, h2, h3, h4, .title, .judul, a[href]";
    let title = "";
    const titleEl = element.find(titleSel).first();
    if (titleEl.length) {
      title = titleEl.text().trim();
    }
    if (!title) title = text.split("\n")[0]?.trim() || "";
    if (!title || title.length < 5) return;

    const linkSel = config.linkSelector || "a[href]";
    const linkEl = element.find(linkSel).first();
    const href = linkEl.attr("href") || "";
    const sourceUrl = href.startsWith("http") ? href : href ? new URL(href, url).href : url;

    const dateText = text;
    let eventDate = extractDate(dateText);
    if (!eventDate && config.dateSelector) {
      const dateEl = element.find(config.dateSelector).first();
      if (dateEl.length) eventDate = extractDate(dateEl.text());
    }

    const time = extractTime(text) || "08:00";
    const city = extractCity(text, ALL_CITIES) || "";
    const location = extractLocation(element, $) || city;
    const organizer = identifyOrganizer(text);

    if (!eventDate) return;

    const scraped: ScrapedEvent = {
      title: title.slice(0, 255),
      description: text.slice(0, 1000),
      location: location.slice(0, 255) || city,
      city,
      eventDate,
      startTime: time,
      endTime: "16:00",
      organizer,
      sourceUrl,
      sourceType: "static_html",
      sourceId: href || undefined,
    };

    if (isValidEvent(scraped)) {
      results.push(scraped);
    }
  });

  return results;
}

function tryParseFromBody($: cheerio.CheerioAPI, url: string, keywords: string[]): ScrapedEvent | null {
  const text = $("body").text();
  if (!matchesKeywords(text, keywords)) return null;

  const title = $("h1").first().text().trim() || $("title").text().trim();
  if (!title) return null;

  const eventDate = extractDate(text);
  if (!eventDate) return null;

  const time = extractTime(text) || "08:00";
  const city = extractCity(text, ALL_CITIES) || "";

  return {
    title: title.slice(0, 255),
    description: text.slice(0, 1000),
    location: city,
    city,
    eventDate,
    startTime: time,
    endTime: "16:00",
    organizer: identifyOrganizer(text),
    sourceUrl: url,
    sourceType: "static_html",
  };
}
