import { Pool } from "pg";
import { scrapeStaticHtml } from "@/lib/scrapers/static-html-scraper";
import { scrapeAyodonor } from "@/lib/scrapers/ayodonor-scraper";
import { scrapePmiBali } from "@/lib/scrapers/pmibali-scraper";
import { SEED_SOURCES } from "@/lib/scrapers/source-registry";
import { ScrapedEvent, SourceConfig, DiscoverResult } from "@/lib/event-discovery/types";
import { filterNewEvents } from "@/lib/event-discovery/deduplicator";
import { archiveExpiredEvents } from "@/lib/event-discovery/archiver";

const CONCURRENCY = 5;
const PROVINCES_FOR_AYODONOR = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Bangka Belitung", "Kepulauan Riau",
  "DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Banten", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
  "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
  "Maluku", "Maluku Utara",
  "Papua", "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
];

function getPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

function toSourceConfig(row: any): SourceConfig {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    scraperConfig: typeof row.scraper_config === "string" ? JSON.parse(row.scraper_config) : row.scraper_config || {},
    detectionKeywords: row.detection_keywords || null,
    isActive: row.is_active,
  };
}

async function fetchSources(pool: Pool): Promise<SourceConfig[]> {
  const { rows } = await pool.query(
    "SELECT id, source_type, source_name, source_url, scraper_config, detection_keywords, is_active FROM event_sources WHERE is_active = true"
  );

  if (rows.length === 0) {
    console.log("No sources in DB, seeding defaults...");
    for (const s of SEED_SOURCES) {
      await pool.query(
        `INSERT INTO event_sources (source_type, source_name, source_url, scraper_config, detection_keywords, scrape_frequency_minutes)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [s.source_type, s.source_name, s.source_url, JSON.stringify(s.scraper_config), s.detection_keywords, s.scrape_frequency_minutes]
      );
    }
    const { rows: seeded } = await pool.query("SELECT id, source_type, source_name, source_url, scraper_config, detection_keywords, is_active FROM event_sources WHERE is_active = true");
    return seeded.map(toSourceConfig);
  }

  return rows.map(toSourceConfig);
}

async function scrapeSource(source: SourceConfig): Promise<{ events: ScrapedEvent[]; error?: string }> {
  try {
    if (source.sourceType === "ayodonor") {
      const all: ScrapedEvent[] = [];
      for (const province of PROVINCES_FOR_AYODONOR) {
        const events = await scrapeAyodonor(province, source.detectionKeywords);
        all.push(...events);
      }
      return { events: all };
    }

    if (source.sourceUrl === "https://pmibali.online") {
      const events = await scrapePmiBali(source.detectionKeywords);
      return { events };
    }

    if (source.sourceType === "pmi_national" || source.sourceType === "pmi_province" || source.sourceType === "pmi_city") {
      const events = await scrapeStaticHtml(source.sourceUrl, source.scraperConfig, source.detectionKeywords);
      return { events };
    }

    return { events: [] };
  } catch (err: any) {
    return { events: [], error: err.message };
  }
}

async function insertEvents(pool: Pool, events: ScrapedEvent[]): Promise<number> {
  if (events.length === 0) return 0;

  const cols = ["title", "description", "location", "city", "event_date", "start_time", "end_time",
    "organizer", "contact_phone", "quota", "source_url", "source_type", "source_id", "status"];

  const BATCH = 50;
  let total = 0;

  for (let i = 0; i < events.length; i += BATCH) {
    const batch = events.slice(i, i + BATCH);
    const placeholders = batch.map((_, j) =>
      `(${cols.map((_, k) => `$${j * cols.length + k + 1}`).join(", ")})`
    ).join(", ");
    const values = batch.flatMap(e => [
      e.title, e.description || null, e.location, e.city, e.eventDate, e.startTime, e.endTime,
      e.organizer || null, e.contactPhone || null, e.quota || 0,
      e.sourceUrl, e.sourceType, e.sourceId || null, "upcoming",
    ]);

    const sql = `INSERT INTO events (${cols.join(", ")}) VALUES ${placeholders} ON CONFLICT (source_type, source_id) WHERE source_id IS NOT NULL DO NOTHING`;
    const result = await pool.query(sql, values);
    total += result.rowCount || 0;
  }

  return total;
}

async function updateSourceScrapeStatus(pool: Pool, id: string, scrapedAt: Date, error?: string) {
  if (error) {
    await pool.query(
      "UPDATE event_sources SET last_scraped_at = $1, last_error = $2, updated_at = $1 WHERE id = $3",
      [scrapedAt, error.slice(0, 500), id]
    );
  } else {
    await pool.query(
      "UPDATE event_sources SET last_scraped_at = $1, last_error = NULL, updated_at = $1 WHERE id = $2",
      [scrapedAt, id]
    );
  }
}

export async function discoverEvents(): Promise<DiscoverResult> {
  const startTime = Date.now();
  const result: DiscoverResult = {
    totalSources: 0,
    totalScraped: 0,
    totalNew: 0,
    totalErrors: 0,
    archivedCount: 0,
    sources: [],
    durationMs: 0,
  };

  const pool = getPool();

  try {
    const sources = await fetchSources(pool);
    result.totalSources = sources.length;
    console.log(`Loaded ${sources.length} sources`);

    for (let i = 0; i < sources.length; i += CONCURRENCY) {
      const batch = sources.slice(i, i + CONCURRENCY);
      const promises = batch.map(async (source) => {
        const { events, error } = await scrapeSource(source);
        const scrapedAt = new Date();

        if (error) {
          console.error(`  ERROR [${source.sourceName}]: ${error}`);
          await updateSourceScrapeStatus(pool, source.id, scrapedAt, error);
          result.totalErrors++;
          result.sources.push({ name: source.sourceName, url: source.sourceUrl, found: 0, new: 0, error });
          return;
        }

        console.log(`  ${source.sourceName}: found ${events.length} events`);
        result.totalScraped += events.length;
        result.sources.push({ name: source.sourceName, url: source.sourceUrl, found: events.length, new: 0 });

        if (events.length === 0) {
          await updateSourceScrapeStatus(pool, source.id, scrapedAt);
          return;
        }

        const newEvents = await filterNewEvents(events);
        const inserted = await insertEvents(pool, newEvents);
        result.totalNew += inserted;
        result.sources[result.sources.length - 1].new = inserted;

        await updateSourceScrapeStatus(pool, source.id, scrapedAt);
      });

      await Promise.all(promises);
    }

    console.log("\nArchiving expired events...");
    result.archivedCount = await archiveExpiredEvents();
    console.log(`Archived ${result.archivedCount} events`);
  } finally {
    await pool.end();
  }

  result.durationMs = Date.now() - startTime;
  return result;
}
