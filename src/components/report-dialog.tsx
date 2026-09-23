"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "fraud", label: "Penipuan" },
  { value: "money_request", label: "Meminta uang" },
  { value: "contact_abuse", label: "Penyalahgunaan kontak" },
  { value: "suspicious_account", label: "Akun mencurigakan" },
  { value: "invalid_info", label: "Informasi tidak valid" },
  { value: "other", label: "Lainnya" },
];

export function ReportDialog({
  targetType,
  targetId,
}: {
  targetType: "blood_request" | "donor" | "event";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("other");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/reports", { target_type: targetType, target_id: targetId, reason, notes: notes || null });
      toast.success("Laporan terkirim. Terima kasih.");
      setOpen(false);
      setNotes("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8] hover:text-red-600"
      >
        <Flag className="h-3 w-3" />
        Laporkan penyalahgunaan
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-xs font-semibold text-red-700">Laporkan Penyalahgunaan</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-2 w-full rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs outline-none"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Keterangan tambahan (opsional)"
        className="mt-2 w-full resize-none rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs outline-none"
      />
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="default" onClick={submit} disabled={submitting} className="bg-red-600 hover:bg-red-700">
          Kirim
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
      </div>
    </div>
  );
}