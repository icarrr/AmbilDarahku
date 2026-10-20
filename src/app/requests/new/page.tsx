"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  User,
  Droplets,
  Hospital,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
const BLOOD_OPTIONS = ["A", "B", "AB", "O"];

function NewRequestForm() {
  const { user, isUnverified } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isUnverified) router.replace("/verify-email");
  }, [isUnverified, router]);
  const [form, setForm] = useState({
    patient_name: "",
    blood_type: "",
    bags: "1",
    hospital: "",
    city: "",
    contact_phone: "",
    notes: "",
    urgency: "critical",
  });
  const [contactConsent, setContactConsent] = useState(Boolean(user?.contact_consent));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const fieldError = (key: string) =>
    errors[key] ? <p id={`${key}-error`} className="mt-0.5 text-xs text-red-500">{errors[key]}</p> : null;

  // `user` may arrive after mount (auth hydrates async) — prefill without clobbering what was typed.
  // Adjusting state during render on change (no effect) per react.dev "you might not need an effect".
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    if (user?.phone && !form.contact_phone) setForm(prev => ({ ...prev, contact_phone: user.phone }));
    if (user?.contact_consent && !contactConsent) setContactConsent(true);
  }

  useEffect(() => {
    let bt = searchParams?.get?.("blood_type");
    if (!bt) {
      const fallback = new URLSearchParams(window.location.search);
      bt = bt || fallback.get("blood_type") || "";
    }
    if (bt) {
      setForm(prev => ({ ...prev, blood_type: bt }));
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!form.patient_name.trim()) e.patient_name = "Nama pasien wajib diisi";
    if (!form.blood_type) e.blood_type = "Pilih golongan darah";
    const bags = Number(form.bags);
    if (!Number.isInteger(bags) || bags < 1) e.bags = "Jumlah kantong minimal 1";
    if (!form.hospital.trim()) e.hospital = "Nama rumah sakit wajib diisi";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Lengkapi data yang ditandai");
      return;
    }
    if (!contactConsent) {
      toast.error("Centang persetujuan kontak untuk melanjutkan");
      return;
    }
    setSubmitting(true);
    try {
      const { request } = await api.post<{ request: { id: string } }>("/requests", {
        ...form,
        bags: Number(form.bags),
      });
      // Reconfirm consent server-side (the requester is the contactable party)
      await api.put("/auth/me", { contact_consent: true });
      toast.success("Permintaan darurat terkirim!");
      router.push(`/requests/share/${request.id}`);
    } catch {
      toast.error("Gagal mengirim permintaan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <p className="font-heading text-lg font-bold text-foreground">
            Permintaan Darurat
          </p>
          <p className="text-xs text-muted-foreground">
            Tetap tenang. Isi detail berikut untuk membantu kami menemukan bantuan.
          </p>
        </div>
      </div>

      <GlassCard className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="patient_name">Nama Pasien</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="patient_name"
              placeholder="Nama lengkap pasien"
              value={form.patient_name}
              onChange={(e) => update("patient_name", e.target.value)}
              aria-invalid={!!errors.patient_name}
              aria-describedby={errors.patient_name ? "patient_name-error" : undefined}
              className="pl-10"
            />
          </div>
          {fieldError("patient_name")}
        </div>

        <div className="space-y-1.5">
          <Label id="blood_type-label">Golongan Darah</Label>
          <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="blood_type-label">
            {BLOOD_OPTIONS.map((bt) => (
              <button
                key={bt}
                type="button"
                aria-pressed={form.blood_type === bt}
                onClick={() => update("blood_type", bt)}
                className={cn(
                  "rounded-lg py-2 text-center text-sm font-bold transition-colors",
                  form.blood_type === bt
                    ? "bg-red-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {bt}
            </button>
            ))}
          </div>
          {form.blood_type && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Golongan darah {form.blood_type}
            </p>
          )}
          {fieldError("blood_type")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bags">Jumlah Kantong (Unit)</Label>
          <div className="relative">
            <Droplets className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="bags"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="1"
              value={form.bags}
              onChange={(e) => update("bags", e.target.value)}
              aria-invalid={!!errors.bags}
              aria-describedby={errors.bags ? "bags-error" : undefined}
              className="pl-10"
            />
          </div>
          {fieldError("bags")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hospital">Lokasi Rumah Sakit</Label>
          <div className="relative">
            <Hospital className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hospital"
              placeholder="Nama rumah sakit"
              value={form.hospital}
              onChange={(e) => update("hospital", e.target.value)}
              aria-invalid={!!errors.hospital}
              aria-describedby={errors.hospital ? "hospital-error" : undefined}
              className="pl-10"
            />
          </div>
          {fieldError("hospital")}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">Kota</Label>
          <Input
            id="city"
            placeholder="Kota lokasi rumah sakit"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact_phone">Nomor WhatsApp Pendamping</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="contact_phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xxxx"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <textarea
              id="notes"
              placeholder="Informasi tambahan..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border-0 bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label id="urgency-label">Tingkat Urgensi</Label>
          <div className="flex gap-2" role="group" aria-labelledby="urgency-label">
            {[
              { value: "critical", label: "Kritis" },
              { value: "urgent", label: "Mendesak" },
              { value: "normal", label: "Biasa" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={form.urgency === opt.value}
                onClick={() => update("urgency", opt.value)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
                  form.urgency === opt.value
                    ? opt.value === "critical"
                      ? "bg-red-600 text-white"
                      : opt.value === "urgent"
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={contactConsent}
              onChange={(e) => setContactConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span>
              Saya bersedia dihubungi melalui aplikasi terkait kebutuhan donor ini. Nomor kontak hanya digunakan oleh koordinator untuk mempertemukan pendonor.
            </span>
          </label>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          Sebarkan Permintaan Darurat
        </Button>
      </GlassCard>

      <div className="mt-3 rounded-xl bg-amber-50 p-3">
        <p className="text-xs font-medium text-amber-800">
          Gunakan dengan Bijak
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Setiap laporan darurat diverifikasi oleh tim kami. Mohon masukkan data yang akurat demi kelancaran proses donor.
        </p>
      </div>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <NewRequestForm />
    </Suspense>
  );
}
