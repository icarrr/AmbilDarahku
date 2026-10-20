"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight, Archive } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description?: string;
  location: string;
  city: string;
  event_date: string;
  start_time: string;
  end_time: string;
  organizer?: string;
  poster_url?: string | null;
};

export default function ArchivePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cityFilter, setCityFilter] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const fetchSeq = useRef(0);

  // Debounce city filter — avoid request per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(cityFilter), 400);
    return () => clearTimeout(t);
  }, [cityFilter]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const seq = ++fetchSeq.current;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedCity) params.set("city", debouncedCity);

    api.get<{ events: Event[]; total: number; totalPages: number }>(`/events/archive?${params}`)
      .then(d => {
        if (seq !== fetchSeq.current) return; // stale response
        setEvents(d.events || []);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => {
        if (seq !== fetchSeq.current) return;
        setEvents([]);
        setTotalPages(1);
        setError(true);
      })
      .finally(() => {
        if (seq === fetchSeq.current) setLoading(false);
      });
  }, [page, debouncedCity, retryCount]);

  const FALLBACK_EVENT_PATH = "events/Gemini_Generated_Image_295p3i295p3i295p.jpg";

  const eventImgUrl = (event: Event): string => {
    if (event.poster_url) return `/api/v1/files?url=${encodeURIComponent(event.poster_url)}`;
    return `/api/v1/files?url=${encodeURIComponent(FALLBACK_EVENT_PATH)}`;
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Arsip Event</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat event donor darah yang telah berlalu.
          </p>
        </div>
        <Link href="/events" className={buttonVariants({ size: "sm", className: "px-3" })}>
          Event Aktif
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          aria-label="Filter berdasarkan kota"
          placeholder="Filter berdasarkan kota..."
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-input bg-transparent px-4 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-20 rounded-lg bg-muted" />
            </GlassCard>
          ))}
        </div>
      ) : error ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">Data belum dapat dimuat.</p>
          <p className="mt-1 text-xs text-muted-foreground">Silakan coba lagi.</p>
          <Button variant="outline" size="sm" className="mt-4 px-3" onClick={() => setRetryCount(c => c + 1)}>
            Coba Lagi
          </Button>
        </GlassCard>
      ) : events.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-2 font-medium text-foreground">Belum ada event yang diarsipkan</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const imgUrl = eventImgUrl(event);
              return (
              <GlassCard
                key={event.id}
                elevated
                className={`flex flex-col opacity-80 ${imgUrl ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                onClick={imgUrl ? () => window.open(imgUrl, "_blank", "noopener,noreferrer") : undefined}
                role={imgUrl ? "button" : undefined}
                tabIndex={imgUrl ? 0 : undefined}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center min-w-[56px] text-muted-foreground">
                    <span className="text-xs font-bold">
                      {new Date(event.event_date).toLocaleDateString("id-ID", { day: "numeric" })}
                    </span>
                    <span className="text-sm font-bold">
                      {new Date(event.event_date).toLocaleDateString("id-ID", { month: "short" }).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 break-words">{event.title}</h3>
                    <div className="mt-1 space-y-1">
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {formatDate(event.event_date)} &middot; {event.start_time} - {event.end_time}
                      </p>
                    </div>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}
              </GlassCard>
            );
          })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-3 w-3" /> Sebelumnya
              </Button>
              <span className="text-xs text-muted-foreground">
                Hal {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Berikutnya <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
