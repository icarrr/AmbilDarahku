"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Upload } from "lucide-react";
import Link from "next/link";

export default function NewClaimPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    donation_date: "",
    location: "",
    institution_name: "",
    blood_type: "",
    volume_ml: "350",
    additional_notes: "",
  });

  const submit = async () => {
    if (!form.donation_date || !form.location) {
      toast.error("Tanggal dan lokasi wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      let proofPhotoUrl = "";
      let proofDocUrl = "";
      if (photoFile) proofPhotoUrl = await api.upload("/upload", photoFile);
      if (docFile) proofDocUrl = await api.upload("/upload", docFile);

      const payload: Record<string, unknown> = {
        donation_date: form.donation_date,
        location: form.location,
        volume_ml: parseInt(form.volume_ml) || 350,
      };
      if (form.institution_name) payload.institution_name = form.institution_name;
      if (form.blood_type) payload.blood_type = form.blood_type;
      if (proofPhotoUrl) payload.proof_photo_url = proofPhotoUrl;
      if (proofDocUrl) payload.proof_document_url = proofDocUrl;
      if (form.additional_notes) payload.additional_notes = form.additional_notes;

      await api.post("/claims", payload);
      toast.success("Klaim berhasil diajukan!");
      router.push("/claims");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan klaim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/claims"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <h1 className="font-heading text-xl font-bold text-foreground">
        Klaim Riwayat Donor
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Isi detail donasi yang ingin diklaim. Admin akan memverifikasi data Anda.
      </p>

      <GlassCard className="mt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tanggal Donasi *</Label>
              <Input
                type="date"
                value={form.donation_date}
                onChange={e => setForm(p => ({ ...p, donation_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Volume (ml)</Label>
              <Input
                type="number"
                value={form.volume_ml}
                onChange={e => setForm(p => ({ ...p, volume_ml: e.target.value }))}
                placeholder="350"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Lokasi Donasi *</Label>
            <Input
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="Kota, tempat donor"
            />
          </div>

          <div className="space-y-1">
            <Label>Institusi / Rumah Sakit</Label>
            <Input
              value={form.institution_name}
              onChange={e => setForm(p => ({ ...p, institution_name: e.target.value }))}
              placeholder="PMI Kota, RS Umum, dll"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Golongan Darah</Label>
              <Input
                value={form.blood_type}
                onChange={e => setForm(p => ({ ...p, blood_type: e.target.value }))}
                placeholder="A, B, AB, O"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Foto Bukti Donor</Label>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={e => setPhotoFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {photoFile ? (
              <p className="text-sm text-emerald-600">{photoFile.name} siap</p>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-muted-foreground hover:border-red-300"
              >
                <Camera className="h-5 w-5" />
                Pilih foto bukti donor
              </button>
            )}
          </div>

          <div className="space-y-1">
            <Label>Dokumen Pendukung (opsional)</Label>
            <input
              ref={docRef}
              type="file"
              accept="image/*,.pdf"
              onChange={e => setDocFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {docFile ? (
              <p className="text-sm text-emerald-600">{docFile.name} siap</p>
            ) : (
              <button
                type="button"
                onClick={() => docRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-muted-foreground hover:border-red-300"
              >
                <Upload className="h-5 w-5" />
                Pilih dokumen pendukung
              </button>
            )}
          </div>

          <div className="space-y-1">
            <Label>Catatan Tambahan</Label>
            <textarea
              value={form.additional_notes}
              onChange={e => setForm(p => ({ ...p, additional_notes: e.target.value }))}
              placeholder="Informasi lain yang mendukung klaim Anda"
              rows={3}
              className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <Button
            onClick={submit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Mengirim..." : "Ajukan Klaim"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
