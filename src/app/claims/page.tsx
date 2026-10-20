"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SkeletonCard } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Clock, CheckCircle, XCircle, FileText, Trash2, ScrollText, Loader2, LogIn } from "lucide-react";

type ClaimData = {
  id: string;
  donation_date: string;
  location: string;
  institution_name: string;
  blood_type: string;
  volume_ml?: number | null;
  status: string;
  rejection_reason?: string;
  created_at: string;
};

export default function ClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ClaimData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Async-only state updates so it can run from an effect; retry resets state first.
  const loadClaims = useCallback(() => {
    api.get<{ claims: ClaimData[] }>("/claims")
      .then(d => setClaims(d.claims || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) loadClaims();
  }, [user, loadClaims]);

  const cancelClaim = async (id: string) => {
    setCancelling(true);
    try {
      await api.delete(`/claims/${id}`);
      setClaims(prev => prev.filter(c => c.id !== id));
      toast.success("Klaim dibatalkan");
    } catch {
      toast.error("Gagal membatalkan klaim");
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  if (authLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-center text-muted-foreground">Memuat...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-10 text-center">
          <LogIn className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="font-heading text-lg font-bold text-foreground">Masuk untuk Melihat Klaim</h2>
          <p className="mt-1 text-sm text-muted-foreground">Silakan masuk untuk mengajukan dan memantau klaim riwayat donor.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>Masuk</Link>
            <Link href="/register" className={buttonVariants({ variant: "outline", className: "w-full" })}>Daftar Akun</Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Klaim Riwayat Donor
        </h1>
        <Link href="/claims/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1 h-4 w-4" />
          Klaim Baru
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

      {!loading && loadError && (
        <GlassCard className="mt-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Klaim belum dapat dimuat.</p>
          <p className="mt-1 text-xs text-muted-foreground">Periksa koneksi Anda lalu coba lagi.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setLoading(true); setLoadError(false); loadClaims(); }}>Coba Lagi</Button>
        </GlassCard>
      )}

      {!loading && !loadError && claims.length === 0 && (
        <div className="mt-12 text-center animate-fade-in">
          <ScrollText className="mx-auto h-14 w-14 text-muted-foreground/40" />
          <p className="mt-3 font-medium text-foreground">Belum ada klaim</p>
          <p className="text-sm text-muted-foreground">Ajukan klaim untuk donasi yang belum tercatat di riwayat.</p>
          <Link href="/claims/new" className={buttonVariants({ className: "mt-4" })}>
            <Plus className="h-4 w-4 mr-1" /> Ajukan Klaim
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {claims.map((claim, i) => (
          <GlassCard key={claim.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
            <div className="flex items-start justify-between gap-2">
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
                  <p className="text-xs text-muted-foreground">
                    {typeof claim.volume_ml === "number" && Number.isFinite(claim.volume_ml)
                      ? `${(claim.volume_ml / 1000).toFixed(2)} L`
                      : "—"} • {claim.blood_type || "—"}
                  </p>
                  {claim.status === "rejected" && claim.rejection_reason && (
                    <p className="mt-1 text-xs text-red-600">
                      Alasan: {claim.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={claim.status} />
                {claim.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(claim)}
                    disabled={cancelling && cancelTarget?.id === claim.id}
                    aria-label="Batalkan klaim"
                    title="Batalkan klaim"
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {cancelling && cancelTarget?.id === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        onCancel={() => { if (!cancelling) setCancelTarget(null); }}
        onConfirm={() => { if (cancelTarget) cancelClaim(cancelTarget.id); }}
        title="Batalkan klaim?"
        description={cancelTarget ? `Klaim donor ${formatDate(cancelTarget.donation_date)} akan dibatalkan dan tidak dapat dikembalikan.` : ""}
        confirmText="Batalkan Klaim"
        cancelText="Kembali"
        loading={cancelling}
        variant="destructive"
      />
    </div>
  );
}
