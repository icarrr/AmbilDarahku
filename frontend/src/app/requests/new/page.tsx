"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const URGENCIES = [
  { value: "critical", label: "Critical" },
  { value: "urgent", label: "Urgent" },
  { value: "normal", label: "Normal" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    patient_name: "",
    hospital: "",
    blood_type: "",
    rhesus: "",
    bags: "1",
    urgency: "normal",
    latitude: "",
    longitude: "",
    city: "",
    contact_phone: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string | null) => setForm(prev => ({ ...prev, [field]: value ?? "" }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/requests", {
        ...form,
        bags: parseInt(form.bags),
        latitude: parseFloat(form.latitude || "0"),
        longitude: parseFloat(form.longitude || "0"),
      });
      toast.success("Permintaan darah dibuat");
      router.push("/search");
    } catch {
      toast.error("Gagal membuat permintaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Permintaan Darah Darurat</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Pasien</Label>
              <Input value={form.patient_name} onChange={e => update("patient_name", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Rumah Sakit</Label>
              <Input value={form.hospital} onChange={e => update("hospital", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Golongan Darah</Label>
                <Select value={form.blood_type || ""} onValueChange={v => update("blood_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rhesus</Label>
                <Select value={form.rhesus || ""} onValueChange={v => update("rhesus", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="-">-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Jumlah Kantong</Label>
                <Input type="number" min="1" value={form.bags} onChange={e => update("bags", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tingkat Urgensi</Label>
                <Select value={form.urgency || ""} onValueChange={v => update("urgency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kota</Label>
              <Input value={form.city} onChange={e => update("city", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Kontak WhatsApp</Label>
              <Input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} required placeholder="628123456789" />
            </div>
            <div className="space-y-1">
              <Label>Catatan (opsional)</Label>
              <Input value={form.notes} onChange={e => update("notes", e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Kirim Permintaan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
