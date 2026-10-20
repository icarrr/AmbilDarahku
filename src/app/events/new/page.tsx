"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, ImageUp } from "lucide-react";

export default function NewEventPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    city: "",
    event_date: "",
    start_time: "",
    end_time: "",
    organizer: "",
    contact_phone: "",
    quota: 50,
    status: "upcoming",
  });

  const update = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.city || !form.event_date) {
      toast.error("Lengkapi field wajib (judul, lokasi, kota, tanggal)");
      return;
    }
    setSaving(true);
    try {
      let bannerUrl = "";
      if (bannerFile) bannerUrl = await api.upload("/upload", bannerFile);
      await api.post("/events", {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        quota: Number(form.quota),
        poster_url: bannerUrl || undefined,
      });
      toast.success("Event berhasil dibuat");
      router.push("/events");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat event";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground">Akses ditolak. Halaman ini hanya untuk admin.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <button onClick={() => router.back()} className="mb-4 flex min-h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Buat Event Donor Darah</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lengkapi form di bawah untuk membuat event baru.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassCard className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="title">Judul Event *</Label>
              <Input id="title" value={form.title} onChange={e => update("title", e.target.value)} placeholder="Contoh: Donor Darah Bulanan PMI" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea id="description" value={form.description} onChange={e => update("description", e.target.value)} placeholder="Deskripsi singkat tentang event..." rows={3} className="h-20 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Lokasi *</Label>
              <Input id="location" value={form.location} onChange={e => update("location", e.target.value)} placeholder="Jl. Contoh No. 123" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Kota *</Label>
              <Input id="city" value={form.city} onChange={e => update("city", e.target.value)} placeholder="Jakarta" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event_date">Tanggal Event *</Label>
              <Input id="event_date" type="date" value={form.event_date} onChange={e => update("event_date", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Mulai</Label>
                <Input id="start_time" type="time" value={form.start_time} onChange={e => update("start_time", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">Selesai</Label>
                <Input id="end_time" type="time" value={form.end_time} onChange={e => update("end_time", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organizer">Penyelenggara</Label>
              <Input id="organizer" value={form.organizer} onChange={e => update("organizer", e.target.value)} placeholder="PMI / Rumah Sakit" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">Kontak WA</Label>
              <Input id="contact_phone" type="tel" inputMode="tel" autoComplete="tel" value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} placeholder="6281234567890" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quota">Kuota Pendonor</Label>
              <Input id="quota" type="number" min={1} value={form.quota} onChange={e => update("quota", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="banner">Banner Event</Label>
              <input ref={bannerRef} id="banner" type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} className="hidden" />
              {bannerFile ? (
                <p className="text-sm text-emerald-600">{bannerFile.name} siap</p>
              ) : (
                <button type="button" onClick={() => bannerRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-red-300">
                  <ImageUp className="h-5 w-5" />
                  Pilih gambar banner
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" value={form.status} onChange={e => update("status", e.target.value)} className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                <option value="upcoming">Akan Datang</option>
                <option value="ongoing">Berlangsung</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/events")}>Batal</Button>
          <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? "Menyimpan..." : "Buat Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
