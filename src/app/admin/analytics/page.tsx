"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InstitutionItem = { institution: string; total: number };
type CityItem = { city: string; total: number };
type YearItem = { year: number; total: number };
type MonthItem = { year: number; month: number; total: number };
type AgeBucket = { bucket: string; total: number };
type TopDonor = { user_id: string; full_name: string; total_donations: number; trust_score: number };

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 truncate text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-zinc-800 rounded overflow-hidden">
        <div
          className="h-full bg-red-500 rounded transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"institutions" | "cities" | "months" | "age" | "top">("institutions");
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [years, setYears] = useState<YearItem[]>([]);
  const [months, setMonths] = useState<MonthItem[]>([]);
  const [ageBuckets, setAgeBuckets] = useState<AgeBucket[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ data: InstitutionItem[] }>("/admin/analytics/institutions").then(d => setInstitutions(d.data || [])).catch(() => {});
    api.get<{ data: CityItem[] }>("/admin/analytics/cities").then(d => setCities(d.data || [])).catch(() => {});
    api.get<{ data: YearItem[] }>("/admin/analytics/years").then(d => { setYears(d.data || []); }).catch(() => {});
    api.get<{ data: MonthItem[] }>("/admin/analytics/months").then(d => { setMonths(d.data || []); }).catch(() => {});
    api.get<{ data: AgeBucket[] }>("/admin/analytics/age").then(d => setAgeBuckets(d.data || [])).catch(() => {});
    api.get<{ data: TopDonor[] }>("/admin/analytics/top-donors").then(d => setTopDonors(d.data || [])).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="max-w-lg mx-auto px-4 py-12 text-center"><p className="text-gray-500">Akses ditolak.</p></div>;
  }

  const maxInstitution = Math.max(...institutions.map(i => i.total), 1);
  const maxCity = Math.max(...cities.map(c => c.total), 1);
  const maxMonth = Math.max(...months.map(m => m.total), 1);
  const maxAge = Math.max(...ageBuckets.map(a => a.total), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analitik Donasi</h1>
        <p className="text-gray-500 text-sm mt-1">Data agregat donasi darah dari seluruh donor.</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {(["institutions", "cities", "months", "age", "top"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === t ? "bg-red-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}>
            {t === "institutions" ? "Institusi" :
             t === "cities" ? "Kota" :
             t === "months" ? "Bulanan" :
             t === "age" ? "Usia" : "Top Donor"}
          </button>
        ))}
      </div>

      {tab === "institutions" && (
        <Card>
          <CardHeader><CardTitle>Donasi per Institusi</CardTitle><CardDescription>20 institusi teratas</CardDescription></CardHeader>
          <CardContent className="space-y-1.5">
            {institutions.map(i => <Bar key={i.institution} label={i.institution} value={i.total} max={maxInstitution} />)}
            {institutions.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada data.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "cities" && (
        <Card>
          <CardHeader><CardTitle>Donasi per Kota</CardTitle><CardDescription>20 kota teratas</CardDescription></CardHeader>
          <CardContent className="space-y-1.5">
            {cities.map(c => <Bar key={c.city} label={c.city} value={c.total} max={maxCity} />)}
            {cities.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada data.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "months" && (
        <Card>
          <CardHeader><CardTitle>Tren Bulanan</CardTitle><CardDescription>12 bulan terakhir</CardDescription></CardHeader>
          <CardContent className="space-y-1.5">
            {months.map(m => <Bar key={`${m.year}-${m.month}`} label={`${MONTHS[m.month-1]||""} ${m.year}`} value={m.total} max={maxMonth} />)}
            {months.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada data.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "age" && (
        <Card>
          <CardHeader><CardTitle>Distribusi Usia Donor</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {ageBuckets.map(a => <Bar key={a.bucket} label={a.bucket} value={a.total} max={maxAge} />)}
            {ageBuckets.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada data.</p>}
          </CardContent>
        </Card>
      )}

      {tab === "top" && (
        <Card>
          <CardHeader><CardTitle>Top 10 Donor</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Donasi</th>
                    <th className="pb-2 font-medium">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {topDonors.map((d, i) => (
                    <tr key={d.user_id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="py-2 pr-4">{i + 1}</td>
                      <td className="py-2 pr-4">{d.full_name}</td>
                      <td className="py-2 pr-4">{d.total_donations}x</td>
                      <td className="py-2">
                        <Badge variant={d.trust_score >= 80 ? "default" : "secondary"}>{d.trust_score.toFixed(1)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topDonors.length === 0 && <p className="text-center text-gray-400 py-4">Belum ada data.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
