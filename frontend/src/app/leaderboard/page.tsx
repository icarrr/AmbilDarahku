"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [national, setNational] = useState<LeaderboardUser[]>([]);
  const [tab, setTab] = useState<"national" | "regional">("national");

  useEffect(() => {
    api.get<{ leaderboard: LeaderboardUser[] }>("/leaderboard/national")
      .then(d => setNational(d.leaderboard))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Peringkat Donor</h1>
        <div className="flex gap-2">
          <Button variant={tab === "national" ? "default" : "outline"} size="sm" onClick={() => setTab("national")}>
            Nasional
          </Button>
          <Button variant={tab === "regional" ? "default" : "outline"} size="sm" onClick={() => setTab("regional")}>
            Regional
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {national.map((user, i) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {user.blood_type}{user.rhesus} &middot; {user.city}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline">{user.total_donations}x donor</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
