"use client";

import { useEffect, useState, use, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BloodTypeBadge } from "@/components/blood-type-badge";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Droplets, Hospital, User, ArrowLeft, HeartHandshake, MessageCircle, AlertCircle, Share2, Camera, Copy, Check, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAppUrl } from "@/lib/url";
import { toast } from "sonner";
import { toBlob } from "html-to-image";
import { coordinatorWaLink } from "@/lib/coordinator";
import { ReportDialog } from "@/components/report-dialog";

type BloodRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  hospital: string;
  city: string;
  city_name?: string;
  urgency: string;
  bags: number;
  fulfilled_bags: number;
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
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const captureAndShare = async () => {
    if (!cardRef.current || !request) return;
    setSharing(true);
    try {
      const blob = await toBlob(cardRef.current, { cacheBust: true });
      if (!blob) throw new Error("Gagal mengambil gambar");
      const file = new File([blob], "permintaan-darah.png", { type: "image/png" });

      // Web Share API with image → native share sheet shows Instagram/WA/FB
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Permintaan Donor Darah",
          text: `Butuh donor darah ${bloodDisplay} untuk ${request.patient_name} di ${request.hospital}`,
        });
      } else {
        // Fallback: download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `permintaan-darah-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Gambar berhasil diunduh");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        toast.error("Gagal membagikan");
      }
    } finally {
      setSharing(false);
    }
  };

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

  const shareMessage = `Ada permintaan darah!

🩸 Golongan Darah: ${bloodDisplay}
👤 Pasien: ${request.patient_name}
🏥 ${request.hospital}${request.city ? `, ${request.city_name || request.city}` : ""}
📦 Butuh: ${remaining} kantong${request.urgency === "critical" ? " ⚠️ KRITIS" : request.urgency === "urgent" ? " ⚠️ MENDESAK" : ""}

${pageUrl}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareMessage).then(() => {
      setLinkCopied(true);
      toast.success("Pesan disalin");
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {
      toast.error("Gagal menyalin pesan");
    });
  };

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div ref={cardRef} className="p-4 bg-white rounded-2xl">
        <div className="overflow-hidden rounded-2xl border-2 border-red-500 shadow-xl bg-white">
          <div className="bg-red-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white">PERMINTAAN DARAH</span>
              </div>
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
                  <span className="text-xs text-muted-foreground">{request.hospital}{request.city ? `, ${request.city_name || request.city}` : ""}</span>
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
              {(() => {
                const wa = coordinatorWaLink(
                  `Halo, saya ingin membantu donor darah untuk:\n\n` +
                  `🩸 Golongan Darah: ${bloodDisplay}\n` +
                  `👤 Pasien: ${request.patient_name}\n` +
                  `🏥 Rumah Sakit: ${request.hospital}${request.city ? `, ${request.city_name || request.city}` : ""}\n` +
                  `📦 Kebutuhan: ${request.bags} kantong (${remaining} tersisa)\n` +
                  `⚠️ Urgensi: ${request.urgency === "critical" ? "KRITIS" : request.urgency === "urgent" ? "MENDESAK" : "Biasa"}\n\n` +
                  `Mohon info lebih lanjut. Terima kasih.`
                );
                return wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Hubungi Koordinator
                  </a>
                ) : (
                  <p className="text-[10px] text-[#94a3b8]">Hubungi koordinator untuk info lebih lanjut</p>
                );
              })()}
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Perhatian: donor darah melalui aplikasi ini tidak dipungut biaya. Jangan memberikan uang kepada pihak yang mengatasnamakan donor atau aplikasi ini.
        </span>
      </div>

      <div className="mt-2 flex justify-center">
        <ReportDialog targetType="blood_request" targetId={request.id} />
      </div>

      {/* Share buttons */}
      <div className="mt-4 space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Share2 className="mr-1 inline h-3 w-3" />
          Bagikan ke Story
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={captureAndShare}
            disabled={sharing}
            className="flex flex-col items-center gap-1"
            title="Instagram Story"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50">
              <Camera className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-gray-500">Instagram</span>
          </button>

          <button
            onClick={captureAndShare}
            disabled={sharing}
            className="flex flex-col items-center gap-1"
            title="WhatsApp Story"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-gray-500">WhatsApp</span>
          </button>

          <button
            onClick={captureAndShare}
            disabled={sharing}
            className="flex flex-col items-center gap-1"
            title="Facebook Story"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50">
              <Share2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium text-gray-500">Facebook</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex h-px flex-1 bg-gray-200" />
          <span className="text-[10px] text-gray-400">atau</span>
          <div className="flex h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex items-start gap-2">
          <textarea
            readOnly
            rows={3}
            value={shareMessage}
            className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 leading-relaxed"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <button
            onClick={copyLink}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
            title="Salin pesan"
          >
            {linkCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
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
                if (!user?.date_of_birth) {
                  toast.error("Atur tanggal lahir di profil terlebih dahulu");
                  router.push("/profile");
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
