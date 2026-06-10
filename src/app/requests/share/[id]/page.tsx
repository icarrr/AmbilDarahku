"use client";

import { useEffect, useState, use } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Droplets, Hospital, User, ArrowLeft, HeartHandshake, MessageCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAppUrl } from "@/lib/url";
import { toast } from "sonner";

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
  const { user, isUnverified } = useAuth();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) {
      api.get<{ eligibility_status: string }>("/donor-status")
        .then(d => setEligibilityStatus(d.eligibility_status))
        .catch(() => setEligibilityStatus(null));
    } else {
      setEligibilityStatus(null);
    }
  }, [user]);

  const handleFulfill = async () => {
    setSubmitting(true);
    try {
      await api.post(`/requests/${id}/fulfill`, { bags: 1 });
      toast.success("Donasi tercatat! Terima kasih.");
      setConfirmOpen(false);
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

  const bloodDisplay = request.blood_type;
  const userBloodDisplay = user ? user.blood_type : "";
  const baseType = (t: string) => t.replace(/[+-]$/, "");
  const compatibleBase: Record<string, string[]> = {
    O: ["O"], A: ["O", "A"], B: ["O", "B"], AB: ["O", "A", "B", "AB"],
  };
  const compatibleForRequest = compatibleBase[baseType(bloodDisplay)] || [];
  const isCompatible = user ? compatibleForRequest.includes(baseType(userBloodDisplay)) : true;
  const isWaitingOrIneligible = !!user && eligibilityStatus != null && eligibilityStatus !== "eligible";
  const isButtonDisabled = !isCompatible || isWaitingOrIneligible || !user || isUnverified;
  const pageUrl = getAppUrl() + window.location.pathname;
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

        <div className="bg-white px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-center">
              <BloodTypeBadge type={bloodDisplay} size="lg" className="text-3xl px-5 py-3" />
              {!isFulfilled && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Donor cocok</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {compatibleForRequest.map(t => (
                      <span key={t} className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    request.urgency === "critical"
                      ? "bg-red-100 text-red-700"
                      : request.urgency === "urgent"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {request.urgency === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />}
                  {request.urgency === "critical" ? "KRITIS" : request.urgency === "urgent" ? "MENDESAK" : "BIASA"}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">BUTUH DONOR DARAH SEGERA</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="text-sm font-semibold text-foreground">{request.patient_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hospital className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="text-xs text-muted-foreground">{request.hospital}{request.city ? `, ${request.city}` : ""}</span>
                </div>
              </div>

              {isFulfilled ? (
                <div className="mt-3 rounded-lg bg-emerald-50 p-2 text-center">
                  <p className="text-xs font-bold text-emerald-700">Permintaan Terpenuhi</p>
                  <p className="text-[10px] text-emerald-600">{request.bags} kantong terkumpul</p>
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{remaining} kantong lagi</span>
                    <span className="text-[#94a3b8]">{request.fulfilled_bags || 0}/{request.bags}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
            <div className="flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(pageUrl)}`}
                alt="QR Code"
                className="rounded-lg"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Hubungi / Scan</p>
              {request.contact_phone ? (
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
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {request.contact_phone}
                </a>
              ) : (
                <p className="text-[10px] text-[#94a3b8]">Scan QR untuk membuka halaman permintaan</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isFulfilled && (
        <GlassCard className="mt-4 p-4">
          <div className="relative group">
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Silakan masuk terlebih dahulu");
                  router.push("/login");
                  return;
                }
                if (isUnverified) {
                  toast.error("Verifikasi email terlebih dahulu");
                  router.push("/verify-email");
                  return;
                }
                if (isWaitingOrIneligible) return;
                if (!isCompatible) return;
                setConfirmOpen(true);
              }}
              disabled={isButtonDisabled}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
                isButtonDisabled
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isWaitingOrIneligible ? <AlertCircle className="h-4 w-4" /> : <HeartHandshake className="h-4 w-4" />}
              {isWaitingOrIneligible ? "Dalam Masa Tunggu" : "Saya Sudah Donor"}
            </button>
            {isButtonDisabled && user && (
              <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {isUnverified
                  ? "Verifikasi email terlebih dahulu"
                  : !isCompatible
                    ? `Golongan darah Anda (${userBloodDisplay}) tidak cocok untuk pasien (${bloodDisplay})`
                    : eligibilityStatus === "waiting_period"
                      ? "Anda masih dalam masa tunggu donor"
                      : eligibilityStatus === "not_eligible"
                        ? "Anda belum memenuhi syarat donor"
                        : "Silakan masuk untuk donor"}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        </GlassCard>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleFulfill}
        onCancel={() => setConfirmOpen(false)}
        title="Konfirmasi Donasi"
        description="Apakah Anda yakin sudah melakukan donor untuk pasien ini? Donasi akan dicatat ke dalam riwayat Anda."
        confirmText="Ya, Saya Yakin"
        loading={submitting}
      />

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
