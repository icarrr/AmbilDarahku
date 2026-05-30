"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type History = {
  id: string;
  donation_date: string;
  location: string;
  institution: string;
  bags: number;
  notes?: string;
  verification_status: string;
};

export default function DonorHistoryPage() {
  const [histories, setHistories] = useState<History[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donation_date: "", location: "", institution: "", bags: "1", notes: "" });

  useEffect(() => {
    api.get<{ histories: History[] }>("/donor-history").then(d => setHistories(d.histories)).catch(() => {});
  }, []);

  const addHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/donor-history", { ...form, bags: parseInt(form.bags) });
      toast.success("Riwayat donor ditambahkan");
      setShowForm(false);
      setForm({ donation_date: "", location: "", institution: "", bags: "1", notes: "" });
      const d = await api.get<{ histories: History[] }>("/donor-history");
      setHistories(d.histories);
    } catch {
      toast.error("Gagal menambah riwayat");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat Donor</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Batal" : "Tambah Riwayat"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Tambah Riwayat Donor</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addHistory} className="space-y-3">
              <div className="space-y-1">
                <Label>Tanggal Donor</Label>
                <Input type="date" value={form.donation_date} onChange={e => setForm(p => ({ ...p, donation_date: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Lokasi</Label>
                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Instansi</Label>
                <Input value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Jumlah Kantong</Label>
                  <Input type="number" min="1" value={form.bags} onChange={e => setForm(p => ({ ...p, bags: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Catatan (opsional)</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <Button type="submit">Simpan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {histories.length === 0 && (
        <p className="text-center text-gray-500 py-8">Belum ada riwayat donor</p>
      )}

      {histories.map(h => (
        <Card key={h.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{h.donation_date}</p>
                <p className="text-sm text-gray-500">{h.institution} &middot; {h.location}</p>
                <p className="text-sm text-gray-500">{h.bags} kantong{h.notes ? ` · ${h.notes}` : ""}</p>
              </div>
              <Badge variant={h.verification_status === "verified" ? "default" : "secondary"}>
                {h.verification_status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
