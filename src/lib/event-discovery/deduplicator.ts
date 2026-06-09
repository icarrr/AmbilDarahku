import { supabase } from "@/lib/db";
import { ScrapedEvent } from "./types";

export async function filterNewEvents(events: ScrapedEvent[]): Promise<ScrapedEvent[]> {
  const dedupKeys = new Set<string>();
  const results: ScrapedEvent[] = [];

  for (const event of events) {
    if (event.sourceId && event.sourceType) {
      const key = `${event.sourceType}:${event.sourceId}`;
      if (dedupKeys.has(key)) continue;
      dedupKeys.add(key);
    }

    results.push(event);
  }

  const withIds = results.filter(e => e.sourceId && e.sourceType);
  const withoutIds = results.filter(e => !e.sourceId || !e.sourceType);

  if (withIds.length === 0) return withoutIds;

  const chunks: ScrapedEvent[][] = [];
  for (let i = 0; i < withIds.length; i += 50) {
    chunks.push(withIds.slice(i, i + 50));
  }

  const seenKeys = new Set<string>();

  for (const chunk of chunks) {
    const orQueries = chunk
      .filter(e => e.sourceId && e.sourceType)
      .map(e => `and(source_type.eq.${e.sourceType},source_id.eq.${e.sourceId})`);

    for (let i = 0; i < orQueries.length; i += 10) {
      const batch = orQueries.slice(i, i + 10);
      const q = batch.map(o => `or(${o})`).join(",");
      const { data: existing } = await supabase
        .from("events")
        .select("source_type, source_id")
        .or(q);

      if (existing) {
        for (const row of existing) {
          seenKeys.add(`${row.source_type}:${row.source_id}`);
        }
      }
    }
  }

  return [
    ...withoutIds,
    ...withIds.filter(e => {
      const key = `${e.sourceType}:${e.sourceId}`;
      return !seenKeys.has(key);
    }),
  ];
}
