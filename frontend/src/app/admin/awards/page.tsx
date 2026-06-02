"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Award, X, Check } from "lucide-react";

type AwardConfig = {
  id: string;
  name: string;
  description?: string;
  award_type: string;
  criteria: string;
  scope: string;
  scope_value?: string;
  is_active: boolean;
};

const defaultForm = {
  name: "",
  description: "",
  award_type: "title",
  criteria: "{}",
  scope: "national",
  scope_value: "",
  is_active: true,
};

export default function AdminAwardsPage() {
  const [configs, setConfigs] = useState<AwardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetch = async () => {
    try {
      const d = await api.get<{ configs: AwardConfig[] }>("/admin/awards");
      setConfigs(d.configs || []);
    } catch {
      toast.error("Gagal memuat konfigurasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    try {
      if (editing) {
        const payload: Record<string, unknown> = {};
        if (form.name) payload.name = form.name;
        if (form.description) payload.description = form.description;
        if (form.award_type) payload.award_type = form.award_type;
        if (form.criteria) payload.criteria = form.criteria;
        if (form.scope) payload.scope = form.scope;
        payload.scope_value = form.scope_value || null;
        payload.is_active = form.is_active;
        await api.put(`/admin/awards/${editing}`, payload);
        toast.success("Konfigurasi diperbarui");
      } else {
        await api.post("/admin/awards", {
          name: form.name,
          description: form.description || undefined,
          award_type: form.award_type,
          criteria: form.criteria,
          scope: form.scope,
          scope_value: form.scope_value || undefined,
        });
        toast.success("Konfigurasi dibuat");
      }
      resetForm();
      fetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      await api.delete(`/admin/awards/${id}`);
      toast.success("Dihapus");
      fetch();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const editConfig = (c: AwardConfig) => {
    setForm({
      name: c.name,
      description: c.description || "",
      award_type: c.award_type,
      criteria: c.criteria,
      scope: c.scope,
      scope_value: c.scope_value || "",
      is_active: c.is_active,
    });
    setEditing(c.id);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Konfigurasi Penghargaan</h1>
          <p className="text-sm text-muted-foreground">Atur jenis penghargaan dan gelar donor</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {showForm ? "Batal" : "Tambah"}
        </Button>
      </div>

      {showForm && (
        <GlassCard className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Edit" : "Buat"} Konfigurasi</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nama</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tipe</Label>
                <select value={form.award_type} onChange={e => setForm(p => ({ ...p, award_type: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                  <option value="title">Gelar</option>
                  <option value="badge">Lencana</option>
                  <option value="certificate">Sertifikat</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Lingkup</Label>
                <select value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                  <option value="national">Nasional</option>
                  <option value="regional">Regional</option>
                  <option value="city">Kota</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Nilai Lingkup</Label>
                <Input value={form.scope_value} onChange={e => setForm(p => ({ ...p, scope_value: e.target.value }))}
                  placeholder="Provinsi/kota" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-red-600" />
              <Label htmlFor="active">Aktif</Label>
            </div>
            <Button onClick={save}>{editing ? "Simpan" : "Buat"}</Button>
          </div>
        </GlassCard>
      )}

      {loading && <p className="mt-8 text-center text-muted-foreground">Memuat...</p>}

      {!loading && configs.length === 0 && (
        <div className="mt-8 text-center">
          <Award className="mx-auto h-10 w-10 text-[#94a3b8]" />
          <p className="mt-2 text-sm text-muted-foreground">Belum ada konfigurasi</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {configs.map((c) => (
          <GlassCard key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg ${
                  c.is_active ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {c.is_active ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  <div className="mt-1 flex gap-2 text-[10px] text-[#94a3b8]">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5">{c.award_type}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5">{c.scope}{c.scope_value ? `:${c.scope_value}` : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => editConfig(c)} className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-gray-100 hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteConfig(c.id)} className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
