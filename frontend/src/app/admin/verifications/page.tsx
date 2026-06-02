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

type VerificationWithUser = {
  id: string;
  user_id: string;
  level: number;
  status: string;
  verifier_id: string | null;
  verifier_role: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string;
  blood_type: string;
  city: string;
  user_level: number;
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Level 1 - Mandiri",
  2: "Level 2 - Komunitas",
  3: "Level 3 - PMI",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-green-100 text-green-700",
};

export default function AdminVerificationsPage() {
  const { isAdmin } = useAuth();
  const [verifications, setVerifications] = useState<VerificationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchVerifications = async () => {
    try {
      const d = await api.get<{ verifications: VerificationWithUser[] }>("/admin/verifications");
      setVerifications(d.verifications || []);
    } catch {
      toast.error("Gagal memuat verifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchVerifications();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Akses ditolak.</p>
      </div>
    );
  }

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    try {
      const body: Record<string, unknown> = { status };
      if (notes.trim()) body.notes = notes.trim();
      await api.put(`/admin/verifications/${id}/review`, body);
      toast.success(status === "approved" ? "Verifikasi disetujui" : "Verifikasi ditolak");
      setActiveId(null);
      setNotes("");
      fetchVerifications();
    } catch {
      toast.error("Gagal mereview verifikasi");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Verifikasi Donor</h1>
        <p className="text-gray-500 text-sm mt-1">Tinjau dan setujui/tolak permintaan kenaikan level verifikasi donor.</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Memuat...</p>
      ) : verifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Tidak ada permintaan verifikasi tertunda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map(v => (
            <Card key={v.id} className="border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{v.full_name}</CardTitle>
                    <CardDescription>
                      {v.email} &middot; {v.phone} &middot; {v.city}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={LEVEL_COLORS[v.level] || ""}>
                      {LEVEL_LABELS[v.level] || `Level ${v.level}`}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700">Pending</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Gol. Darah</span>
                    <p className="font-medium">{v.blood_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kota</span>
                    <p className="font-medium">{v.city}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Level Saat Ini</span>
                    <p className="font-medium">{v.user_level}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Diminta</span>
                    <p className="font-medium">{formatDate(v.created_at)}</p>
                  </div>
                </div>

                {v.notes && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <span className="text-gray-500">Catatan pemohon:</span>
                    <p className="italic mt-1">{v.notes}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleReview(v.id, "approved")}>
                    Setujui (Level {v.level})
                  </Button>
                  <Button size="sm" variant="destructive"
                    onClick={() => setActiveId(activeId === v.id ? null : v.id)}>
                    Tolak
                  </Button>
                </div>

                {activeId === v.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-md space-y-2">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Catatan (opsional)</p>
                    <Input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Alasan penolakan..."
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive"
                        onClick={() => handleReview(v.id, "rejected")}>
                        Konfirmasi Tolak
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setActiveId(null); setNotes(""); }}>
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
