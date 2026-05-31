"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Button } from "@/components/ui/button";
import { Droplets, MapPin, Plus, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type BloodRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  rhesus: string;
  hospital: string;
  city: string;
  urgency: string;
  bags: number;
  fulfilled_bags: number;
  created_at: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ requests: BloodRequest[] }>("/requests", false)
      .then(d => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Permintaan Darah</h1>
          <p className="text-sm text-muted-foreground">Daftar permintaan donor darah terbuka</p>
        </div>
        <Button onClick={() => router.push("/requests/new")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Buat Permintaan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-200" />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada permintaan darah terbuka</p>
          <p className="text-xs text-[#94a3b8]">Saat ini semua permintaan telah terpenuhi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} onClick={() => router.push(`/requests/share/${req.id}`)} className="cursor-pointer">
              <GlassCard>
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
                        <BloodTypeBadge type={`${req.blood_type}${req.rhesus}`} size="sm" />
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{req.hospital}{req.city ? `, ${req.city}` : ""}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#94a3b8]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(req.created_at)}
                        </span>
                        <span>{req.bags - (req.fulfilled_bags || 0)}/{req.bags} kantong</span>
                      </div>
                      {(req.fulfilled_bags || 0) > 0 && (
                        <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min((req.fulfilled_bags / req.bags) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <UrgencyBadge level={req.urgency} />
                  </div>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
