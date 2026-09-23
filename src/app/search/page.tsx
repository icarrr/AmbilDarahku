"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { MapPin, SlidersHorizontal, MessageCircle, LogIn, Filter, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { coordinatorWaLink } from "@/lib/coordinator";
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

export default function SearchPage() {
  const { user, loading: authLoading, isUnverified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isUnverified) router.replace("/verify-email");
  }, [isUnverified, router]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [bloodType, setBloodType] = useState<string>("");
  const [city, setCity] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
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
    } finally {
      setLoading(false);
    }
  }, [bloodType, city]);

  useEffect(() => { if (user) search();   }, [user]);

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-10 text-center">
          <LogIn className="mx-auto mb-4 h-10 w-10 text-gray-300" />
          <h2 className="font-heading text-lg font-bold text-foreground">Masuk untuk Mencari Donor</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Silakan masuk atau daftar akun untuk mengakses direktori pendonor.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login">
              <button className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                Masuk
              </button>
            </Link>
            <Link href="/register">
              <button className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">
                Daftar Akun
              </button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="md:grid md:grid-cols-4 md:gap-6">
        <div className={cn("md:col-span-1", showFilters ? "block" : "hidden md:block")}>
          <GlassCard className="mb-4">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Filter</span>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Golongan Darah</p>
              <div className="flex gap-2">
                {BLOOD_TYPES.map((bt) => (
                  <button key={bt} onClick={() => setBloodType(bloodType === bt ? "" : bt)}
                    className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                      bloodType === bt ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-gray-200"
                    )}>{bt}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kota</p>
              <input type="text" placeholder="Cari kota..." value={city} onChange={e => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium placeholder:text-gray-400 focus:border-red-300 focus:outline-none" />
            </div>

            <div className="flex gap-2">
              <button onClick={search} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">
                Terapkan Filter
              </button>
              <button onClick={() => { setBloodType(""); setCity(""); setDonors([]); setHasSearched(false); setShowFilters(false); }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-gray-50">
                Reset
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">Direktori Pendonor</h2>
              <p className="text-sm text-muted-foreground">
                Ditemukan {donors.length} pendonor aktif di sekitar lokasi Anda
              </p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 md:hidden">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Perhatian: donor darah melalui aplikasi ini tidak dipungut biaya. Kontak dilakukan melalui koordinator — jangan berikan uang kepada siapa pun yang mengatasnamakan donor atau aplikasi ini.
            </span>
          </div>

          {loading ? (
            <div className={cn("gap-3", viewMode === "grid" ? "grid grid-cols-2" : "space-y-3")}>
              {[1, 2, 3, 4].map((i) => (
                <GlassCard key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-200" />
                      <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : donors.length === 0 && hasSearched ? (
            <GlassCard className="py-12 text-center">
              <MapPin className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-muted-foreground">Tidak ada donor ditemukan</p>
              <p className="text-xs text-[#94a3b8]">Coba ubah filter pencarian Anda</p>
            </GlassCard>
          ) : (
            <div className={cn(
              "gap-3",
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2" : "space-y-3"
            )}>
              {donors.map((donor) => {
                const profileHref = `/u/${donor.username || donor.id}`;
                return (
                  <GlassCard key={donor.id} className={cn(viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row sm:items-center gap-3")}>
                    <Link href={profileHref} className={cn("flex-1", viewMode === "grid" ? "text-center" : "w-full sm:w-auto flex items-center gap-3")}>
                      <div className={cn(viewMode === "grid" ? "mb-3 text-center" : "flex-shrink-0")}>
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
                      <div className={cn(viewMode === "grid" ? "text-center" : "min-w-0")}>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <p className="truncate text-sm font-semibold text-foreground">{donor.full_name}</p>
                          {donor.total_donations >= 10 && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ELIT</span>
                          )}
                        </div>
                        <div className={cn("mt-1 flex items-center gap-2 text-xs text-muted-foreground", viewMode === "grid" ? "justify-center" : "")}>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{donor.city_name || donor.city}</span>
                        </div>
                        <div className={cn("mt-2 flex items-center gap-2", viewMode === "grid" ? "justify-center" : "")}>
                          <BloodTypeBadge type={donor.blood_type} size="sm" />
                          <StatusBadge status={donor.availability_status} dot />
                        </div>
                        <div className={cn("mt-1 flex gap-3 text-[10px] text-[#94a3b8]", viewMode === "grid" ? "justify-center" : "")}>
                          {donor.last_donation_date && <span>Terakhir Donasi: {new Date(donor.last_donation_date).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          <span>Total: {donor.total_donations} Kantong</span>
                        </div>
                      </div>
                    </Link>
                    <div className={cn("flex flex-col gap-1.5", viewMode === "grid" ? "mt-3" : "w-full sm:w-auto flex-shrink-0")}>
                      {(() => {
                        const wa = coordinatorWaLink(
                          `Halo, saya mencari donor darah ${donor.blood_type} di ${donor.city_name || donor.city}. Apakah ada donor yang tersedia?`
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
