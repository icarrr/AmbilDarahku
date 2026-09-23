"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { Trophy, Award, Medal, Crown, Droplets, Flame, MapPin, TrendingUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardUser = {
  id: string;
  full_name: string;
  blood_type: string;
  city: string;
  city_name?: string;
  total_donations: number;
  total_points: number;
  last_donation_date?: string;
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [tab, setTab] = useState<"national" | "regional">("national");
  const [cityFilter, setCityFilter] = useState("");

  const effectiveCity = cityFilter.trim() || (tab === "regional" ? user?.city || "" : "");

  useEffect(() => {
    const endpoint = effectiveCity
      ? `/leaderboard/regional?city=${encodeURIComponent(effectiveCity)}`
      : "/leaderboard/national";
    api.get<{ leaderboard: LeaderboardUser[] }>(endpoint)
      .then(d => setUsers(d.leaderboard || []))
      .catch(() => {});
  }, [effectiveCity]);

  const topPoints = users[0]?.total_points || 1;
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const totalDonationsAll = users.reduce((sum, u) => sum + u.total_donations, 0);
  const isLoggedInUser = (id: string) => user?.id === id;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 text-center md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h1 className="font-heading text-2xl font-bold text-foreground">Peringkat Donor</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {effectiveCity
                ? `Donor teraktif di ${cityFilter.trim() ? cityFilter.trim() : (user?.city_name || user?.city || "")}`
                : "Donor teraktif seluruh Indonesia"}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => { setTab("national"); setCityFilter(""); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                !effectiveCity ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Trophy className="mr-1 inline h-3.5 w-3.5" />
              Nasional
            </button>
            <button
              onClick={() => { setTab("regional"); setCityFilter(""); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                effectiveCity ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Regional
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          placeholder="Cari berdasarkan kota..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-red-300 focus:ring-1 focus:ring-red-300"
        />
        {cityFilter && (
          <button onClick={() => setCityFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <GlassCard className="text-center py-3">
          <Droplets className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{users.length}</p>
          <p className="text-[10px] text-muted-foreground">Donor Listed</p>
        </GlassCard>
        <GlassCard className="text-center py-3">
          <TrendingUp className="mx-auto h-5 w-5 text-emerald-500" />
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{totalDonationsAll}</p>
          <p className="text-[10px] text-muted-foreground">Total Donasi</p>
        </GlassCard>
        <GlassCard className="text-center py-3">
          <Flame className="mx-auto h-5 w-5 text-orange-500" />
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{topPoints}</p>
          <p className="text-[10px] text-muted-foreground">Top Points</p>
        </GlassCard>
      </div>

      {top3.length === 3 && (
        <div className="mb-8 flex items-end justify-center gap-3 md:gap-5">
          <div className="order-1 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <Medal className="mx-auto mb-1 h-5 w-5 text-slate-400" />
            <div className="mx-auto mb-2 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-b from-slate-200 to-slate-300 shadow-md ring-1 ring-slate-300 md:h-20 md:w-20">
              <span className="text-2xl font-bold text-slate-700">2</span>
            </div>
            <div className="mx-auto mb-1 h-7 w-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
              {getInitials(top3[1].full_name)}
            </div>
            <p className="text-xs font-semibold text-foreground max-w-[80px] truncate">{top3[1].full_name}</p>
            <p className="text-[10px] text-muted-foreground">{top3[1].total_donations} donasi</p>
            <p className="text-[10px] font-medium text-red-600">{top3[1].total_points} pts</p>
          </div>
          <div className="order-0 -mt-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Crown className="mx-auto mb-1 h-6 w-6 text-amber-500 drop-shadow-lg" />
            <div className="mx-auto mb-2 flex h-[88px] w-[88px] scale-110 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-xl shadow-amber-200/50 ring-2 ring-amber-300 md:h-24 md:w-24">
              <span className="text-3xl font-bold text-white drop-shadow-sm">1</span>
            </div>
            <div className="mx-auto mb-1 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-amber-200 shadow-md">
              {getInitials(top3[0].full_name)}
            </div>
            <p className="text-sm font-bold text-foreground max-w-[90px] truncate">{top3[0].full_name}</p>
            <p className="text-xs font-semibold text-amber-600">{top3[0].total_donations} donasi</p>
            <p className="text-xs font-bold text-amber-700">{top3[0].total_points} pts</p>
          </div>
          <div className="order-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <Award className="mx-auto mb-1 h-5 w-5 text-amber-800" />
            <div className="mx-auto mb-2 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-b from-amber-800 to-amber-950 shadow-md ring-1 ring-amber-700 md:h-20 md:w-20">
              <span className="text-2xl font-bold text-amber-100">3</span>
            </div>
            <div className="mx-auto mb-1 h-7 w-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
              {getInitials(top3[2].full_name)}
            </div>
            <p className="text-xs font-semibold text-foreground max-w-[80px] truncate">{top3[2].full_name}</p>
            <p className="text-[10px] text-muted-foreground">{top3[2].total_donations} donasi</p>
            <p className="text-[10px] font-medium text-red-600">{top3[2].total_points} pts</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rest.map((entry, i) => {
          const rank = i + 4;
          const isMe = isLoggedInUser(entry.id);
          return (
            <GlassCard
              key={entry.id}
              className={cn(
                "flex items-center gap-3 transition-all hover:shadow-md",
                isMe && "ring-2 ring-red-300 bg-red-50/40",
              )}
            >
              <div className="flex-shrink-0 w-7 text-center">
                <span className="text-xs font-bold text-[#94a3b8]">{rank}</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xs font-bold text-white shadow-sm">
                {getInitials(entry.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">{entry.full_name}</p>
                  {isMe && (
                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">KAMU</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BloodTypeBadge type={entry.blood_type} size="sm" />
                  <span className="truncate">{entry.city_name || entry.city}</span>
                </div>
                <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
                    style={{ width: `${(entry.total_points / topPoints) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-heading text-base font-bold text-foreground">{entry.total_donations}</p>
                <p className="text-[10px] text-[#94a3b8]">donasi</p>
                <p className="text-[10px] font-medium text-red-600">{entry.total_points} pts</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {users.length > 3 && (
        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-[#94a3b8]">
          <Flame className="h-3 w-3" />
          <span>Total {users.length} donor terdaftar</span>
        </div>
      )}
    </div>
  );
}
