"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock, Users, Plus } from "lucide-react";

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

export default function EventsPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "past">("upcoming");
  const [visible, setVisible] = useState(12);
  const PAGE_STEP = 12;

  useEffect(() => {
    api.get<{ events: Event[] }>("/events")
      .then(d => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

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
          <Link href="/events/new">
            <Button className="shrink-0 bg-red-600 hover:bg-red-700">
              <Plus className="mr-1 h-4 w-4" /> Buat Event
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {(["upcoming", "past", "all"] as const).map(opt => (
          <Button
            key={opt}
            variant={filter === opt ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(opt); setVisible(PAGE_STEP); }}
          >
            {opt === "upcoming" ? "Akan Datang" : opt === "all" ? "Semua" : "Selesai"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-24 rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
            </GlassCard>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <GlassCard className="py-12 text-center animate-fade-in">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-2 font-medium text-foreground">
            {filter === "upcoming" ? "Belum ada event yang akan datang" :
             filter === "past" ? "Belum ada event yang selesai" :
             "Belum ada event donor darah"}
          </p>
          <p className="text-xs text-muted-foreground">Pantau terus untuk event terbaru</p>
          {isAdmin && (
            <Link href="/events/new">
              <Button variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-1" /> Buat Event</Button>
            </Link>
          )}
        </GlassCard>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.slice(0, visible).map((event, i) => {
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
                <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-center min-w-[56px]">
                  <span className="text-xs font-bold text-red-600">{day(event.event_date)}</span>
                  <span className="text-sm font-bold text-red-600">{month(event.event_date)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
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
                <p className="mt-3 text-xs text-[#94a3b8] line-clamp-2">{event.description}</p>
              )}
            </GlassCard>
            );
          })}
        </div>
        {visible < filteredEvents.length && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => setVisible(v => v + PAGE_STEP)}>
              Lihat Lebih Banyak ({filteredEvents.length - visible} tersisa)
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
