"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Droplets, MapPin, Plus, Clock, AlertTriangle, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type BloodRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  hospital: string;
  city: string;
  urgency: string;
  bags: number;
  fulfilled_bags: number;
  contact_phone?: string;
  notes?: string;
  created_at: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const { user, isUnverified } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUnverified) { router.replace("/verify-email"); return; }
    api.get<{ requests: BloodRequest[] }>("/requests", false)
      .then(d => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isUnverified, router]);

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
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}><SkeletonCard /></div>)}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center animate-fade-in">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-3 font-medium text-foreground">Belum ada permintaan darah</p>
          <p className="text-sm text-muted-foreground">Saat ini semua permintaan telah terpenuhi</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/requests/new")}>
            <Plus className="h-4 w-4 mr-1" /> Buat Permintaan
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <div key={req.id} onClick={() => router.push(`/requests/share/${req.id}`)} className={`cursor-pointer animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
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
                        <BloodTypeBadge type={req.blood_type} size="sm" />
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
                      {req.contact_phone && (
                        <a
                          href={`https://wa.me/${req.contact_phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                          onClick={e => e.stopPropagation()}
                        >
                          <MessageCircle className="h-3 w-3" />
                          {req.contact_phone}
                        </a>
                      )}
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
