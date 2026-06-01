"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { MapPin, Grid3X3, List, SlidersHorizontal, MessageCircle, LogIn } from "lucide-react";
import Link from "next/link";

type Donor = {
  id: string;
  full_name: string;
  blood_type: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  total_donations: number;
  availability_status: string;
  eligibility_status: string;
  phone: string;
  distance_km?: number;
  last_donation_date?: string;
};

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const RADIUS_OPTIONS = ["5", "10", "15", "25", "50"];

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [bloodType, setBloodType] = useState<string>("");
  const [radius, setRadius] = useState<string>("15");
  const [city, setCity] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (bloodType) params.set("blood_type", bloodType);
      if (radius) params.set("radius", radius);
      if (city) params.set("city", city);
      params.set("availability_status", "available");

      if (radius && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          params.set("latitude", pos.coords.latitude.toString());
          params.set("longitude", pos.coords.longitude.toString());
        } catch {}
      }

      const data = await api.get<{ donors: Donor[] }>(`/donors?${params.toString().replace(/\+/g, "%2B")}`);
      setDonors(data.donors || []);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  }, [bloodType, radius, city]);

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
        <div className="md:col-span-1">
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

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Radius</p>
              <div className="flex flex-wrap gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button key={r} onClick={() => setRadius(r === radius ? "" : r)}
                    className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      radius === r ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-gray-200"
                    )}>{r} km</button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={search} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">
                Terapkan Filter
              </button>
              <button onClick={() => { setBloodType(""); setRadius(""); setCity(""); setDonors([]); setHasSearched(false); }}
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
            <div className="hidden items-center gap-1 rounded-lg bg-gray-100 p-1 md:flex">
              <button onClick={() => setViewMode("grid")}
                className={cn("rounded-md p-1.5", viewMode === "grid" ? "bg-white shadow-sm" : "")}>
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={cn("rounded-md p-1.5", viewMode === "list" ? "bg-white shadow-sm" : "")}>
                <List className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
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
              {radius && (
                <div className="mx-auto mt-4 max-w-xs rounded-lg bg-amber-50 p-3 text-left">
                  <p className="text-xs font-medium text-amber-800">Filter radius aktif ({radius} km)</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Jika hasil tidak ditemukan, coba nonaktifkan filter radius dan gunakan filter kota untuk memperluas pencarian.
                  </p>
                  <button
                    onClick={() => { setRadius(""); setCity(""); setTimeout(search, 0); }}
                    className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Nonaktifkan Radius & Cari per Kota
                  </button>
                </div>
              )}
            </GlassCard>
          ) : (
            <div className={cn(
              "gap-3",
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2" : "space-y-3"
            )}>
              {donors.map((donor) => (
                <GlassCard key={donor.id} className={cn(viewMode === "grid" ? "" : "flex items-center gap-3")}>
                  <div className={cn(viewMode === "grid" ? "mb-3 text-center" : "flex-shrink-0")}>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 font-heading text-sm font-bold text-white">
                      {donor.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  </div>
                  <div className={cn("flex-1", viewMode === "grid" ? "text-center" : "min-w-0")}>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <p className="truncate text-sm font-semibold text-foreground">{donor.full_name}</p>
                      {donor.total_donations >= 10 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ELIT</span>
                      )}
                    </div>
                    <div className={cn("mt-1 flex items-center gap-2 text-xs text-muted-foreground", viewMode === "grid" ? "justify-center" : "")}>
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{donor.city}{donor.distance_km ? ` (${donor.distance_km.toFixed(1)} km)` : ""}</span>
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
                  <div className={cn("flex flex-col gap-1.5", viewMode === "grid" ? "mt-3" : "flex-shrink-0")}>
                    {donor.phone && (
                      <a href={`https://wa.me/${donor.phone}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-600">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Hubungi via WhatsApp
                      </a>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
