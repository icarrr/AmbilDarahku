export interface ScrapedEvent {
  title: string;
  description?: string;
  location: string;
  city: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  organizer?: string;
  contactPhone?: string;
  quota?: number;
  sourceUrl: string;
  sourceType: string;
  sourceId?: string;
  organizerId?: string;
}

export interface SourceConfig {
  id: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string;
  scraperConfig: Record<string, any>;
  detectionKeywords: string[] | null;
  isActive: boolean;
}

export interface DiscoverResult {
  totalSources: number;
  totalScraped: number;
  totalNew: number;
  totalErrors: number;
  archivedCount: number;
  sources: {
    name: string;
    url: string;
    found: number;
    new: number;
    error?: string;
  }[];
  durationMs: number;
}
