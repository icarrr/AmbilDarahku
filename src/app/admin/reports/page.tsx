"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function AdminReportsPage() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("open");
  const [loading, setLoading] = useState(true);

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

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Akses ditolak.</p>
      </div>
    );
  }

  const setStatusOf = async (id: string, s: string) => {
    try {
      await api.put(`/admin/reports/${id}`, { status: s });
      toast.success("Status diperbarui");
      fetchReports();
    } catch {
      toast.error("Gagal memperbarui");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Penyalahgunaan</h1>
          <p className="text-gray-500 text-sm mt-1">Tinjau laporan dari pengguna.</p>
        </div>
        <div className="flex gap-2">
          {["open", "resolved", "dismissed", "all"].map(s => (
            <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>
              {s === "open" ? "Terbuka" : s === "resolved" ? "Selesai" : s === "dismissed" ? "Ditolak" : "Semua"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Memuat...</p>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">Tidak ada laporan.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-red-500" />
                      <Badge variant="outline">{r.target_type}</Badge>
                      <Badge variant="secondary" className="text-xs">{REASON_LABELS[r.reason] || r.reason}</Badge>
                      <Badge variant={r.status === "open" ? "destructive" : "secondary"} className="text-xs">{r.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Target: <span className="font-mono">{r.target_id}</span> &middot; Pelapor: {r.reporter_name || "anonim"} &middot; {formatDate(r.created_at)}
                    </p>
                    {r.notes && (
                      <p className="mt-2 text-sm text-gray-700 rounded-lg bg-gray-50 px-3 py-2">&ldquo;{r.notes}&rdquo;</p>
                    )}
                  </div>
                  {r.status === "open" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStatusOf(r.id, "resolved")}>Tandai Selesai</Button>
                      <Button size="sm" variant="outline" onClick={() => setStatusOf(r.id, "dismissed")}>Tolak</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}