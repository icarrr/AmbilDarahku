import type { Metadata } from "next";
import { api } from "@/lib/api";
import { notFound } from "next/navigation";
import { formatDate, getRecoveryEndDate } from "@/lib/utils";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { GlassCard } from "@/components/glass-card";
import { AvatarWithBadge } from "@/components/avatar-with-badge";
import { MapPin, Award, Droplets, Calendar, Heart, ShieldCheck } from "lucide-react";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${backendUrl}/api/v1/u/${username}`, { cache: "no-store" });
    if (!res.ok) return { title: "Donor Tidak Ditemukan" };
    const profile = await res.json();
    return {
      title: `${profile.full_name} — ${profile.blood_type}`,
      description: `Donor darah ${profile.blood_type} di ${profile.city || "Indonesia"}. ${profile.total_donations} donor, ${profile.total_points} poin.`,
      openGraph: {
        title: `${profile.full_name} — Profil Donor Darah`,
        description: `Donor darah ${profile.blood_type} di ${profile.city || "Indonesia"}.`,
      },
    };
  } catch {
    return { title: "Donor Tidak Ditemukan" };
  }
}

type UserBadge = {
  id: string;
  badge: { name: string; description: string; min_donations: number };
};

type PublicProfile = {
  full_name: string;
  blood_type: string;
  city: string;
  total_donations: number;
  total_points: number;
  availability_status: string;
  eligibility_status: string;
  last_donation_date?: string;
  gender: string;
  badges: UserBadge[];
};

async function getProfile(username: string): Promise<PublicProfile | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const res = await fetch(`${backendUrl}/api/v1/u/${username}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  const bloodDisplay = profile.blood_type;
  const badges = profile.badges || [];
  const topBadge = badges[0]?.badge?.name || "Donor";
  const isAvailable = profile.availability_status === "available" && profile.eligibility_status === "eligible";
  const liters = (profile.total_donations * 0.35).toFixed(1);
  const livesSaved = profile.total_donations * 3;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center">
        <AvatarWithBadge
          name={profile.full_name}
          size="xl"
          badge={{ label: topBadge, level: "gold" }}
        />
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">
          {profile.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">@{username}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <BloodTypeBadge type={bloodDisplay} size="md" />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {profile.city}
          </span>
          <StatusBadge status={profile.eligibility_status} dot />
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium ${
          isAvailable
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
        }`}>
          <div className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
          {isAvailable ? "Siap Donor" : profile.availability_status === "temporarily_unavailable" ? "Sedang Tidak Tersedia" : "Tidak Aktif"}
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-3">
          {badges.slice(0, 4).map((b) => (
            <GlassCard key={b.id} className="text-center py-3">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">
                <Award className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-[11px] font-medium text-foreground leading-tight">
                {b.badge.name}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <GlassCard className="text-center py-4">
          <Droplets className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 font-heading text-3xl font-bold text-foreground">{profile.total_donations}</p>
          <p className="text-xs text-muted-foreground">Donasi</p>
          <p className="text-xs text-[#94a3b8]">{liters} L</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <Heart className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 font-heading text-3xl font-bold text-emerald-600">{livesSaved}</p>
          <p className="text-xs text-muted-foreground">Nyawa</p>
          <p className="text-xs text-[#94a3b8]">Terselamatkan</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <ShieldCheck className="mx-auto h-5 w-5 text-amber-500" />
          <p className="mt-1 font-heading text-3xl font-bold text-foreground">{profile.total_points}</p>
          <p className="text-xs text-muted-foreground">Poin</p>
          <p className="text-xs text-[#94a3b8]">{badges.length} badge</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          Status Donor
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status Donor</span>
            <span className="font-medium">{profile.eligibility_status === "eligible" ? "Sehat" : profile.eligibility_status === "waiting_period" ? "Masa Tunggu" : profile.eligibility_status === "needs_clearance" ? "Perlu Izin Dokter" : "Tidak Memenuhi Syarat"}</span>
          </div>
          {profile.last_donation_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Donor Terakhir</span>
              <span className="font-medium">{formatDate(profile.last_donation_date)}</span>
            </div>
          )}
          {["waiting_period", "not_eligible", "needs_clearance"].includes(profile.eligibility_status) && profile.last_donation_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selesai Masa Tunggu</span>
              <span className="font-medium text-amber-600">{getRecoveryEndDate(profile.last_donation_date)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ketersediaan</span>
            <span className="font-medium">
              {profile.availability_status === "available" ? "Tersedia" : "Tidak Tersedia"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Kelamin</span>
            <span className="font-medium capitalize">{profile.gender === "male" ? "Laki-laki" : "Perempuan"}</span>
          </div>
        </div>
      </GlassCard>

      {badges.length > 0 && (
        <GlassCard className="mt-4">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
            Perjalanan Pahlawan
          </h3>
          <div className="space-y-3">
            {badges.slice(0, 3).map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  i === 0 ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  <Droplets className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.badge.name}</p>
                  <p className="text-xs text-muted-foreground">{b.badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="mt-6 text-center">
        <a
          href={`/requests/new?blood_type=${encodeURIComponent(profile.blood_type)}`}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700"
        >
          <Heart className="h-4 w-4" />
          Request Darah {bloodDisplay}
        </a>
        <p className="mt-2 text-xs text-[#94a3b8]">
          Terverifikasi melalui AmbilDarahku
        </p>
      </div>
    </div>
  );
}
