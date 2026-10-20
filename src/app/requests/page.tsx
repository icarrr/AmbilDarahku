"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Droplets, MapPin, Plus, Clock, AlertTriangle, MessageCircle, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { coordinatorWaLink } from "@/lib/coordinator";
import { getAppUrl } from "@/lib/url";
import { ReportDialog } from "@/components/report-dialog";
import { useRegionNames } from "@/lib/hooks/useRegionNames";

type BloodRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  hospital: string;
  city: string;
  urgency: string;
  bags: number;
  fulfilled_bags: number;
  notes?: string;
  created_at: string;
  status?: string;
};

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUnverified } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Filters are mirrored to the URL so they survive reload/back and can be shared.
  const [statusFilter, setStatusFilter] = useState<"open" | "all">(searchParams.get("status") === "all" ? "all" : "open");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");
  const [hospitalFilter, setHospitalFilter] = useState(searchParams.get("hospital") ?? "");
  const [knownHospitals, setKnownHospitals] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const regionName = useRegionNames(requests.map(r => r.city));

  useEffect(() => {
    const qs = new URLSearchParams();
    if (statusFilter !== "open") qs.set("status", statusFilter);
    if (debouncedSearch) qs.set("q", debouncedSearch);
    if (hospitalFilter) qs.set("hospital", hospitalFilter);
    const next = qs.toString();
    if (next !== window.location.search.replace(/^\?/, "")) {
      router.replace(next ? `/requests?${next}` : "/requests", { scroll: false });
    }
  }, [statusFilter, debouncedSearch, hospitalFilter, router]);

  // Debounce search input — avoid request per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isUnverified) { router.replace("/verify-email"); return; }
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ status: statusFilter, limit: "30" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (hospitalFilter) params.set("hospital", hospitalFilter);
    api.get<{ requests: BloodRequest[] }>(`/requests?${params}`, false)
      .then(d => {
        setRequests(d.requests || []);
        setKnownHospitals(prev => [...new Set([...prev, ...(d.requests || []).map(r => r.hospital).filter(Boolean)])].sort());
      })
      .catch(() => { setRequests([]); setError(true); })
      .finally(() => setLoading(false));
  }, [isUnverified, router, statusFilter, debouncedSearch, hospitalFilter, retryCount]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Permintaan Darah</h1>
          <p className="text-sm text-muted-foreground">Daftar permintaan donor darah terbuka</p>
        </div>
        <Button onClick={() => router.push("/requests/new")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Buat Permintaan
        </Button>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <input
          type="search"
          aria-label="Cari nama pasien"
          placeholder="Cari nama pasien..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 min-w-0 w-full sm:flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"
        />
        <select
          aria-label="Filter rumah sakit"
          value={hospitalFilter}
          onChange={e => setHospitalFilter(e.target.value)}
          className="h-8 w-full sm:w-auto rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
        >
          <option value="">Semua RS</option>
          {hospitalFilter && !knownHospitals.includes(hospitalFilter) && <option value={hospitalFilter}>{hospitalFilter}</option>}
          {knownHospitals.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(statusFilter === "open" ? "all" : "open")}
        >
          {statusFilter === "open" ? "Aktif" : "Semua Status"}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {[1,2,3].map(i => <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}><SkeletonCard /></div>)}
        </div>
      ) : error ? (
        <div className="py-16 text-center animate-fade-in">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 font-medium text-foreground">Data belum dapat dimuat.</p>
          <p className="text-sm text-muted-foreground">Silakan coba lagi.</p>
          <Button variant="outline" className="mt-4" onClick={() => setRetryCount(c => c + 1)}>
            Coba Lagi
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center animate-fade-in">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 font-medium text-foreground">Tidak ada permintaan</p>
          <p className="text-sm text-muted-foreground">Coba ubah filter atau buat permintaan baru</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/requests/new")}>
            <Plus className="h-4 w-4 mr-1" /> Buat Permintaan
          </Button>
        </div>
      ) : (
        <>
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>Donor darah tidak dipungut biaya. Jangan berikan uang kepada siapa pun.</span>
        </div>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {requests.map((req, i) => {
            const bags = req.bags || 0;
            const filled = req.fulfilled_bags || 0;
            const remaining = Math.max(bags - filled, 0);
            return (
            <div key={req.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <GlassCard>
                <Link href={`/requests/share/${req.id}`} className="block cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        req.urgency === "critical" ? "bg-red-100" : req.urgency === "urgent" ? "bg-amber-100" : "bg-blue-100"
                      }`}>
                        <Droplets className={`h-5 w-5 ${
                          req.urgency === "critical" ? "text-red-600" : req.urgency === "urgent" ? "text-amber-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{req.patient_name}</p>
                          <BloodTypeBadge type={req.blood_type} size="sm" />
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{req.hospital}{req.city ? `, ${regionName(req.city)}` : ""}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(req.created_at)}
                          </span>
                          {bags > 0 && <span>{filled}/{bags} &middot; {remaining} sisa</span>}
                        </div>
                        {filled > 0 && bags > 0 && (
                          <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min((filled / bags) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-1 items-end">
                      <UrgencyBadge level={req.urgency} />
                      {req.status === "fulfilled" && (
                        <StatusBadge status="fulfilled" />
                      )}
                    </div>
                  </div>
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {(() => {
                    const profileUrl = user
                      ? `${getAppUrl()}/u/${user.username || user.id}`
                      : "";
                    const wa = coordinatorWaLink(
                      `Halo, saya ingin membantu donor darah untuk pasien "${req.patient_name}" (${req.blood_type}) di ${req.hospital}. Apakah bisa di hubungkan?${profileUrl ? ` ${profileUrl}` : ""}`
                    );
                    return wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Hubungi Koordinator
                      </a>
                    ) : null;
                  })()}
                  <ReportDialog targetType="blood_request" targetId={req.id} />
                </div>
              </GlassCard>
            </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <RequestsContent />
    </Suspense>
  );
}
