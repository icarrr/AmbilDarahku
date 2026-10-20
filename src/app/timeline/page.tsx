"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { StatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Droplets, FileText, Award, CalendarDays, ChevronRight } from "lucide-react";

type TimelineEntry = {
  type: "donation" | "claim" | "badge";
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  link: string;
};

const ENTRY_ICONS = {
  donation: { icon: Droplets, color: "bg-red-100 text-red-600" },
  claim: { icon: FileText, color: "bg-blue-100 text-blue-600" },
  badge: { icon: Award, color: "bg-amber-100 text-amber-600" },
};

const ENTRY_TYPES = ["all", "donation", "claim", "badge"] as const;
type FilterType = (typeof ENTRY_TYPES)[number];

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setError(false);
    api.get<{ entries: TimelineEntry[] }>("/timeline")
      .then(d => setEntries(d.entries || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user, authLoading, retryCount]);

  const filtered = filter === "all" ? entries : entries.filter(e => e.type === filter);

  if (authLoading || loading) return <div className="mx-auto max-w-2xl px-4 py-8 text-center text-muted-foreground">Memuat...</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <GlassCard className="py-10 text-center">
          <Droplets className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <h2 className="font-heading text-lg font-bold text-foreground">Masuk untuk Melihat Linimasa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Silakan masuk untuk melihat riwayat aktivitas donor Anda.</p>
          <Link href="/login" className={buttonVariants({ className: "mt-5 px-6" })}>
            Masuk
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <GlassCard className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">Data belum dapat dimuat.</p>
          <p className="mt-1 text-xs text-muted-foreground">Silakan coba lagi.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); setRetryCount(c => c + 1); }}>
            Coba Lagi
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-xl font-bold text-foreground">Linimasa Aktivitas</h1>
      <p className="mt-1 text-sm text-muted-foreground">Perjalanan donor darah Anda</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {ENTRY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === t
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all" ? "Semua" : t === "donation" ? "Donasi" : t === "claim" ? "Klaim" : "Lencana"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm">Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((entry, i) => {
            const info = ENTRY_ICONS[entry.type] || ENTRY_ICONS.donation;
            const Icon = info.icon;
            return (
              <div key={`${entry.type}-${entry.id}`} className="relative flex gap-4">
                {i < filtered.length - 1 && (
                  <div className="absolute left-[19px] top-10 h-full w-0.5 bg-gray-200" />
                )}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${info.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <GlassCard className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(entry.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={entry.status} />
                      {entry.link && (
                        <Link
                          href={entry.link}
                          aria-label={`Lihat detail ${entry.title}`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "text-muted-foreground" })}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
