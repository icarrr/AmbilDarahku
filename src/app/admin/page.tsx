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
import { RefreshCw, Droplets, Wrench } from "lucide-react";

type UserItem = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  blood_type: string;
  city: string;
  city_name?: string;
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
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{
    totalSources: number;
    totalScraped: number;
    totalNew: number;
    totalErrors: number;
    archivedCount: number;
    sources: { name: string; found: number; new: number; error?: string }[];
    durationMs: number;
  } | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [brResult, setBrResult] = useState<{ total: number; affected: number; errors: number; durationMs: number } | null>(null);
  const [profileResult, setProfileResult] = useState<{
    profilesFetched: number;
    profilesInserted: number;
    profilesSkipped: number;
    donorsFetched: number;
    donorsInserted: number;
    donorsSkipped: number;
    durationMs: number;
  } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const newVal = !maintenanceMode;
      await api.post("/admin/maintenance", { enabled: newVal });
      setMaintenanceMode(newVal);
      toast.success(newVal ? "Mode pemeliharaan AKTIF" : "Mode pemeliharaan NONAKTIF");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah mode pemeliharaan");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResult(null);
    setBrResult(null);
    setProfileResult(null);
    setScrapeError(null);
    try {
      const data = await api.post<any>("/discover");
      setScrapeResult(data.events);
      setBrResult(data.bloodRequests);
      setProfileResult(data.profiles);
      const parts: string[] = [];
      if (data.events) parts.push(`Event: ${data.events.totalNew} baru`);
      if (data.bloodRequests) parts.push(`Darah: ${data.bloodRequests.affected} diproses`);
      if (data.profiles) {
        const p = data.profiles;
        if (p.profilesInserted > 0 || p.donorsInserted > 0) {
          parts.push(`Profil: ${p.profilesInserted} donor + ${p.donorsInserted} baru`);
        }
      }
      toast.success(parts.join(" · ") || "Scrape selesai");
    } catch (err: any) {
      const msg = err.message || "Gagal menjalankan scrape";
      setScrapeError(msg);
      toast.error(msg);
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ users: UserItem[] }>("/admin/users").then(d => setUsers(d.users || [])).catch(() => {});
    api.get<AdminStats>("/admin/stats").then(d => setStats(d)).catch(() => {});
    api.get<{ enabled: boolean }>("/admin/maintenance").then(d => setMaintenanceMode(d.enabled)).catch(() => {});
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
                <CardDescription>Total Calon Donor</CardDescription>
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
            <Link href="/admin/blood-requests">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-red-500" />
                    Permintaan Darah
                  </CardTitle>
                  <CardDescription>Kelola permintaan donor darah, tandai terpenuhi untuk donasi langsung.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <Card className={maintenanceMode ? "border-amber-400 ring-1 ring-amber-400" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className={`h-4 w-4 ${maintenanceMode ? "text-amber-500" : "text-gray-500"}`} />
                Mode Pemeliharaan
              </CardTitle>
              <CardDescription>
                Saat aktif, pengunjung melihat halaman pemeliharaan. API dan halaman admin tetap dapat diakses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMaintenance}
                    disabled={togglingMaintenance}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      maintenanceMode ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        maintenanceMode ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${maintenanceMode ? "text-amber-600" : "text-gray-500"}`}>
                    {maintenanceMode ? "Aktif" : "Aman"}
                  </span>
                </div>
                <Badge variant={maintenanceMode ? "destructive" : "outline"}>
                  {maintenanceMode ? "Pengunjung melihat maint. page" : "Semua normal"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Scrape Semua
              </CardTitle>
              <CardDescription>
                Scrape event donor darah + permintaan darah + profil donor dari sumber eksternal. Berjalan otomatis tiap jam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-3">
                <Button onClick={handleScrape} disabled={scraping} size="sm">
                  {scraping ? "Memproses..." : "Scrape Now"}
                </Button>
                {scraping && (
                  <span className="text-sm text-gray-500 animate-pulse">
                    Mengumpulkan data...
                  </span>
                )}
              </div>
              {scrapeResult && !scraping && (
                <div className="text-sm space-y-2">
                  <p className="text-green-600 font-medium">
                    ✓ Event: {scrapeResult.totalScraped} ditemukan, {scrapeResult.totalNew} baru
                    {scrapeResult.totalErrors > 0 && <span className="text-red-500">, {scrapeResult.totalErrors} error</span>}
                  </p>
                  <div className="pl-4 space-y-1">
                    {scrapeResult.sources.map((s, i) => (
                      <p key={i} className="text-xs text-gray-600">
                        {s.error ? (
                          <span className="text-red-500">✗ {s.name}: {s.error}</span>
                        ) : (
                          <span>{s.name}: {s.found} event ({s.new} baru)</span>
                        )}
                      </p>
                    ))}
                    {scrapeResult.archivedCount > 0 && (
                      <p className="text-amber-600 text-xs">🗄 {scrapeResult.archivedCount} event lama diarsipkan</p>
                    )}
                  </div>
                  {brResult && (
                    <>
                      <p className="text-green-600 font-medium">
                        ✓ Darah: {brResult.affected} permintaan diproses dari {brResult.total}
                        {brResult.errors > 0 && <span className="text-red-500">, {brResult.errors} error</span>}
                      </p>
                    </>
                  )}
                  {profileResult && (
                    <>
                      <p className="text-green-600 font-medium">
                        ✓ Profil: {profileResult.profilesInserted} profil baru, {profileResult.donorsInserted} donor baru
                        {profileResult.profilesSkipped > 0 && <span className="text-gray-500"> ({profileResult.profilesSkipped} sudah ada)</span>}
                        {profileResult.donorsSkipped > 0 && <span className="text-gray-500"> · {profileResult.donorsSkipped} donor skip</span>}
                      </p>
                    </>
                  )}
                  <p className="text-gray-400 text-xs">⏱ Event {(scrapeResult.durationMs / 1000).toFixed(1)}s{brResult ? ` · Darah ${(brResult.durationMs / 1000).toFixed(1)}s` : ""}{profileResult ? ` · Profil ${(profileResult.durationMs / 1000).toFixed(1)}s` : ""}</p>
                </div>
              )}
              {scrapeError && !scraping && (
                <p className="text-sm text-red-600">{scrapeError}</p>
              )}
            </CardContent>
          </Card>
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
                      <td className="py-2 pr-4">{u.city_name || u.city}</td>
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
