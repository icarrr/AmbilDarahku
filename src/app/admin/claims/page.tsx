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
import { getFileUrl } from "@/lib/file";

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
};

export default function AdminClaimsPage() {
  const { isAdmin } = useAuth();
  const [claims, setClaims] = useState<ClaimWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Akses ditolak.</p>
      </div>
    );
  }

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }
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
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Klaim Donasi</h1>
        <p className="text-gray-500 text-sm mt-1">Periksa dan setujui/tolak klaim riwayat donasi dari donor.</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Memuat...</p>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Tidak ada klaim tertunda. Semua klaim sudah direview.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map(c => (
            <Card key={c.id} className="border-l-4 border-l-red-400">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{c.full_name}</CardTitle>
                    <CardDescription>
                      {c.email} &middot; {c.phone}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="text-xs">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tanggal</span>
                    <p className="font-medium">{formatDate(c.donation_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gol. Darah</span>
                    <p className="font-medium">{c.blood_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <p className="font-medium">{(c.volume_ml / 1000).toFixed(2)} L</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Lokasi</span>
                    <p className="font-medium">{c.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Institusi</span>
                    <p className="font-medium">{c.institution_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Donor Kota</span>
                    <p className="font-medium">{c.donor_city}</p>
                  </div>
                </div>

                {(c.proof_photo_url || c.proof_document_url || c.additional_notes) && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                    {c.proof_photo_url && (
                      <a href={getFileUrl(c.proof_photo_url) || ""} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:underline block truncate">
                        📷 Bukti Foto
                      </a>
                    )}
                    {c.proof_document_url && (
                      <a href={getFileUrl(c.proof_document_url) || ""} target="_blank" rel="noopener noreferrer"
                         className="text-blue-600 hover:underline block truncate">
                        📄 Bukti Dokumen
                      </a>
                    )}
                    {c.additional_notes && (
                      <p className="text-gray-600 italic">&ldquo;{c.additional_notes}&rdquo;</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleReview(c.id, "approved")}>
                    Setujui
                  </Button>
                  <Button size="sm" variant="destructive"
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
                        onClick={() => handleReview(c.id, "rejected")}>
                        Konfirmasi Tolak
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setSelectedClaim(null); setRejectionReason(""); }}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
