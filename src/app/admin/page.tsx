"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

type UserItem = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  blood_type: string;
  city: string;
  total_donations: number;
  eligibility_status: string;
  availability_status: string;
  created_at: string;
};

type AdminStats = {
  pending_claims: number;
  pending_verifications: number;
  total_users: number;
  total_donors: number;
  total_donations: number;
};

const ROLES = ["donor", "super_admin", "community_admin", "pmi_admin", "hospital_admin"];

const ROLE_LABELS: Record<string, string> = {
  donor: "Donor",
  super_admin: "Super Admin",
  community_admin: "Admin Komunitas",
  pmi_admin: "Admin PMI",
  hospital_admin: "Admin RS",
};

const ELIGIBILITY_LABELS: Record<string, string> = {
  eligible: "Sehat",
  waiting_period: "Masa Tunggu",
  not_eligible: "Tidak Syarat",
  needs_clearance: "Izin Dokter",
};

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"dashboard" | "users">("dashboard");

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ users: UserItem[] }>("/admin/users").then(d => setUsers(d.users || [])).catch(() => {});
    api.get<AdminStats>("/admin/stats").then(d => setStats(d)).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Akses ditolak. Halaman ini hanya untuk admin.</p>
      </div>
    );
  }

  const updateRole = async (id: string, role: string) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success("Role diperbarui");
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {
      toast.error("Gagal memperbarui role");
    }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel Admin</h1>
        <div className="flex gap-2">
          <Button variant={tab === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setTab("dashboard")}>
            Dashboard
          </Button>
          <Button variant={tab === "users" ? "default" : "outline"} size="sm" onClick={() => setTab("users")}>
            Pengguna
          </Button>
        </div>
      </div>

      {tab === "dashboard" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donor</CardDescription>
                <CardTitle className="text-3xl">{stats?.total_donors ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donasi</CardDescription>
                <CardTitle className="text-3xl">{stats?.total_donations ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardDescription className="text-red-600">Klaim Tertunda</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats?.pending_claims ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardDescription className="text-amber-600">Verif Tertunda</CardDescription>
                <CardTitle className="text-3xl text-amber-600">{stats?.pending_verifications ?? "—"}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/admin/claims">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200 h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="destructive">{stats?.pending_claims ?? 0}</Badge>
                    Klaim Donasi
                  </CardTitle>
                  <CardDescription>
                    Review klaim riwayat donasi dari donor. Periksa bukti dan setujui/tolak.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/verifications">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200 h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-700">{stats?.pending_verifications ?? 0}</Badge>
                    Verifikasi Donor
                  </CardTitle>
                  <CardDescription>
                    Tinjau permintaan verifikasi level donor. Setujui untuk naikkan level verifikasi.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/awards">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Konfigurasi Award</CardTitle>
                  <CardDescription>Atur kriteria dan jenis penghargaan donor.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/analytics">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Analitik Donasi</CardTitle>
                  <CardDescription>Data agregat donasi per institusi, kota, bulan, usia, dan top donor.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>Manajemen Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm mb-4"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Darah</th>
                    <th className="pb-2 font-medium">Kota</th>
                    <th className="pb-2 font-medium">Donor</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-900">
                      <td className="py-2 pr-4">{u.full_name}</td>
                      <td className="py-2 pr-4 text-gray-500">{u.email}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{ROLE_LABELS[u.role] || u.role}</Badge>
                      </td>
                      <td className="py-2 pr-4">{u.blood_type}</td>
                      <td className="py-2 pr-4">{u.city}</td>
                      <td className="py-2 pr-4">{u.total_donations}x</td>
                      <td className="py-2 pr-4">
                        <Badge variant={u.eligibility_status === "eligible" ? "default" : "secondary"} className="text-xs">
                          {ELIGIBILITY_LABELS[u.eligibility_status] || u.eligibility_status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Select
                          value={u.role}
                          onValueChange={v => updateRole(u.id, v ?? "donor")}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-4">Tidak ada pengguna</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
