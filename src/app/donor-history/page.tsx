"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, getRecoveryEndDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, CheckCircle, Droplets, ImageUp, Loader2, Plus, X, ScrollText, Pencil, Trash2 } from "lucide-react";
import { getFileUrl } from "@/lib/file-url";
import { SkeletonCard } from "@/components/ui/skeleton";

type History = {
  id: string;
  donation_date: string;
  location: string;
  institution: string;
  bags: number;
  notes?: string;
  proof_photo?: string;
  verification_status: string;
  verification_level?: string;
  verification_source?: string;
};

export default function DonorHistoryPage() {
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donation_date: "", location: "", institution: "", notes: "", proof_photo: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editingHistory, setEditingHistory] = useState<History | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ histories: History[] }>("/donor-history").then(d => setHistories(d.histories || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({ donation_date: "", location: "", institution: "", notes: "", proof_photo: "" });
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoFile(null);
    setEditingHistory(null);
    setShowForm(false);
  };

  const openEditForm = (h: History) => {
    setEditingHistory(h);
    setForm({
      donation_date: h.donation_date.split("T")[0],
      location: h.location,
      institution: h.institution,
      notes: h.notes || "",
      proof_photo: "",
    });
    setPhotoFile(null);
    setPhotoPreview("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const payload: Record<string, unknown> = { ...form, bags: 1 };
      if (!editingHistory) {
        payload.proof_photo = form.proof_photo || "";
      }
      if (photoFile) {
        payload.proof_photo = await api.upload("/upload", photoFile);
      }
      if (editingHistory) {
        await api.put(`/donor-history/${editingHistory.id}`, payload);
        toast.success("Riwayat donor diperbarui");
      } else {
        await api.post("/donor-history", payload);
        toast.success("Riwayat donor ditambahkan");
      }
      resetForm();
      const d = await api.get<{ histories: History[] }>("/donor-history");
      setHistories(d.histories || []);
    } catch {
      toast.error(editingHistory ? "Gagal memperbarui riwayat" : "Gagal menambah riwayat");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (h: History) => {
    if (!confirm(`Hapus riwayat donor ${formatDate(h.donation_date)}?`)) return;
    setDeletingId(h.id);
    try {
      await api.delete(`/donor-history/${h.id}`);
      toast.success("Riwayat donor dihapus");
      const d = await api.get<{ histories: History[] }>("/donor-history");
      setHistories(d.histories || []);
    } catch {
      toast.error("Gagal menghapus riwayat");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPhoto = async (historyId: string, file: File) => {
    if (!file) return;
    setEditingId(historyId);
    try {
      const photoUrl = await api.upload("/upload", file);
      await api.put(`/donor-history/${historyId}`, { proof_photo: photoUrl });
      toast.success("Foto bukti berhasil ditambahkan!");
      const d = await api.get<{ histories: History[] }>("/donor-history");
      setHistories(d.histories || []);
    } catch {
      toast.error("Gagal mengunggah foto");
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Riwayat Donor</h1>
          <p className="text-sm text-muted-foreground">Catat dan pantau riwayat donor darah Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Batal" : "Tambah Riwayat"}
        </Button>
      </div>

      {showForm && (
        <GlassCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold text-foreground">
              {editingHistory ? "Edit Riwayat Donor" : "Tambah Riwayat Donor"}
            </h3>
            {editingHistory && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs">Batal</Button>
            )}
          </div>
          <form onSubmit={addHistory} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tanggal Donor</Label>
              <Input type="date" value={form.donation_date} onChange={e => setForm(p => ({ ...p, donation_date: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Lokasi</Label>
              <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required placeholder="Kota tempat donor" />
            </div>
            <div className="space-y-1.5">
              <Label>Instansi</Label>
              <Input value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} required placeholder="PMI / Rumah Sakit" />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Misal: donor trombosit" />
            </div>
            {!editingHistory && (
            <div className="space-y-1.5">
              <Label>
                Foto Bukti Donor
                <span className="ml-1 text-xs font-normal text-red-500">*wajib untuk verifikasi</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
onChange={handlePhoto}
                 className="hidden"
              />
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="h-40 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => { URL.revokeObjectURL(photoPreview); setPhotoPreview(""); setPhotoFile(null); }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    Siap
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-6 text-sm text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  <Camera className="h-8 w-8 text-gray-300" />
                  <span>Ambil foto atau pilih dari galeri</span>
                  <span className="text-xs text-[#94a3b8]">Foto selfie saat donor sebagai bukti verifikasi</span>
                </button>
              )}
              <p className="text-xs text-amber-600">
                <ImageUp className="mr-1 inline h-3 w-3" />
                Tanpa foto, riwayat tidak akan terverifikasi
              </p>
            </div>
            )}
            <Button type="submit" disabled={uploading}>{uploading ? "Mengunggah..." : editingHistory ? "Simpan Perubahan" : "Simpan Riwayat"}</Button>
          </form>
        </GlassCard>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}><SkeletonCard /></div>)}
        </div>
      )}

      {!loading && histories.length === 0 && !showForm && (
        <div className="py-16 text-center animate-fade-in">
          <ScrollText className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-3 font-medium text-foreground">Belum ada riwayat donor</p>
          <p className="text-sm text-muted-foreground">Catat riwayat donor darah Anda untuk mulai mendapat badge dan poin.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Tambah Riwayat
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {histories.map((h, i) => (
          <GlassCard key={h.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                <Droplets className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatDate(h.donation_date)}</p>
                        <p className="text-xs text-muted-foreground">{h.institution}{h.location ? ` • ${h.location}` : ""}</p>
                        <p className="mt-0.5 text-xs text-[#94a3b8]">{h.bags} kantong{h.notes ? ` • ${h.notes}` : ""}</p>
                        <p className="mt-1 text-[11px] font-medium text-amber-600">
                          Donor selanjutnya {getRecoveryEndDate(h.donation_date)}
                        </p>
                        {h.verification_level && h.verification_level !== "self" && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            Verifikasi: {h.verification_level}
                            {h.verification_source && ` • ${h.verification_source}`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(h)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
                          disabled={deletingId === h.id}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Hapus"
                        >
                          {deletingId === h.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                        <StatusBadge status={h.verification_status} dot />
                      </div>
                    </div>
                {h.proof_photo && (
                  <div className="mt-2">
                    <img
                      src={getFileUrl(h.proof_photo) || ""}
                      alt="Bukti donor"
                      className="h-24 w-32 rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                )}
                {h.verification_status === "pending" && !h.proof_photo && (
                  <div className="mt-1.5">
                    <p className="text-xs text-amber-600">
                      <Camera className="mr-1 inline h-3 w-3" />
                      Belum terverifikasi — tambahkan foto bukti donor
                    </p>
                    <div className="mt-2">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleEditPhoto(h.id, file);
                        }}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={editingId === h.id}
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        {editingId === h.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                        {editingId === h.id ? "Mengunggah..." : "Tambah Foto"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
