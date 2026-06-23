export interface SeedSource {
  source_type: string;
  source_name: string;
  source_url: string;
  scraper_config: Record<string, any>;
  detection_keywords: string[] | null;
  scrape_frequency_minutes: number;
}

export const SEED_SOURCES: SeedSource[] = [
  {
    source_type: "ayodonor",
    source_name: "AyoDonor PMI Nasional",
    source_url: "https://ayodonor.pmi.or.id",
    scraper_config: {},
    detection_keywords: null,
    scrape_frequency_minutes: 360,
  },
  {
    source_type: "pmi_city",
    source_name: "PMI Bali",
    source_url: "https://pmibali.online",
    scraper_config: {},
    detection_keywords: null,
    scrape_frequency_minutes: 360,
  },
  {
    source_type: "pmi_city",
    source_name: "PMI Kota Batam",
    source_url: "https://updpmibatam.id",
    scraper_config: {
      containerSelector: "article, .post, .kegiatan-item, .card, .blog-item, li, section, [class*=post]",
      titleSelector: "h2, h3, h4, .card-title, .entry-title, .judul",
    },
    detection_keywords: null,
    scrape_frequency_minutes: 720,
  },
  {
    source_type: "pmi_city",
    source_name: "PMI Kabupaten Bandung",
    source_url: "https://pmikabbandung.or.id",
    scraper_config: {
      containerSelector: "article, .post, .kegiatan-item, .col-md-4, li, section, [class*=post]",
      titleSelector: "h2, h3, h4, .entry-title, .judul",
    },
    detection_keywords: null,
    scrape_frequency_minutes: 720,
  },
  {
    source_type: "pmi_city",
    source_name: "PMI Kabupaten Malang",
    source_url: "https://www.pmikabmalang.or.id",
    scraper_config: {
      containerSelector: "article, .post, .berita, .col-md-4, li, section, [class*=post]",
      titleSelector: "h2, h3, h4, .entry-title",
    },
    detection_keywords: null,
    scrape_frequency_minutes: 720,
  },
  {
    source_type: "pmi_city",
    source_name: "PMI Kota Semarang",
    source_url: "https://pmikotasemarang.or.id",
    scraper_config: {
      containerSelector: "article, .post, .col-md-4, .col-lg-4, li, section, [class*=post]",
      titleSelector: "h2, h3, h4, .entry-title",
    },
    detection_keywords: null,
    scrape_frequency_minutes: 720,
  },
  {
    source_type: "rest_api",
    source_name: "Sumber Event Nasional",
    source_url: "https://vrumbtsfrqvnmdpezlot.supabase.co/rest/v1/events?select=*&order=event_date.desc",
    scraper_config: {},
    detection_keywords: null,
    scrape_frequency_minutes: 360,
  },
];
