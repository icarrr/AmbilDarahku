"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRegionNames } from "@/lib/hooks/useRegionNames";
import { MapPin, SlidersHorizontal, MessageCircle, LogIn, Filter, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { coordinatorWaLink } from "@/lib/coordinator";
import { getAppUrl } from "@/lib/url";
import { ReportDialog } from "@/components/report-dialog";

type Donor = {
  id: string;
  full_name: string;
  blood_type: string;
  city: string;
  city_name?: string;
  province: string;
  province_name?: string;
  total_donations: number;
  availability_status: string;
  eligibility_status: string;
  username?: string;
  contact_consent?: boolean;
  last_donation_date?: string;
  avatar_url?: string | null;
};

const BLOOD_TYPES = ["A", "B", "AB", "O"];

function SearchContent() {
  const { user, loading: authLoading, isUnverified } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isUnverified) router.replace("/verify-email");
  }, [isUnverified, router]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  // Filters are mirrored to the URL (on apply) so a search survives reload/back.
  const [bloodType, setBloodType] = useState<string>(() => {
    const bt = searchParams.get("blood_type") ?? "";
    return BLOOD_TYPES.includes(bt) ? bt : "";
  });
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const regionName = useRegionNames(donors.map(d => d.city_name ? null : d.city));

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setError(false);
    const qs = new URLSearchParams();
    if (bloodType) qs.set("blood_type", bloodType);
    if (city) qs.set("city", city);
    const qsStr = qs.toString();
    router.replace(qsStr ? `/search?${qsStr}` : "/search", { scroll: false });
    try {
      const params = new URLSearchParams();
      if (bloodType) params.set("blood_type", bloodType);
      if (city) params.set("city", city);
      params.set("availability_status", "available");
      params.set("limit", "30");

      const data = await api.get<{ donors: Donor[] }>(`/donors?${params.toString().replace(/\+/g, "%2B")}`);
      setDonors(data.donors || []);
    } catch {
      setDonors([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [bloodType, city, router]);

  useEffect(() => { if (user) search();   }, [user]);

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-10 text-center">
          <LogIn className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
          <h2 className="font-heading text-lg font-bold text-foreground">Masuk untuk Mencari Donor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan masuk atau daftar akun untuk mengakses direktori pendonor.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login?next=/search" className={cn(buttonVariants(), "w-full")}>
              Masuk
            </Link>
            <Link href="/register" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Daftar Akun
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="md:grid md:grid-cols-4 md:gap-6">
        <div id="search-filters" className={cn("md:col-span-1", showFilters ? "block" : "hidden md:block")}>
          <GlassCard className="mb-4">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Filter</span>
            </div>

            <div className="mb-4">
              <p id="filter-blood-label" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Golongan Darah</p>
              <div className="flex gap-2" role="group" aria-labelledby="filter-blood-label">
                {BLOOD_TYPES.map((bt) => (
                  <button key={bt} type="button" aria-pressed={bloodType === bt} onClick={() => setBloodType(bloodType === bt ? "" : bt)}
                    className={cn("flex size-10 items-center justify-center rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      bloodType === bt ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}>{bt}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="filter-city" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kota</label>
              <input id="filter-city" type="search" placeholder="Cari kota..." value={city} onChange={e => setCity(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") search(); }}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>

            <div className="flex gap-2">
              <Button onClick={search} className="flex-1">
                Terapkan Filter
              </Button>
              <Button variant="outline" className="px-3"
                onClick={() => { setBloodType(""); setCity(""); setDonors([]); setHasSearched(false); setShowFilters(false); router.replace("/search", { scroll: false }); }}>
                Reset
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">Direktori Pendonor</h2>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {hasSearched && !loading && !error
                  ? `${donors.length} pendonor ditemukan`
                  : "Cari pendonor berdasarkan golongan darah dan kota"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 px-3 md:hidden"
              aria-expanded={showFilters} aria-controls="search-filters"
              onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-3.5 w-3.5" />
              {showFilters ? "Tutup Filter" : "Filter"}
            </Button>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Perhatian: donor darah melalui aplikasi ini tidak dipungut biaya. Kontak dilakukan melalui koordinator — jangan berikan uang kepada siapa pun yang mengatasnamakan donor atau aplikasi ini.
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <GlassCard key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : error ? (
            <GlassCard className="py-12 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-foreground">Data belum dapat dimuat.</p>
              <p className="text-xs text-muted-foreground">Silakan coba lagi.</p>
              <Button variant="outline" size="sm" className="mt-4 px-4" onClick={search}>
                Coba Lagi
              </Button>
            </GlassCard>
          ) : donors.length === 0 && hasSearched ? (
            <GlassCard className="py-12 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Tidak ada donor ditemukan</p>
              <p className="text-xs text-muted-foreground">Coba ubah filter pencarian Anda</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {donors.map((donor) => {
                const profileHref = `/u/${donor.username || donor.id}`;
                return (
                  <GlassCard key={donor.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link href={profileHref} className="flex w-full flex-1 items-center gap-3 sm:w-auto">
                      <div className="flex-shrink-0">
                        <div className="relative h-14 w-14 mx-auto">
                          {donor.avatar_url && (
                            <img
                              src={donor.avatar_url}
                              alt=""
                              loading="lazy"
                              className="mx-auto h-14 w-14 rounded-full object-cover"
                              onError={(e) => {
                                const el = e.target as HTMLElement;
                                el.style.display = "none";
                                const initials = el.parentElement?.querySelector(".avatar-fallback") as HTMLElement;
                                if (initials) initials.style.display = "flex";
                              }}
                            />
                          )}
                          <div
                            className="avatar-fallback mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 font-heading text-sm font-bold text-white"
                            style={{ display: donor.avatar_url ? "none" : "flex" }}
                          >
                            {donor.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{donor.full_name}</p>
                          {donor.total_donations >= 10 && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ELIT</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{donor.city_name || regionName(donor.city)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <BloodTypeBadge type={donor.blood_type} size="sm" />
                          <StatusBadge status={donor.availability_status} dot />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
                          {donor.last_donation_date && <span>Terakhir Donasi: {new Date(donor.last_donation_date).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          <span>Total: {donor.total_donations} Kantong</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex w-full flex-shrink-0 flex-col gap-1.5 sm:w-auto">
                      {(() => {
                        const profileHref = `${getAppUrl()}/u/${donor.username || donor.id}`;
                        const wa = coordinatorWaLink(
                          `Halo, saya mencari donor darah ${donor.blood_type} di ${donor.city_name || regionName(donor.city)}. Apakah bisa di hubungkan ke "${donor.full_name}"? ${profileHref}`
                        );
                        return wa ? (
                          <a href={wa}
                             target="_blank" rel="noopener noreferrer"
                             className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-600">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Hubungi Koordinator
                          </a>
                        ) : null;
                      })()}
                      <ReportDialog targetType="donor" targetId={donor.id} />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
