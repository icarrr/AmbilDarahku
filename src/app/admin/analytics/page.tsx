"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Shapes match src/app/api/v1/admin/analytics/*/route.ts responses.
type InstitutionItem = { institution: string; count: number };
type CityItem = { city: string; city_name?: string; count: number };
type YearItem = { year: number; count: number };
type MonthItem = { month: string; count: number };
type AgeBucket = { range: string; count: number };
type TopDonor = { id: string; full_name: string; total_donations: number; total_points?: number | null };

type BarItem = { key: string; label: string; value: number };
type Dataset<T> = { data: T[]; loading: boolean; error: string | null };

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const TABS = [
  { value: "institutions", label: "Institusi" },
  { value: "cities", label: "Kota" },
  { value: "months", label: "Bulanan" },
  { value: "years", label: "Tahunan" },
  { value: "age", label: "Usia" },
  { value: "top", label: "Top Donor" },
] as const;
type Tab = (typeof TABS)[number]["value"];

function useDataset<T>(enabled: boolean, path: string, key: string): Dataset<T> & { reload: () => void } {
  const [state, setState] = useState<Dataset<T>>({ data: [], loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    api.get<Record<string, T[]>>(path)
      .then(d => { if (!cancelled) setState({ data: d[key] || [], loading: false, error: null }); })
      .catch((err: unknown) => { if (!cancelled) setState({ data: [], loading: false, error: err instanceof Error ? err.message : "Gagal memuat data" }); });
    return () => { cancelled = true; };
  }, [enabled, path, key, nonce]);
  const reload = () => {
    setState(s => ({ ...s, loading: true, error: null }));
    setNonce(n => n + 1);
  };
  return { ...state, reload };
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 truncate text-right text-muted-foreground" title={label}>{label}</span>
      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
        <div
          className="h-full bg-primary rounded transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

function DatasetState({ ds, empty }: { ds: Dataset<unknown> & { reload: () => void }; empty: boolean }) {
  if (ds.loading) {
    return (
      <div className="space-y-1.5" aria-busy="true">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-5 w-full" />)}
      </div>
    );
  }
  if (ds.error) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-muted-foreground break-words">Gagal memuat data: {ds.error}</p>
        <Button size="sm" variant="outline" onClick={ds.reload}>Coba lagi</Button>
      </div>
    );
  }
  if (empty) return <p className="text-center text-muted-foreground py-4">Belum ada data.</p>;
  return null;
}

function BarList({ ds, items }: { ds: Dataset<unknown> & { reload: () => void }; items: BarItem[] }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <CardContent className="space-y-1.5">
      <DatasetState ds={ds} empty={items.length === 0} />
      {!ds.loading && !ds.error && items.map(i => <Bar key={i.key} label={i.label} value={i.value} max={max} />)}
    </CardContent>
  );
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTHS[Number(m) - 1] || ""} ${y}`;
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8"><Skeleton className="h-40 w-full" /></div>}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}

function AdminAnalyticsContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.find(t => t.value === tabParam)?.value ?? "institutions";
  const setTab = (t: Tab) => {
    router.replace(t === "institutions" ? pathname : `${pathname}?tab=${t}`, { scroll: false });
  };

  const institutions = useDataset<InstitutionItem>(isAdmin, "/admin/analytics/institutions", "institutions");
  const cities = useDataset<CityItem>(isAdmin, "/admin/analytics/cities", "cities");
  const years = useDataset<YearItem>(isAdmin, "/admin/analytics/years", "years");
  const months = useDataset<MonthItem>(isAdmin, "/admin/analytics/months", "months");
  const ageBuckets = useDataset<AgeBucket>(isAdmin, "/admin/analytics/age", "buckets");
  const topDonors = useDataset<TopDonor>(isAdmin, "/admin/analytics/top-donors", "donors");

  const showTopTable = !topDonors.loading && !topDonors.error && topDonors.data.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analitik Donasi</h1>
        <p className="text-muted-foreground text-sm mt-1">Data agregat donasi darah dari seluruh donor.</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2" role="tablist" aria-label="Kategori analitik">
        {TABS.map(t => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)}
            className={`min-h-10 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "institutions" && (
        <Card>
          <CardHeader><CardTitle>Donasi per Institusi</CardTitle><CardDescription>20 institusi teratas</CardDescription></CardHeader>
          <BarList ds={institutions} items={institutions.data.map(i => ({ key: i.institution, label: i.institution, value: i.count }))} />
        </Card>
      )}

      {tab === "cities" && (
        <Card>
          <CardHeader><CardTitle>Donor per Kota</CardTitle><CardDescription>20 kota teratas</CardDescription></CardHeader>
          <BarList ds={cities} items={cities.data.map(c => ({ key: c.city, label: c.city_name || c.city, value: c.count }))} />
        </Card>
      )}

      {tab === "months" && (
        <Card>
          <CardHeader><CardTitle>Tren Bulanan</CardTitle><CardDescription>12 bulan terakhir</CardDescription></CardHeader>
          <BarList ds={months} items={[...months.data].reverse().map(m => ({ key: m.month, label: formatMonth(m.month), value: m.count }))} />
        </Card>
      )}

      {tab === "years" && (
        <Card>
          <CardHeader><CardTitle>Donasi per Tahun</CardTitle></CardHeader>
          <BarList ds={years} items={years.data.map(y => ({ key: String(y.year), label: String(y.year), value: y.count }))} />
        </Card>
      )}

      {tab === "age" && (
        <Card>
          <CardHeader><CardTitle>Distribusi Usia Donor</CardTitle></CardHeader>
          <BarList ds={ageBuckets} items={ageBuckets.data.map(a => ({ key: a.range, label: a.range, value: a.count }))} />
        </Card>
      )}

      {tab === "top" && (
        <Card>
          <CardHeader><CardTitle>Top 10 Donor</CardTitle></CardHeader>
          <CardContent>
            <DatasetState ds={topDonors} empty={topDonors.data.length === 0} />
            {showTopTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Nama</th>
                      <th className="pb-2 font-medium">Donasi</th>
                      <th className="pb-2 font-medium">Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDonors.data.map((d, i) => (
                        <tr key={d.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 pr-4">{i + 1}</td>
                          <td className="py-2 pr-4">{d.full_name}</td>
                          <td className="py-2 pr-4">{d.total_donations}x</td>
                          <td className="py-2">
                            {d.total_points != null ? (
                              <Badge variant="secondary">{d.total_points}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
