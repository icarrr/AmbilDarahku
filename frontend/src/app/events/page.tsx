"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock, Phone, Users, Plus } from "lucide-react";

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
};

export default function EventsPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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

  const day = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric" });
  const month = (d: string) => new Date(d).toLocaleDateString("id-ID", { month: "short" }).toUpperCase();

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
      ) : events.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-muted-foreground">Belum ada event donor darah</p>
          <p className="text-xs text-[#94a3b8]">Pantau terus untuk event terbaru</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <GlassCard key={event.id} elevated className="flex flex-col">
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
              <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                <span className="text-xs text-[#94a3b8]">
                  Kuota: {event.quota} pendonor
                </span>
                {event.contact_phone ? (
                  <a
                    href={`https://wa.me/${event.contact_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    <Phone className="h-3 w-3" />
                    Daftar
                  </a>
                ) : (
                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400">
                    Daftar
                  </span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
