"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Award, X, Check } from "lucide-react";

type AwardConfig = {
  id: string;
  name: string;
  description?: string;
  award_type: string;
  criteria: unknown;
  scope: string;
  scope_value?: string;
  is_active: boolean;
};

const AWARD_TYPE_LABELS: Record<string, string> = {
  title: "Gelar",
  badge: "Lencana",
  certificate: "Sertifikat",
};

const SCOPE_LABELS: Record<string, string> = {
  national: "Nasional",
  regional: "Regional",
  city: "Kota",
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

// criteria is JSONB but the API may hand it back as a (possibly double-encoded) string.
function criteriaToText(criteria: unknown): string {
  let value = criteria;
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    try { value = JSON.parse(value); } catch { return value as string; }
  }
  return JSON.stringify(value ?? {}, null, 2);
}

export default function AdminAwardsPage() {
  const [configs, setConfigs] = useState<AwardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<{ name?: string; criteria?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AwardConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = async () => {
    try {
      const d = await api.get<{ awards: AwardConfig[] }>("/admin/awards");
      setConfigs(d.awards || []);
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
    setErrors({});
  };

  const save = async () => {
    const nextErrors: { name?: string; criteria?: string } = {};
    if (!form.name.trim()) nextErrors.name = "Nama wajib diisi";
    let criteria: unknown = {};
    try {
      criteria = JSON.parse(form.criteria.trim() || "{}");
      if (typeof criteria !== "object" || criteria === null || Array.isArray(criteria)) {
        nextErrors.criteria = "Kriteria harus berupa objek JSON, mis. {\"min_donations\": 10}";
      }
    } catch {
      nextErrors.criteria = "JSON tidak valid";
    }
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.criteria) return;

    setSaving(true);
    try {
      if (editing) {
        await api.put("/admin/awards", {
          id: editing,
          name: form.name.trim(),
          description: form.description || null,
          award_type: form.award_type,
          criteria,
          scope: form.scope,
          scope_value: form.scope_value || null,
          is_active: form.is_active,
        });
        toast.success("Konfigurasi diperbarui");
      } else {
        await api.post("/admin/awards", {
          name: form.name.trim(),
          description: form.description || undefined,
          award_type: form.award_type,
          criteria,
          scope: form.scope,
          scope_value: form.scope_value || undefined,
        });
        toast.success("Konfigurasi dibuat");
      }
      resetForm();
      fetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/awards?id=${encodeURIComponent(deleteTarget.id)}`);
      toast.success("Dihapus");
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  const editConfig = (c: AwardConfig) => {
    setForm({
      name: c.name,
      description: c.description || "",
      award_type: c.award_type,
      criteria: criteriaToText(c.criteria),
      scope: c.scope,
      scope_value: c.scope_value || "",
      is_active: c.is_active,
    });
    setErrors({});
    setEditing(c.id);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Konfigurasi Penghargaan</h1>
          <p className="text-sm text-muted-foreground">Atur jenis penghargaan dan gelar donor</p>
        </div>
        <Button size="sm" onClick={() => { const open = showForm; resetForm(); setShowForm(!open); }}>
          {showForm ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {showForm ? "Batal" : "Tambah"}
        </Button>
      </div>

      {showForm && (
        <GlassCard className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">{editing ? "Edit" : "Buat"} Konfigurasi</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="award-name">Nama</Label>
                <Input id="award-name" value={form.name} aria-invalid={!!errors.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label>Tipe</Label>
                <Select value={form.award_type} items={AWARD_TYPE_LABELS} onValueChange={v => setForm(p => ({ ...p, award_type: v ?? "title" }))}>
                  <SelectTrigger className="w-full" aria-label="Tipe penghargaan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AWARD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="award-description">Deskripsi</Label>
              <Input id="award-description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Lingkup</Label>
                <Select value={form.scope} items={SCOPE_LABELS} onValueChange={v => setForm(p => ({ ...p, scope: v ?? "national" }))}>
                  <SelectTrigger className="w-full" aria-label="Lingkup penghargaan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="award-scope-value">Nilai Lingkup</Label>
                <Input id="award-scope-value" value={form.scope_value} onChange={e => setForm(p => ({ ...p, scope_value: e.target.value }))}
                  placeholder="Provinsi/kota" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="award-criteria">Kriteria (JSON)</Label>
              <textarea
                id="award-criteria"
                value={form.criteria}
                onChange={e => { setForm(p => ({ ...p, criteria: e.target.value })); if (errors.criteria) setErrors(p => ({ ...p, criteria: undefined })); }}
                aria-invalid={!!errors.criteria}
                rows={4}
                spellCheck={false}
                placeholder='{"min_donations": 10}'
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
              />
              {errors.criteria && <p className="text-xs text-destructive">{errors.criteria}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.is_active}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary" />
              <Label htmlFor="active">Aktif</Label>
            </div>
            <Button onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : editing ? "Simpan" : "Buat"}
            </Button>
          </div>
        </GlassCard>
      )}

      {loading && <p className="mt-8 text-center text-muted-foreground">Memuat...</p>}

      {!loading && configs.length === 0 && (
        <div className="mt-8 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Belum ada konfigurasi</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {configs.map((c) => (
          <GlassCard key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  c.is_active ? "bg-emerald-100" : "bg-muted"
                }`}>
                  {c.is_active ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground break-words">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground break-words">{c.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">{AWARD_TYPE_LABELS[c.award_type] || c.award_type}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">{SCOPE_LABELS[c.scope] || c.scope}{c.scope_value ? `: ${c.scope_value}` : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon-sm" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => editConfig(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Hapus ${c.name}`} onClick={() => setDeleteTarget(c)}
                  className="hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        variant="destructive"
        title="Hapus konfigurasi penghargaan?"
        description={deleteTarget ? <>Konfigurasi <strong>{deleteTarget.name}</strong> akan dihapus permanen.</> : null}
        confirmText="Hapus"
        loading={deleting}
        onConfirm={deleteConfig}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
