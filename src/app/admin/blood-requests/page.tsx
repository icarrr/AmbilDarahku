"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { toast } from "sonner";
import { Droplets, MapPin, Clock, CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type BloodRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  hospital: string;
  city: string;
  city_name?: string;
  bags: number;
  fulfilled_bags: number;
  urgency: string;
  status: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  requester_name?: string | null;
};

export default function AdminBloodRequestsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  const fetchRequests = () => {
    api.get<{ requests: BloodRequest[] }>("/admin/blood-requests")
      .then(d => setRequests(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin]);

  const handleFulfill = async (id: string) => {
    setFulfilling(id);
    try {
      await api.put(`/admin/blood-requests/${id}/fulfill`, {
        notes: "Donasi langsung (tidak via aplikasi)",
      });
      toast.success("Permintaan ditandai terpenuhi");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Gagal");
    } finally {
      setFulfilling(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Akses ditolak. Halaman ini hanya untuk admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen Permintaan Darah</h1>
        <Button variant="outline" size="sm" onClick={() => router.push("/requests/new")}>
          <Plus className="h-4 w-4 mr-1" /> Buat Permintaan
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-20" /></Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-200" />
            <p className="mt-2 font-medium text-foreground">Semua permintaan terpenuhi</p>
            <p className="text-xs text-muted-foreground">Tidak ada permintaan yang perlu ditindaklanjuti</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const remaining = req.bags - (req.fulfilled_bags || 0);
            return (
              <Card key={req.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
                        <Droplets className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{req.patient_name}</p>
                          <BloodTypeBadge type={req.blood_type} size="sm" />
                          {req.urgency === "critical" && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">KRITIS</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{req.hospital}{req.city ? `, ${req.city_name || req.city}` : ""}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[#94a3b8]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.created_at).toLocaleDateString("id-ID")}
                          </span>
                          <span>{remaining}/{req.bags} sisa</span>
                          {req.requester_name && <span>oleh {req.requester_name}</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleFulfill(req.id)}
                      disabled={fulfilling === req.id}
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      {fulfilling === req.id ? "..." : "Tandai Terpenuhi"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
