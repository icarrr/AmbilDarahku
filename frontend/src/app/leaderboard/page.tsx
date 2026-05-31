"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { RankBadge } from "@/components/rank-badge";
import { Trophy, Award, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type LeaderboardUser = {
  id: string;
  full_name: string;
  blood_type: string;
  rhesus: string;
  city: string;
  total_donations: number;
  total_points: number;
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [tab, setTab] = useState<"national" | "regional">("national");

  useEffect(() => {
    const endpoint = tab === "national"
      ? "/leaderboard/national"
      : `/leaderboard/regional?city=${encodeURIComponent(user?.city || "Jakarta Pusat")}`;
    api.get<{ leaderboard: LeaderboardUser[] }>(endpoint)
      .then(d => setUsers(d.leaderboard || []))
      .catch(() => {});
  }, [tab, user?.city]);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Peringkat Donor</h1>
          <p className="text-sm text-muted-foreground">Donor teraktif di Indonesia</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setTab("national")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "national" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Nasional
          </button>
          <button
            onClick={() => setTab("regional")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "regional" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Regional
          </button>
        </div>
      </div>

      {top3.length === 3 && (
        <div className="mb-10 flex items-end justify-center gap-4">
          <div className="order-1 text-center">
            <Medal className="mx-auto mb-1 h-5 w-5 text-slate-400" />
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-200 to-slate-300 shadow-md">
              <span className="text-2xl font-bold text-slate-700">2</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{top3[1].full_name}</p>
            <p className="text-xs text-muted-foreground">{top3[1].total_donations} donasi</p>
          </div>
          <div className="order-0 -mt-4 text-center">
            <Crown className="mx-auto mb-1 h-6 w-6 text-amber-500" />
            <div className="mx-auto mb-2 flex h-24 w-24 scale-110 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 shadow-lg shadow-amber-200 ring-2 ring-amber-300">
              <span className="text-3xl font-bold text-white">1</span>
            </div>
            <p className="text-sm font-bold text-foreground">{top3[0].full_name}</p>
            <p className="text-xs font-semibold text-amber-600">{top3[0].total_donations} donasi</p>
          </div>
          <div className="order-2 text-center">
            <Award className="mx-auto mb-1 h-5 w-5 text-amber-800" />
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-800 to-amber-900 shadow-md">
              <span className="text-2xl font-bold text-amber-100">3</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{top3[2].full_name}</p>
            <p className="text-xs text-muted-foreground">{top3[2].total_donations} donasi</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rest.map((user, i) => (
          <GlassCard
            key={user.id}
            className="flex items-center gap-3"
          >
            <div className="flex-shrink-0 w-8 text-center">
              <span className="text-sm font-bold text-[#94a3b8]">{i + 4}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-bold text-white">
              {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BloodTypeBadge type={`${user.blood_type}${user.rhesus}`} size="sm" />
                <span>{user.city}</span>
                <span className="font-medium text-red-600">{user.total_points} pts</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="font-heading text-lg font-bold text-foreground">{user.total_donations}</p>
              <p className="text-[10px] text-[#94a3b8]">donasi</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
