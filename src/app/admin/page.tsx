"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { RefreshCw, Droplets, Wrench, Flag, CheckCircle2, XCircle, Archive, Timer, AlertCircle } from "lucide-react";

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
  contact_consent?: boolean;
  created_at: string;
};

type AdminStats = {
  pending_claims: number;
  pending_verifications: number;
  total_users: number;
  total_donors: number;
  total_donations: number;
};

type ScrapeRun = {
  id: string;
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  counts: {
    eventsNew: number | null;
    eventsScraped: number | null;
    bloodRequestsAffected: number | null;
    profilesInserted: number | null;
    donorsInserted: number | null;
    donorStatusesUpdated: number | null;
  };
};

type ScrapeStatus = {
  enabled: boolean;
  intervalMinutes: number;
  status: string;
  lockStartedAt: string | null;
  lastRunAt: string | null;
  consecutiveFailures: number;
  nextRunAt: string | null;
  runs: ScrapeRun[];
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

const RUN_STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Sukses",
  FAILED: "Gagal",
  RUNNING: "Berjalan",
};

function formatInterval(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? "tiap jam" : `tiap ${h} jam`;
  }
  return `tiap ${minutes} menit`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8"><Skeleton className="h-40 w-full" /></div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const { isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: "dashboard" | "users" = searchParams.get("tab") === "users" ? "users" : "dashboard";
  const setTab = (t: "dashboard" | "users") => {
    router.replace(t === "users" ? `${pathname}?tab=users` : pathname, { scroll: false });
  };
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);
  const [consentSavingId, setConsentSavingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{ user: UserItem; role: string } | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
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
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [scrapeStatusError, setScrapeStatusError] = useState<string | null>(null);

  const loadScrapeStatus = async () => {
    try {
      const d = await api.get<ScrapeStatus>("/admin/scrape");
      setScrapeStatus(d);
      setScrapeStatusError(null);
    } catch (err: unknown) {
      setScrapeStatusError(err instanceof Error ? err.message : "Gagal memuat status scraper");
    }
  };

  const loadUsers = async () => {
    try {
      const d = await api.get<{ users: UserItem[] }>("/admin/users");
      setUsers(d.users || []);
      setUsersError(null);
    } catch (err: unknown) {
      setUsersError(err instanceof Error ? err.message : "Gagal memuat pengguna");
    } finally {
      setUsersLoading(false);
    }
  };

  const retryUsers = () => {
    setUsersLoading(true);
    setUsersError(null);
    loadUsers();
  };

  const setMaintenance = async (newVal: boolean) => {
    setTogglingMaintenance(true);
    try {
      await api.post("/admin/maintenance", { enabled: newVal });
      setMaintenanceMode(newVal);
      toast.success(newVal ? "Mode pemeliharaan AKTIF" : "Mode pemeliharaan NONAKTIF");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah mode pemeliharaan");
    } finally {
      setTogglingMaintenance(false);
      setConfirmMaintenance(false);
    }
  };

  const onMaintenanceClick = () => {
    if (maintenanceMode) setMaintenance(false);
    else setConfirmMaintenance(true);
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
      loadScrapeStatus();
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    api.get<AdminStats>("/admin/stats").then(d => setStats(d)).catch(() => {});
    api.get<{ enabled: boolean }>("/admin/maintenance").then(d => setMaintenanceMode(d.enabled)).catch(() => {});
    loadScrapeStatus();
    const t = setInterval(loadScrapeStatus, 15000);
    return () => clearInterval(t);
  }, [isAdmin]);

  const updateRole = async (id: string, role: string) => {
    setRoleSavingId(id);
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success("Role diperbarui");
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {
      toast.error("Gagal memperbarui role");
    } finally {
      setRoleSavingId(null);
      setPendingRole(null);
    }
  };

  const onRoleChange = (u: UserItem, role: string) => {
    if (role === u.role) return;
    if (role === "super_admin" || u.role === "super_admin") {
      setPendingRole({ user: u, role });
    } else {
      updateRole(u.id, role);
    }
  };

  const toggleConsent = async (id: string, contact_consent: boolean) => {
    setConsentSavingId(id);
    try {
      await api.put(`/admin/users/${id}/role`, { contact_consent });
      toast.success(contact_consent ? "Kontak diizinkan" : "Kontak dinonaktifkan");
      setUsers(prev => prev.map(u => u.id === id ? { ...u, contact_consent } : u));
    } catch {
      toast.error("Gagal memperbarui preferensi kontak");
    } finally {
      setConsentSavingId(null);
    }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
            <Link href="/admin/reports">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    Laporan Penyalahgunaan
                  </CardTitle>
                  <CardDescription>Tinjau laporan penipuan, spam, dan penyalahgunaan kontak.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          <Card className={maintenanceMode ? "border-amber-400 ring-1 ring-amber-400" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className={`h-4 w-4 ${maintenanceMode ? "text-amber-500" : "text-muted-foreground"}`} />
                Mode Pemeliharaan
              </CardTitle>
              <CardDescription>
                Saat aktif, pengunjung melihat halaman pemeliharaan. API dan halaman admin tetap dapat diakses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceMode}
                    aria-label="Mode pemeliharaan"
                    onClick={onMaintenanceClick}
                    disabled={togglingMaintenance}
                    className="-m-2 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full p-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  >
                    <span
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        maintenanceMode ? "bg-amber-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          maintenanceMode ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                  <span className={`text-sm font-semibold ${maintenanceMode ? "text-amber-600" : "text-muted-foreground"}`}>
                    {maintenanceMode ? "Aktif" : "Aman"}
                  </span>
                </div>
                <Badge variant={maintenanceMode ? "destructive" : "outline"}>
                  {maintenanceMode ? "Pengunjung melihat maint. page" : "Semua normal"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <ConfirmDialog
            open={confirmMaintenance}
            variant="destructive"
            title="Aktifkan mode pemeliharaan?"
            description="Situs publik tidak akan dapat diakses: semua pengunjung akan melihat halaman pemeliharaan sampai mode ini dimatikan. Halaman admin dan API tetap berjalan."
            confirmText="Aktifkan"
            loading={togglingMaintenance}
            onConfirm={() => setMaintenance(true)}
            onCancel={() => setConfirmMaintenance(false)}
          />

          {scrapeStatusError && !scrapeStatus && (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="min-w-0 flex-1 break-words text-muted-foreground">
                  Status scraper tidak dapat dimuat: {scrapeStatusError}
                </span>
                <Button size="sm" variant="outline" onClick={loadScrapeStatus}>Coba lagi</Button>
              </CardContent>
            </Card>
          )}

          {scrapeStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${scrapeStatus.status === "RUNNING" ? "text-amber-500 animate-spin" : "text-muted-foreground"}`} />
                  Scraper Otomatis
                  <Badge variant={scrapeStatus.status === "RUNNING" ? "destructive" : scrapeStatus.consecutiveFailures > 0 ? "outline" : "default"} className="text-xs">
                    {scrapeStatus.status === "RUNNING" ? "Berjalan" : scrapeStatus.consecutiveFailures > 0 ? `Gagal (${scrapeStatus.consecutiveFailures}x)` : "Idle"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {scrapeStatus.enabled
                    ? `Jadwal supabase (pg_cron) — tiap ${scrapeStatus.intervalMinutes} menit, tanpa cron eksternal.`
                    : "Scheduler belum aktif — set SCRAPE_TARGET_URL + CRON_SECRET lalu jalankan npm run migrate."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Last Run</p>
                    <p className="font-medium">{formatDateTime(scrapeStatus.lastRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Run</p>
                    <p className="font-medium">{formatDateTime(scrapeStatus.nextRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status Terakhir</p>
                    <p className="font-medium">{scrapeStatus.runs[0] ? RUN_STATUS_LABELS[scrapeStatus.runs[0].status] || scrapeStatus.runs[0].status : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Durasi</p>
                    <p className="font-medium">{scrapeStatus.runs[0]?.durationMs ? `${(scrapeStatus.runs[0].durationMs / 1000).toFixed(1)} dtk` : "—"}</p>
                  </div>
                </div>
                {scrapeStatus.runs[0]?.counts && (
                  <p className="text-xs text-muted-foreground pt-2">
                    Event: {scrapeStatus.runs[0].counts.eventsNew ?? "—"} · Darah: {scrapeStatus.runs[0].counts.bloodRequestsAffected ?? "—"} · Profil: {scrapeStatus.runs[0].counts.profilesInserted ?? "—"} · Donor: {scrapeStatus.runs[0].counts.donorsInserted ?? "—"} · Status Donor: {scrapeStatus.runs[0].counts.donorStatusesUpdated ?? "—"}
                  </p>
                )}
                {scrapeStatus.runs[0]?.errorMessage && (
                  <p className="text-xs text-red-500 pt-1 break-words line-clamp-3" title={scrapeStatus.runs[0].errorMessage}>
                    Alasan: {scrapeStatus.runs[0].errorMessage}
                  </p>
                )}
                {scrapeStatus.runs.length > 1 && (
                  <div className="pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Riwayat terakhir</p>
                    <ul className="mt-1 divide-y divide-border text-xs">
                      {scrapeStatus.runs.slice(0, 5).map(r => (
                        <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1">
                          <span className="tabular-nums text-muted-foreground">{formatDateTime(r.startedAt)}</span>
                          <span className={r.status === "FAILED" ? "font-medium text-red-600" : r.status === "SUCCESS" ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
                            {RUN_STATUS_LABELS[r.status] || r.status}
                          </span>
                          <span className="text-muted-foreground">
                            Event {r.counts.eventsNew ?? "—"} · Darah {r.counts.bloodRequestsAffected ?? "—"} · Profil {r.counts.profilesInserted ?? "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Scrape Semua
              </CardTitle>
              <CardDescription>
                Scrape event donor darah + permintaan darah + profil donor dari sumber eksternal.
                {scrapeStatus?.enabled ? ` Berjalan otomatis ${formatInterval(scrapeStatus.intervalMinutes)}.` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                <Button onClick={handleScrape} disabled={scraping} size="sm">
                  {scraping ? "Memproses..." : "Scrape Now"}
                </Button>
                {scraping && (
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Mengumpulkan data...
                  </span>
                )}
              </div>
              {scrapeResult && !scraping && (
                <div className="text-sm space-y-2">
                  <p className="text-green-600 font-medium flex items-start gap-1.5">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>Event: {scrapeResult.totalScraped} ditemukan, {scrapeResult.totalNew} baru
                    {scrapeResult.totalErrors > 0 && <span className="text-red-500">, {scrapeResult.totalErrors} error</span>}</span>
                  </p>
                  <div className="pl-4 space-y-1">
                    {scrapeResult.sources.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {s.error ? (
                          <span className="flex items-start gap-1 text-red-500" title={s.error}>
                            <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                            <span className="min-w-0 break-words [overflow-wrap:anywhere] line-clamp-3">{s.name}: {s.error}</span>
                          </span>
                        ) : (
                          <span>{s.name}: {s.found} event ({s.new} baru)</span>
                        )}
                      </p>
                    ))}
                    {scrapeResult.archivedCount > 0 && (
                      <p className="text-amber-600 text-xs flex items-center gap-1"><Archive className="h-3.5 w-3.5 shrink-0" /> {scrapeResult.archivedCount} event lama diarsipkan</p>
                    )}
                  </div>
                  {brResult && (
                    <>
                      <p className="text-green-600 font-medium flex items-start gap-1.5">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Darah: {brResult.affected} permintaan diproses dari {brResult.total}
                        {brResult.errors > 0 && <span className="text-red-500">, {brResult.errors} error</span>}</span>
                      </p>
                    </>
                  )}
                  {profileResult && (
                    <>
                      <p className="text-green-600 font-medium flex items-start gap-1.5">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Profil: {profileResult.profilesInserted} profil baru, {profileResult.donorsInserted} donor baru
                        {profileResult.profilesSkipped > 0 && <span className="text-muted-foreground"> ({profileResult.profilesSkipped} sudah ada)</span>}
                        {profileResult.donorsSkipped > 0 && <span className="text-muted-foreground"> · {profileResult.donorsSkipped} donor skip</span>}</span>
                      </p>
                    </>
                  )}
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Timer className="h-3.5 w-3.5 shrink-0" /> Event {(scrapeResult.durationMs / 1000).toFixed(1)}s{brResult ? ` · Darah ${(brResult.durationMs / 1000).toFixed(1)}s` : ""}{profileResult ? ` · Profil ${(profileResult.durationMs / 1000).toFixed(1)}s` : ""}</p>
                </div>
              )}
              {scrapeError && !scraping && (
                <p className="text-sm text-red-600 break-words [overflow-wrap:anywhere] line-clamp-3" title={scrapeError}>{scrapeError}</p>
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
              aria-label="Cari pengguna"
              className="w-full px-3 py-2 border border-border bg-transparent rounded-md text-sm mb-4"
            />
            {usersLoading ? (
              <div className="space-y-2" aria-busy="true" aria-label="Memuat pengguna">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : usersError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground break-words">Gagal memuat pengguna: {usersError}</p>
                <Button size="sm" variant="outline" onClick={retryUsers}>Coba lagi</Button>
              </div>
            ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nama</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Darah</th>
                    <th className="pb-2 font-medium">Kota</th>
                    <th className="pb-2 font-medium">Donor</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Kontak</th>
                    <th className="pb-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const isSelf = u.id === user?.id;
                    return (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-4">{u.full_name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        <span className="block truncate max-w-[200px]" title={u.email}>{u.email}</span>
                      </td>
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
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() => toggleConsent(u.id, !u.contact_consent)}
                          disabled={consentSavingId === u.id}
                          aria-pressed={!!u.contact_consent}
                          aria-label={`Izin kontak ${u.full_name}: ${u.contact_consent ? "boleh dihubungi" : "tidak"}`}
                          title="Boleh dihubungi untuk donor?"
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            u.contact_consent ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.contact_consent ? "Boleh dihubungi" : "Tidak"}
                        </button>
                      </td>
                      <td className="py-2">
                        <Select
                          value={u.role}
                          items={ROLE_LABELS}
                          onValueChange={v => onRoleChange(u, v ?? "donor")}
                          disabled={isSelf || roleSavingId === u.id}
                        >
                          <SelectTrigger
                            className="w-36 h-8 text-xs"
                            aria-label={`Role ${u.full_name}`}
                            title={isSelf ? "Anda tidak dapat mengubah role Anda sendiri" : undefined}
                          >
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Tidak ada pengguna</p>
            )}
            </>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingRole}
        variant="destructive"
        title="Ubah role Super Admin?"
        description={pendingRole ? (
          <>
            Role <strong>{pendingRole.user.full_name}</strong> akan diubah dari{" "}
            <strong>{ROLE_LABELS[pendingRole.user.role] || pendingRole.user.role}</strong> menjadi{" "}
            <strong>{ROLE_LABELS[pendingRole.role] || pendingRole.role}</strong>.{" "}
            {pendingRole.role === "super_admin"
              ? "Super Admin memiliki akses penuh ke panel admin."
              : "Pengguna ini akan kehilangan akses Super Admin."}
          </>
        ) : null}
        confirmText="Ubah Role"
        loading={!!pendingRole && roleSavingId === pendingRole.user.id}
        onConfirm={() => pendingRole && updateRole(pendingRole.user.id, pendingRole.role)}
        onCancel={() => setPendingRole(null)}
      />
    </div>
  );
}
