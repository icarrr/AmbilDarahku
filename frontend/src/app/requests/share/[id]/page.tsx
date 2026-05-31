"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { Droplets, Hospital, User, ArrowLeft, CheckCircle, HeartHandshake } from "lucide-react";
import { compatibleDonorsFor, canDonateTo } from "@/lib/blood-compatibility";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  contact_phone?: string;
  notes?: string;
  status: string;
};

type Fulfillment = {
  id: string;
  donor_id: string;
  donor_name: string;
  bags: number;
  created_at: string;
};

export default function ShareCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [donorBags, setDonorBags] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    api.get<{ request: BloodRequest }>(`/requests/${id}`)
      .then(d => setRequest(d.request))
      .catch(() => setRequest(null));

    api.get<{ fulfillments: Fulfillment[] }>(`/requests/${id}/fulfillments`, false)
      .then(d => setFulfillments(d.fulfillments || []))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api.get<{ request: BloodRequest }>(`/requests/${id}`),
      api.get<{ fulfillments: Fulfillment[] }>(`/requests/${id}/fulfillments`, false),
    ]).then(([req, fulf]) => {
      setRequest(req.request);
      setFulfillments(fulf.fulfillments || []);
    }).catch(() => setRequest(null))
    .finally(() => setLoading(false));
  }, [id]);

  const handleFulfill = async () => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu");
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/requests/${id}/fulfill`, { bags: donorBags });
      toast.success("Donasi tercatat! Terima kasih.");
      setShowForm(false);
      setDonorBags(1);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mencatat donasi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent mx-auto" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Permintaan tidak ditemukan</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/")}>
          Kembali
        </Button>
      </div>
    );
  }

  const bloodDisplay = `${request.blood_type}${request.rhesus}`;
  const userBloodDisplay = user ? `${user.blood_type}${user.rhesus}` : "";
  const isCompatible = user ? canDonateTo(userBloodDisplay, bloodDisplay) : false;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const remaining = request.bags - (request.fulfilled_bags || 0);
  const progress = request.bags > 0 ? ((request.fulfilled_bags || 0) / request.bags) * 100 : 0;
  const isFulfilled = request.status === "fulfilled" || remaining <= 0;

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="overflow-hidden rounded-2xl border-2 border-red-500 shadow-xl">
        <div className="bg-red-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-white" />
              <span className="text-sm font-bold text-white">PERMINTAAN DARAH</span>
            </div>
            <UrgencyBadge level={request.urgency} />
          </div>
        </div>

        <div className="bg-white px-6 py-8">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
            BUTUH DONOR DARAH SEGERA
          </p>

          <div className="mb-6 text-center">
            <BloodTypeBadge type={bloodDisplay} size="lg" className="text-3xl px-6 py-3" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {bloodDisplay === "B-" ? "B NEGATIF • SANGAT LANGKA" : `${bloodDisplay} • ${request.rhesus === "+" ? "Rhesus Positif" : "Rhesus Negatif"}`}
            </p>
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Donor yang Cocok</p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                {compatibleDonorsFor(bloodDisplay).map((t) => (
                  <span key={t} className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-red-600 shadow-sm">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6 flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                request.urgency === "critical"
                  ? "bg-red-100 text-red-700"
                  : request.urgency === "urgent"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {request.urgency === "critical" && <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />}
              {request.urgency === "critical" ? "KRITIS" : request.urgency === "urgent" ? "MENDESAK" : "BIASA"}
            </span>
          </div>

          {isFulfilled ? (
            <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-1 text-sm font-bold text-emerald-700">Permintaan Terpenuhi</p>
              <p className="text-xs text-emerald-600">{request.bags} kantong telah terkumpul</p>
            </div>
          ) : (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{remaining} kantong lagi dibutuhkan</span>
                <span className="text-xs text-[#94a3b8]">{request.fulfilled_bags || 0} / {request.bags} terpenuhi</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nama Pasien</p>
                <p className="text-sm font-semibold text-foreground">{request.patient_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hospital className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Lokasi Rumah Sakit</p>
                <p className="text-sm font-semibold text-foreground">{request.hospital}{request.city ? `, ${request.city}` : ""}</p>
              </div>
            </div>
          </div>

          {request.contact_phone && (
            <a
              href={`https://wa.me/${request.contact_phone}?text=${encodeURIComponent(
                `Halo, saya ingin membantu donor darah untuk:\n\n` +
                `🩸 Golongan Darah: ${bloodDisplay}\n` +
                `👤 Pasien: ${request.patient_name}\n` +
                `🏥 Rumah Sakit: ${request.hospital}${request.city ? `, ${request.city}` : ""}\n` +
                `📦 Kebutuhan: ${request.bags} kantong (${remaining} tersisa)\n` +
                `⚠️ Urgensi: ${request.urgency === "critical" ? "KRITIS" : request.urgency === "urgent" ? "MENDESAK" : "Biasa"}\n\n` +
                `Mohon info lebih lanjut. Terima kasih.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              <Droplets className="h-4 w-4" />
              Hubungi Via WhatsApp
            </a>
          )}
        </div>
      </div>

      {!isFulfilled && (
        <GlassCard className="mt-4 p-4">
          {!showForm ? (
            <div className="relative group">
              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Silakan masuk terlebih dahulu");
                    router.push("/login");
                    return;
                  }
                  if (!isCompatible) return;
                  setShowForm(true);
                }}
                disabled={!isCompatible}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
                  isCompatible
                    ? "bg-red-600 hover:bg-red-700"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                <HeartHandshake className="h-4 w-4" />
                Saya Sudah Donor
              </button>
              {!isCompatible && user && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Golongan darah Anda ({userBloodDisplay}) tidak cocok untuk pasien ({bloodDisplay})
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Catat Donasi Anda</h4>
              <p className="text-xs text-muted-foreground">
                Berapa kantong darah yang Anda donasikan untuk pasien ini?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDonorBags(Math.max(1, donorBags - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold hover:bg-gray-50"
                >
                  -
                </button>
                <Input
                  type="number"
                  min={1}
                  value={donorBags}
                  onChange={e => setDonorBags(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8 w-16 text-center"
                />
                <button
                  type="button"
                  onClick={() => setDonorBags(donorBags + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold hover:bg-gray-50"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground">kantong</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setShowForm(false); setDonorBags(1); }}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={submitting}
                  onClick={handleFulfill}
                >
                  {submitting ? "Menyimpan..." : "Konfirmasi"}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {fulfillments.length > 0 && (
        <GlassCard className="mt-4 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            <HeartHandshake className="mr-1.5 inline h-4 w-4 text-red-500" />
            Pahlawan yang sudah membantu
          </h4>
          <div className="space-y-2">
            {fulfillments.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    {f.donor_name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.donor_name}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{f.bags} kantong</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
