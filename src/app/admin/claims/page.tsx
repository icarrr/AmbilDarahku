"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { getFileUrl } from "@/lib/file-url";
import { Camera, FileText } from "lucide-react";

type ClaimWithUser = {
  id: string;
  user_id: string;
  donation_date: string;
  location: string;
  institution_name: string;
  blood_type: string;
  volume_ml: number;
  proof_photo_url: string | null;
  proof_document_url: string | null;
  additional_notes: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string;
  donor_blood_type: string;
  donor_city: string;
  donor_city_name?: string;
};

export default function AdminClaimsPage() {
  const { isAdmin } = useAuth();
  const [claims, setClaims] = useState<ClaimWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      const d = await api.get<{ claims: ClaimWithUser[] }>("/admin/claims");
      setClaims(d.claims || []);
    } catch {
      toast.error("Gagal memuat klaim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchClaims();
  }, [isAdmin]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }
    setSubmittingId(id);
    try {
      const body: Record<string, unknown> = { status };
      if (status === "rejected") body.rejection_reason = rejectionReason.trim();
      await api.put(`/admin/claims/${id}/review`, body);
      toast.success(status === "approved" ? "Klaim disetujui" : "Klaim ditolak");
      setSelectedClaim(null);
      setRejectionReason("");
      fetchClaims();
    } catch {
      toast.error("Gagal mereview klaim");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Klaim Donasi</h1>
        <p className="text-muted-foreground text-sm mt-1">Periksa dan setujui/tolak klaim riwayat donasi dari donor.</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Memuat...</p>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tidak ada klaim tertunda. Semua klaim sudah direview.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map(c => {
            const photoUrl = getFileUrl(c.proof_photo_url);
            const docUrl = getFileUrl(c.proof_document_url);
            const submitting = submittingId === c.id;
            return (
            <Card key={c.id} className="border-l-4 border-l-red-400">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{c.full_name}</CardTitle>
                    <CardDescription className="truncate">
                      {c.email} &middot; {c.phone}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="text-xs">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tanggal</span>
                    <p className="font-medium">{formatDate(c.donation_date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gol. Darah</span>
                    <p className="font-medium">{c.blood_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume</span>
                    <p className="font-medium">{(c.volume_ml / 1000).toFixed(2)} L</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokasi</span>
                    <p className="font-medium">{c.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Institusi</span>
                    <p className="font-medium">{c.institution_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Donor Kota</span>
                    <p className="font-medium">{c.donor_city_name || c.donor_city}</p>
                  </div>
                </div>

                {(photoUrl || docUrl || c.additional_notes) && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                    {photoUrl && (
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer"
                         className="text-primary hover:underline flex items-center gap-1.5 truncate">
                        <Camera className="h-4 w-4 shrink-0" /> Bukti Foto
                      </a>
                    )}
                    {docUrl && (
                      <a href={docUrl} target="_blank" rel="noopener noreferrer"
                         className="text-primary hover:underline flex items-center gap-1.5 truncate">
                        <FileText className="h-4 w-4 shrink-0" /> Bukti Dokumen
                      </a>
                    )}
                    {c.additional_notes && (
                      <p className="text-muted-foreground italic break-words">&ldquo;{c.additional_notes}&rdquo;</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                    onClick={() => handleReview(c.id, "approved")}>
                    {submitting && selectedClaim?.id !== c.id ? "Memproses…" : "Setujui"}
                  </Button>
                  <Button size="sm" variant="destructive"
                    disabled={submitting}
                    onClick={() => setSelectedClaim(selectedClaim?.id === c.id ? null : c)}>
                    Tolak
                  </Button>
                </div>

                {selectedClaim?.id === c.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-md space-y-2">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Alasan Penolakan</p>
                    <Input
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Masukkan alasan penolakan..."
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive"
                        disabled={submitting}
                        onClick={() => handleReview(c.id, "rejected")}>
                        {submitting ? "Memproses…" : "Konfirmasi Tolak"}
                      </Button>
                      <Button size="sm" variant="outline"
                        disabled={submitting}
                        onClick={() => { setSelectedClaim(null); setRejectionReason(""); }}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
