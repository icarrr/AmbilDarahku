"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, Shield, ShieldHalf, Clock, CheckCircle, XCircle, ChevronRight, Send } from "lucide-react";

type VerificationEntry = {
  id: string;
  level: number;
  status: string;
  verifier_role: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

const LEVEL_INFO = {
  1: { label: "Tingkat 1", desc: "Laporan Mandiri", icon: "self", color: "bg-blue-100 text-blue-700 border-blue-200" },
  2: { label: "Tingkat 2", desc: "Terverifikasi Komunitas", icon: "community", color: "bg-amber-100 text-amber-700 border-amber-200" },
  3: { label: "Tingkat 3", desc: "Terverifikasi PMI", icon: "pmi", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function VerificationPage() {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [maxLevel] = useState(3);
  const [verifications, setVerifications] = useState<VerificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ level: "2", verifier_role: "community", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const data = await api.get<{ current_level: number; max_level: number; verifications: VerificationEntry[] }>("/donor-verification");
      setCurrentLevel(data.current_level);
      setVerifications(data.verifications || []);
    } catch {
      toast.error("Gagal memuat data verifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const submitVerification = async () => {
    setSubmitting(true);
    try {
      await api.post("/donor-verification", {
        level: parseInt(form.level),
        verifier_role: form.verifier_role,
        notes: form.notes || undefined,
      });
      toast.success("Permohonan verifikasi dikirim");
      setShowForm(false);
      setForm({ level: "2", verifier_role: "community", notes: "" });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">Memuat...</div>;

  const nextLevel = currentLevel < maxLevel ? currentLevel + 1 : null;
  const nextInfo = nextLevel ? LEVEL_INFO[nextLevel as keyof typeof LEVEL_INFO] : null;
  const hasPending = verifications.some(v => v.status === "pending");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-xl font-bold text-foreground">Verifikasi Donor</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tingkatkan level verifikasi untuk meningkatkan kepercayaan
      </p>

      <div className="mt-6 space-y-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                currentLevel >= 3 ? "bg-emerald-100" : currentLevel >= 2 ? "bg-amber-100" : currentLevel >= 1 ? "bg-blue-100" : "bg-gray-100"
              }`}>
                {currentLevel >= 3 ? <ShieldCheck className="h-6 w-6 text-emerald-600" /> :
                 currentLevel >= 2 ? <ShieldHalf className="h-6 w-6 text-amber-600" /> :
                 currentLevel >= 1 ? <Shield className="h-6 w-6 text-blue-600" /> :
                 <Shield className="h-6 w-6 text-gray-400" />}
              </div>
              <div>
                <p className="font-heading text-base font-bold text-foreground">
                  Level {currentLevel} / {maxLevel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentLevel === 0 ? "Belum terverifikasi" :
                   currentLevel === 1 ? "Laporan Mandiri" :
                   currentLevel === 2 ? "Terverifikasi Komunitas" :
                   "Terverifikasi PMI"}
                </p>
              </div>
            </div>
            {nextLevel && !hasPending && (
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                <Send className="mr-1 h-3.5 w-3.5" />
                Ajukan
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((lvl) => {
              const info = LEVEL_INFO[lvl as keyof typeof LEVEL_INFO];
              const isUnlocked = currentLevel >= lvl;
              const hasPendingLevel = verifications.some(v => v.level === lvl && v.status === "pending");
              return (
                <div key={lvl} className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isUnlocked ? "border-emerald-200 bg-emerald-50" :
                  hasPendingLevel ? "border-amber-200 bg-amber-50" :
                  "border-gray-200 bg-gray-50"
                }`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isUnlocked ? "bg-emerald-500 text-white" :
                    hasPendingLevel ? "bg-amber-500 text-white" :
                    "bg-gray-300 text-gray-500"
                  }`}>
                    {isUnlocked ? <CheckCircle className="h-4 w-4" /> :
                     hasPendingLevel ? <Clock className="h-4 w-4" /> :
                     <span className="text-xs font-bold">{lvl}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                  {hasPendingLevel && <span className="text-[10px] font-medium text-amber-600">Menunggu</span>}
                </div>
              );
            })}
          </div>

          {nextLevel && nextInfo && !hasPending && showForm && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-foreground">Ajukan ke {nextInfo.label}</h3>
              <p className="text-xs text-muted-foreground">{nextInfo.desc}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Verifikator</label>
                  <select
                    value={form.verifier_role}
                    onChange={e => setForm(p => ({ ...p, verifier_role: e.target.value }))}
                    className="mt-1 flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="community">Komunitas</option>
                    <option value="pmi">PMI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Catatan</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Informasi tambahan untuk verifikator"
                    rows={3}
                    className="mt-1 flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <Button onClick={submitVerification} disabled={submitting} className="w-full">
                  {submitting ? "Mengirim..." : `Kirim Permohonan Level ${nextLevel}`}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        {verifications.length > 0 && (
          <GlassCard>
            <h3 className="font-heading text-sm font-semibold text-foreground">Riwayat Verifikasi</h3>
            <div className="mt-3 space-y-2">
              {verifications.map((v) => {
                const info = LEVEL_INFO[v.level as keyof typeof LEVEL_INFO];
                return (
                  <div key={v.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      v.status === "approved" ? "bg-emerald-100" :
                      v.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                    }`}>
                      {v.status === "approved" ? <CheckCircle className="h-4 w-4 text-emerald-600" /> :
                       v.status === "rejected" ? <XCircle className="h-4 w-4 text-red-600" /> :
                       <Clock className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{info?.label || `Level ${v.level}`}</p>
                      <p className="text-xs text-muted-foreground capitalize">{v.verifier_role} • {formatDate(v.created_at)}</p>
                      {v.notes && <p className="mt-0.5 text-xs text-[#94a3b8]">{v.notes}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      v.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      v.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {v.status === "approved" ? "Disetujui" : v.status === "rejected" ? "Ditolak" : "Menunggu"}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
