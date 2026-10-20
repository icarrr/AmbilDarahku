"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Flag } from "lucide-react";

type Report = {
  id: string;
  target_type: "blood_request" | "donor" | "event";
  target_id: string;
  reason: string;
  notes: string | null;
  reporter_name: string | null;
  status: string;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  fraud: "Penipuan",
  money_request: "Meminta uang",
  contact_abuse: "Penyalahgunaan kontak",
  suspicious_account: "Akun mencurigakan",
  invalid_info: "Informasi tidak valid",
  other: "Lainnya",
};

const TARGET_LABELS: Record<string, string> = {
  blood_request: "Permintaan darah",
  donor: "Profil",
  user: "Profil",
  profile: "Profil",
  event: "Event",
};

const STATUS_FILTERS = [
  { value: "open", label: "Terbuka" },
  { value: "resolved", label: "Selesai" },
  { value: "dismissed", label: "Diabaikan" },
  { value: "all", label: "Semua" },
];

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground py-8">Memuat...</p>}>
      <AdminReportsContent />
    </Suspense>
  );
}

function AdminReportsContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = STATUS_FILTERS.some(f => f.value === statusParam) ? statusParam! : "open";
  const setStatus = (s: string) => {
    router.replace(s === "open" ? pathname : `${pathname}?status=${s}`, { scroll: false });
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDismiss, setConfirmDismiss] = useState<Report | null>(null);

  const fetchReports = () => {
    setLoading(true);
    api.get<{ reports: Report[] }>(`/admin/reports?status=${status}`)
      .then(d => setReports(d.reports || []))
      .catch(() => toast.error("Gagal memuat laporan"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) fetchReports();
  }, [isAdmin, status]);

  const setStatusOf = async (id: string, s: string) => {
    setPendingId(id);
    try {
      await api.put(`/admin/reports/${id}`, { status: s });
      toast.success("Status diperbarui");
      fetchReports();
    } catch {
      toast.error("Gagal memperbarui");
    } finally {
      setPendingId(null);
      setConfirmDismiss(null);
    }
  };

  const targetHref = (r: Report): string | null => {
    if (r.target_type === "blood_request") return `/requests/share/${r.target_id}`;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Penyalahgunaan</h1>
          <p className="text-muted-foreground text-sm mt-1">Tinjau laporan dari pengguna.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <Button key={f.value} variant={status === f.value ? "default" : "outline"} size="sm"
              aria-pressed={status === f.value} onClick={() => setStatus(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Memuat...</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Tidak ada laporan.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const href = targetHref(r);
            const pending = pendingId === r.id;
            return (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Flag className="h-4 w-4 text-red-500" />
                      <Badge variant="outline">{TARGET_LABELS[r.target_type] || r.target_type}</Badge>
                      <Badge variant="secondary" className="text-xs">{REASON_LABELS[r.reason] || r.reason}</Badge>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Target:{" "}
                      {href ? (
                        <Link href={href} target="_blank" className="font-mono break-all text-primary hover:underline">{r.target_id}</Link>
                      ) : (
                        <span className="font-mono break-all">{r.target_id}</span>
                      )}{" "}
                      &middot; Pelapor: {r.reporter_name || "anonim"} &middot; {formatDate(r.created_at)}
                    </p>
                    {r.notes && (
                      <p className="mt-2 text-sm text-foreground rounded-lg bg-muted px-3 py-2 break-words">&ldquo;{r.notes}&rdquo;</p>
                    )}
                  </div>
                  {r.status === "open" && (
                    <div className="flex flex-wrap gap-2 sm:flex-col flex-shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={pending}
                        onClick={() => setStatusOf(r.id, "resolved")}>
                        {pending && !confirmDismiss ? "Memproses…" : "Tandai Selesai"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => setConfirmDismiss(r)}>Abaikan</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDismiss}
        variant="destructive"
        title="Abaikan laporan ini?"
        description={confirmDismiss ? (
          <>
            Laporan &ldquo;{REASON_LABELS[confirmDismiss.reason] || confirmDismiss.reason}&rdquo; terhadap{" "}
            {(TARGET_LABELS[confirmDismiss.target_type] || confirmDismiss.target_type).toLowerCase()} ini akan ditandai
            diabaikan tanpa tindakan.
          </>
        ) : null}
        confirmText="Abaikan"
        loading={!!confirmDismiss && pendingId === confirmDismiss.id}
        onConfirm={() => confirmDismiss && setStatusOf(confirmDismiss.id, "dismissed")}
        onCancel={() => setConfirmDismiss(null)}
      />
    </div>
  );
}