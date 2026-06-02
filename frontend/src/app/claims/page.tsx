"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle, XCircle, FileText, Trash2, ScrollText } from "lucide-react";

type ClaimData = {
  id: string;
  donation_date: string;
  location: string;
  institution_name: string;
  blood_type: string;
  volume_ml: number;
  status: string;
  rejection_reason?: string;
  created_at: string;
};

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get<{ claims: ClaimData[] }>("/claims")
      .then(d => setClaims(d.claims || []))
      .catch(() => toast.error("Gagal memuat klaim"))
      .finally(() => setLoading(false));
  }, [user]);

  const cancelClaim = async (id: string) => {
    try {
      await api.delete(`/claims/${id}`);
      setClaims(prev => prev.filter(c => c.id !== id));
      toast.success("Klaim dibatalkan");
    } catch {
      toast.error("Gagal membatalkan klaim");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Klaim Riwayat Donor
        </h1>
        <Link href="/claims/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Klaim Baru
          </Button>
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajukan klaim untuk donasi lama yang belum tercatat.
      </p>

      {loading && (
        <div className="mt-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}><SkeletonCard /></div>)}
        </div>
      )}

      {!loading && claims.length === 0 && (
        <div className="mt-12 text-center animate-fade-in">
          <ScrollText className="mx-auto h-14 w-14 text-gray-200" />
          <p className="mt-3 font-medium text-foreground">Belum ada klaim</p>
          <p className="text-sm text-muted-foreground">Ajukan klaim untuk donasi yang belum tercatat di riwayat.</p>
          <Link href="/claims/new">
            <Button className="mt-4"><Plus className="h-4 w-4 mr-1" /> Ajukan Klaim</Button>
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {claims.map((claim, i) => (
          <GlassCard key={claim.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  claim.status === "approved" ? "bg-emerald-100" :
                  claim.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {claim.status === "approved" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : claim.status === "rejected" ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {formatDate(claim.donation_date)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {claim.location}{claim.institution_name ? ` • ${claim.institution_name}` : ""}
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    {(claim.volume_ml / 1000).toFixed(2)} L • {claim.blood_type || "—"}
                  </p>
                  {claim.status === "rejected" && claim.rejection_reason && (
                    <p className="mt-1 text-xs text-red-600">
                      Alasan: {claim.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  claim.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  claim.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {claim.status === "approved" ? "Disetujui" :
                   claim.status === "rejected" ? "Ditolak" : "Menunggu"}
                </span>
                {claim.status === "pending" && (
                  <button
                    onClick={() => cancelClaim(claim.id)}
                    className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
