"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ users: UserItem[] }>("/admin/users").then(d => setUsers(d.users || [])).catch(() => {});
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
    </div>
  );
}
