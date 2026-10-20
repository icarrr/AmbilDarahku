"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Clock, Users, Plus, Archive } from "lucide-react";

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
  contact_phone?: string;
  quota: number;
  status: string;
  poster_url?: string | null;
};

type Filter = "upcoming" | "all" | "past";
const FILTERS: readonly Filter[] = ["upcoming", "past", "all"];
const PAGE_STEP = 12;

function EventsContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>(() => {
    const p = searchParams.get("filter") as Filter | null;
    return p && FILTERS.includes(p) ? p : "upcoming";
  });
  const [hasMore, setHasMore] = useState(false);

  const fetchEvents = useCallback(async (status: Filter, offset: number, append: boolean) => {
    try {
      const params = new URLSearchParams({ status, limit: String(PAGE_STEP), offset: String(offset) });
      const d = await api.get<{ events: Event[] }>(`/events?${params}`);
      setEvents(prev => append ? [...prev, ...(d.events || [])] : (d.events || []));
      setHasMore((d.events || []).length === PAGE_STEP);
      setError(false);
    } catch {
      if (!append) setEvents([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const changeFilter = (f: typeof filter) => {
    if (f === filter) return;
    setFilter(f);
    setLoading(true);
    setError(false);
    router.replace(f === "upcoming" ? "/events" : `/events?filter=${f}`, { scroll: false });
  };

  useEffect(() => {
    fetchEvents(filter, 0, false);
  }, [filter, fetchEvents]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchEvents(filter, events.length, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const FALLBACK_EVENT_PATH = "events/Gemini_Generated_Image_295p3i295p3i295p.jpg";

  const eventImgUrl = (event: Event): string => {
    if (event.poster_url) return `/api/v1/files?url=${encodeURIComponent(event.poster_url)}`;
    return `/api/v1/files?url=${encodeURIComponent(FALLBACK_EVENT_PATH)}`;
  };

  const day = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric" });
  const month = (d: string) => new Date(d).toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
  const year = (d: string) => new Date(d).getFullYear();

  const filteredEvents = events.filter(e => {
    if (filter === "all") return true;
    if (filter === "upcoming") return e.status === "upcoming" || e.status === "ongoing";
    return e.status === "completed";
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Event Donor Darah</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ikuti kegiatan donor darah massal di lokasi sekitar Anda.
          </p>
        </div>
        {isAdmin && (
          <Link href="/events/new" className={cn(buttonVariants(), "shrink-0 px-3")}>
            <Plus className="h-4 w-4" /> Buat Event
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(opt => (
          <Button
            key={opt}
            variant={filter === opt ? "default" : "outline"}
            size="sm"
            aria-pressed={filter === opt}
            onClick={() => changeFilter(opt)}
          >
            {opt === "upcoming" ? "Akan Datang" : opt === "all" ? "Semua" : "Selesai"}
          </Button>
        ))}
        <Link href="/events/archive" className={cn(buttonVariants({ variant: "link", size: "sm" }), "ml-auto")}>
          <Archive className="h-3.5 w-3.5" /> Lihat arsip event
        </Link>
      </div>

      {error && !loading ? (
        <GlassCard className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">Data belum dapat dimuat.</p>
          <p className="mt-1 text-xs text-muted-foreground">Silakan coba lagi.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); fetchEvents(filter, 0, false); }}>
            Coba Lagi
          </Button>
        </GlassCard>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-24 rounded-lg bg-muted" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </GlassCard>
          ))}
        </div>
      ) : events.length === 0 ? (
        <GlassCard className="py-12 text-center animate-fade-in">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-2 font-medium text-foreground">
            {filter === "upcoming" ? "Belum ada event yang akan datang" :
             filter === "past" ? "Belum ada event yang selesai" :
             "Belum ada event donor darah"}
          </p>
          <p className="text-xs text-muted-foreground">Pantau terus untuk event terbaru</p>
          {isAdmin && (
            <Link href="/events/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4 px-3")}>
              <Plus className="h-4 w-4" /> Buat Event
            </Link>
          )}
        </GlassCard>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const imgUrl = eventImgUrl(event);
            return (
            <GlassCard
              key={event.id}
              elevated
              className={`flex flex-col animate-slide-up stagger-${Math.min(i + 1, 6)} ${imgUrl ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
              onClick={imgUrl ? () => window.open(imgUrl, "_blank", "noopener,noreferrer") : undefined}
              role={imgUrl ? "button" : undefined}
              tabIndex={imgUrl ? 0 : undefined}
            >
              <div className="flex items-start gap-4">
                <time
                  dateTime={event.event_date}
                  title={formatDate(event.event_date)}
                  className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-center min-w-[56px] text-primary"
                >
                  <span className="text-xs font-bold">{day(event.event_date)}</span>
                  <span className="text-sm font-bold">{month(event.event_date)}</span>
                  <span className="text-[10px] font-medium opacity-80">{year(event.event_date)}</span>
                </time>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 break-words">{event.title}</h3>
                  <div className="mt-1 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      {event.start_time} - {event.end_time} WIB
                    </p>
                    {event.organizer && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        {event.organizer}
                      </p>
                    )}
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
        {hasMore && !error && (
          <div className="mt-6 text-center">
            <Button variant="outline" className="px-4" onClick={loadMore} disabled={loading || loadingMore}>
              {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <EventsContent />
    </Suspense>
  );
}
