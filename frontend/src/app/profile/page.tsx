"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type BadgeType = {
  id: string;
  badge: { name: string; description: string; min_donations: number };
};

type DonorStatus = {
  eligibility_status: string;
  last_donation_date: string | null;
  search_priority: number;
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [status, setStatus] = useState<DonorStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", username: "" });

  useEffect(() => {
    if (!user) return;
    api.get<{ badges: BadgeType[] }>("/auth/me").then(d => setBadges(d.badges)).catch(() => {});
    api.get<DonorStatus>("/donor-status").then(setStatus).catch(() => {});
    setForm({ full_name: user.full_name, phone: user.phone, city: user.city, username: user.username || "" });
  }, [user]);

  const updateProfile = async () => {
    try {
      await api.put("/auth/me", form);
      toast.success("Profil diperbarui");
      setEditing(false);
      refreshUser();
    } catch {
      toast.error("Gagal memperbarui profil");
    }
  };

  const updateStatus = async (mode: string, availStatus: string) => {
    try {
      await api.put("/donor-status", { availability_mode: mode, availability_status: availStatus });
      toast.success("Status diperbarui");
      const s = await api.get<DonorStatus>("/donor-status");
      setStatus(s);
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profil Donor</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Batal" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-2xl font-bold text-red-700">
              {user.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.full_name}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{user.blood_type}{user.rhesus}</Badge>
                <Badge variant="secondary">{user.city}</Badge>
              </div>
            </div>
          </div>

          {status && (
            <div className="flex gap-2 flex-wrap">
              <Badge variant={status.eligibility_status === "eligible" ? "default" : "secondary"}>
                {status.eligibility_status === "eligible" ? "Eligible Donor" : "Masa Pemulihan"}
              </Badge>
              <Badge>Prioritas: {status.search_priority}</Badge>
            </div>
          )}

          {editing && (
            <div className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nama</Label>
                  <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>WhatsApp</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Kota</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                </div>
              </div>
              <Button onClick={updateProfile}>Simpan</Button>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Status Ketersediaan</h3>
            <div className="flex gap-2">
              <Select defaultValue="automatic" onValueChange={v => updateStatus(v ?? "automatic", "available")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Otomatis</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="available" onValueChange={v => updateStatus("manual", v ?? "available")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Siap Donor</SelectItem>
                  <SelectItem value="temporarily_unavailable">Tidak Tersedia</SelectItem>
                  <SelectItem value="permanently_unavailable">Berhenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badge & Pencapaian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {badges.length === 0 && <p className="text-sm text-gray-500">Belum ada badge</p>}
            {badges.map(b => (
              <Badge key={b.id} variant="outline" className="text-sm py-1">
                {b.badge.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <a href="/donor-history" className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">Riwayat Donor</a>
        <a href={user.username ? `/u/${user.username}` : "#"} className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">Portfolio Publik</a>
      </div>
    </div>
  );
}
