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

  useEffect(() => {
    let bt = searchParams?.get?.("blood_type");
    if (!bt) {
      const fallback = new URLSearchParams(window.location.search);
      bt = bt || fallback.get("blood_type") || "";
    }
    if (bt) {
      setForm(prev => ({ ...prev, blood_type: bt }));
    }
    if (user?.phone) {
      setForm(prev => ({ ...prev, contact_phone: user.phone }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.patient_name || !form.blood_type || !form.hospital) {
      toast.error("Lengkapi data utama (nama, golongan darah, rumah sakit)");
      return;
    }
    setSubmitting(true);
    try {
      const { request } = await api.post<{ request: { id: string } }>("/requests", {
        ...form,
        bags: parseInt(form.bags),
      });
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
          <Label>Nama Pasien</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Nama lengkap pasien"
              value={form.patient_name}
              onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Golongan Darah</Label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_OPTIONS.map((bt) => (
              <button
                key={bt}
                onClick={() => setForm({ ...form, blood_type: bt })}
                className={cn(
                  "rounded-lg py-2 text-center text-sm font-bold transition-colors",
                  form.blood_type === bt
                    ? "bg-red-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-gray-200",
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
        </div>

        <div className="space-y-1.5">
          <Label>Jumlah Kantong (Unit)</Label>
          <div className="relative">
            <Droplets className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="number"
              min={1}
              placeholder="1"
              value={form.bags}
              onChange={(e) => setForm({ ...form, bags: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Lokasi Rumah Sakit</Label>
          <div className="relative">
            <Hospital className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Nama rumah sakit"
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Kota</Label>
          <Input
            placeholder="Kota lokasi rumah sakit"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Nomor WhatsApp Pendamping</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="08xxxx"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Catatan Tambahan (Opsional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              placeholder="Informasi tambahan..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border-0 bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Tingkat Urgensi</Label>
          <div className="flex gap-2">
            {[
              { value: "critical", label: "Kritis" },
              { value: "urgent", label: "Mendesak" },
              { value: "normal", label: "Biasa" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, urgency: opt.value })}
                className={cn(
                  "flex-1 rounded-lg py-2 text-center text-sm font-medium transition-colors",
                  form.urgency === opt.value
                    ? opt.value === "critical"
                      ? "bg-red-600 text-white"
                      : opt.value === "urgent"
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-gray-200",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
