"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function NewClaimPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    donation_date: "",
    location: "",
    institution_name: "",
    blood_type: "",
    volume_ml: "350",
    proof_photo_url: "",
    proof_document_url: "",
    additional_notes: "",
  });

  const submit = async () => {
    if (!form.donation_date || !form.location) {
      toast.error("Tanggal dan lokasi wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        donation_date: form.donation_date,
        location: form.location,
        volume_ml: parseInt(form.volume_ml) || 350,
      };
      if (form.institution_name) payload.institution_name = form.institution_name;
      if (form.blood_type) payload.blood_type = form.blood_type;
      if (form.proof_photo_url) payload.proof_photo_url = form.proof_photo_url;
      if (form.proof_document_url) payload.proof_document_url = form.proof_document_url;
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
            <Label>URL Bukti Foto</Label>
            <Input
              value={form.proof_photo_url}
              onChange={e => setForm(p => ({ ...p, proof_photo_url: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-[10px] text-[#94a3b8]">
              Link ke foto kartu donor atau sertifikat
            </p>
          </div>

          <div className="space-y-1">
            <Label>URL Dokumen Pendukung</Label>
            <Input
              value={form.proof_document_url}
              onChange={e => setForm(p => ({ ...p, proof_document_url: e.target.value }))}
              placeholder="https://..."
            />
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
