"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate, getRecoveryEndDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { AvatarWithBadge } from "@/components/avatar-with-badge";
import { SectionTitle } from "@/components/section-title";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import {
  Droplets, Heart, Plus, Search, Calendar, Trophy, MessageCircle, Award, Bell,
  CalendarDays, Camera, ChevronRight, ShieldAlert, Shield, Medal, Lock,
} from "lucide-react";

type BadgeData = {
  id: string;
  badge: { name: string; description: string; min_donations: number };
};

type DonorStatus = {
  eligibility_status: string;
  last_donation_date: string | null;
  search_priority: number;
  availability_mode: string;
  availability_status: string;
  reasons?: { status: string; reason: string; passed: boolean; rule: string }[];
};

type UrgentRequest = {
  id: string;
  patient_name: string;
  blood_type: string;
  hospital: string;
  city: string;
  urgency: string;
  notes?: string;
  contact_phone: string;
};

export default function ProfilePage() {
  const { user, refreshUser, isUnverified } = useAuth();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [status, setStatus] = useState<DonorStatus | null>(null);
  const [urgentRequests, setUrgentRequests] = useState<UrgentRequest[]>([]);
  const [stats, setStats] = useState({ total_donations: user?.total_donations || 0, total_points: user?.total_points || 0 });
  const [trustScore, setTrustScore] = useState<number | null>(user?.trust_score ?? null);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", city: "", username: "",
    province: "", district: "", blood_type: "", date_of_birth: "", gender: "",
    latitude: "", longitude: "", weight_kg: "", height_cm: "",
  });

  useEffect(() => {
    if (!user) return;
    api.get<{ user: { total_donations: number; total_points: number; trust_score?: number }; badges: BadgeData[] }>("/auth/me")
      .then(d => { setBadges(d.badges || []); setStats({ total_donations: d.user.total_donations || 0, total_points: d.user.total_points || 0 }); if (d.user.trust_score !== undefined) setTrustScore(d.user.trust_score); })
      .catch(() => {});
    api.get<DonorStatus>("/donor-status").then(setStatus).catch(() => {});
    api.get<{ requests: UrgentRequest[] }>("/requests?urgency=critical,urgent&limit=5").then(d => setUrgentRequests(d.requests || [])).catch(() => {});
    setForm({
      full_name: user.full_name, phone: user.phone, city: user.city, username: user.username || "",
      province: user.province || "", district: user.district || "",
      blood_type: user.blood_type || "",
      date_of_birth: user.date_of_birth ? String(user.date_of_birth).split("T")[0] : "",
      gender: user.gender || "",
      latitude: String(user.latitude ?? ""),
      longitude: String(user.longitude ?? ""),
      weight_kg: String(user.weight_kg ?? ""),
      height_cm: String(user.height_cm ?? ""),
    });
  }, [user]);

  const updateProfile = async () => {
    try {
      let avatarUrl = "";
      if (avatarFile) avatarUrl = await api.upload("/upload", avatarFile);
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v !== "") {
          if (k === "latitude" || k === "longitude" || k === "weight_kg" || k === "height_cm") {
            payload[k] = Number(v);
          } else {
            payload[k] = v;
          }
        }
      }
      if (avatarUrl) payload.avatar_url = avatarUrl;
      await api.put("/auth/me", payload);
      toast.success("Profil diperbarui");
      setEditing(false);
      setAvatarFile(null);
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

  if (!user) return <div className="mx-auto max-w-7xl px-5 py-6"><p className="text-muted-foreground">Memuat...</p></div>;

  const [showChangePassword, setShowChangePassword] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async () => {
    if (pwForm.new_password.length < 6) { toast.error("Kata sandi minimal 6 karakter"); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error("Kata sandi tidak cocok"); return; }
    setPwLoading(true);
    try {
      await api.put("/auth/change-password", { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success("Kata sandi berhasil diubah");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setShowChangePassword(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah kata sandi");
    } finally {
      setPwLoading(false);
    }
  };
  const totalDonations = stats.total_donations;
  const volumePerBag = user.weight_kg && user.weight_kg <= 55 ? 0.35 : 0.45;
  const liters = (totalDonations * volumePerBag).toFixed(2);
  const topBadge = badges[0]?.badge?.name || "Pemula";

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Halo,</p>
              <h1 className="font-heading text-xl font-bold text-foreground">{user.full_name}</h1>
              <p className="text-xs text-[#94a3b8]">
                Terima kasih telah menjadi bagian dari pahlawan hari ini.
                {formatDate(status?.last_donation_date) && ` Anda terakhir donor ${formatDate(status?.last_donation_date)}.`}
              </p>
              {["waiting_period", "not_eligible"].includes(status?.eligibility_status || "") && getRecoveryEndDate(status?.last_donation_date) && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  Donor selanjutnya {getRecoveryEndDate(status?.last_donation_date)}
                </p>
              )}
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <Bell className="h-5 w-5 text-[#94a3b8]" />
              <AvatarWithBadge name={user.full_name} avatarUrl={user.avatar_url} size="md" badge={{ label: topBadge, level: "gold" }} />
            </div>
            <AvatarWithBadge name={user.full_name} avatarUrl={user.avatar_url} size="lg" badge={{ label: topBadge, level: "gold" }} className="md:hidden" />
          </div>

          {isUnverified && (
            <GlassCard className="border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Email Belum Diverifikasi</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Verifikasi email Anda untuk mengakses semua fitur.{" "}
                    <Link href="/verify-email" className="font-medium text-amber-800 underline hover:text-amber-900">Kirim ulang verifikasi</Link>
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Status Ketersediaan</p>
                <p className="text-xs text-muted-foreground">
                  {status?.availability_status === "available" ? "Siap Donor" : "Sedang sibuk"}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateStatus(
                status?.availability_mode || "automatic",
                status?.availability_status === "available" ? "temporarily_unavailable" : "available"
              )}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                status?.availability_status === "available" ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-gray-300"
              }`}
            >
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                status?.availability_status === "available" ? "translate-x-5.5" : "translate-x-0.5"
              }`} />
            </button>
          </GlassCard>

          <Link href="/verification" className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-3 transition-colors hover:from-blue-100 hover:to-purple-100">
            <Shield className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                Verifikasi Level {user.verification_level || 0} / 3
              </p>
              <p className="text-[10px] text-muted-foreground">
                {!user.verification_level ? "Tingkatkan kepercayaan" :
                 user.verification_level === 1 ? "Laporan Mandiri" :
                 user.verification_level === 2 ? "Terverifikasi Komunitas" :
                 "Terverifikasi PMI"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#94a3b8]" />
          </Link>

          <button
            onClick={() => { api.post("/trust-score/refresh", {}).then((d: unknown) => {
              const result = d as Record<string, unknown>;
              const ts = result.trust_score as Record<string, unknown>;
              if (ts?.overall !== undefined) setTrustScore(ts.overall as number);
              toast.success("Skor kepercayaan diperbarui");
            }).catch(() => toast.error("Gagal memperbarui skor")) }}
            className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-3 transition-colors hover:from-green-100 hover:to-emerald-100 text-left w-full"
          >
            <Heart className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                Skor Kepercayaan: {trustScore !== null ? trustScore.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Ketuk untuk memperbarui
              </p>
            </div>
            <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
              <div className={`h-2 w-2 rounded-full ${
                trustScore !== null && trustScore >= 80 ? "bg-green-500" :
                trustScore !== null && trustScore >= 60 ? "bg-amber-500" : "bg-gray-400"
              }`} />
            </div>
          </button>

          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="text-center">
              <Droplets className="mx-auto h-5 w-5 text-red-600" />
              <p className="mt-1 font-heading text-lg font-bold text-foreground">{totalDonations}</p>
              <p className="text-[10px] text-muted-foreground">Total Donor</p>
              <p className="text-[10px] text-[#94a3b8]">{liters} L</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Award className="mx-auto h-5 w-5 text-amber-500" />
              <p className="mt-1 font-heading text-lg font-bold text-foreground">{topBadge}</p>
              <p className="text-[10px] text-muted-foreground">Lencana</p>
              <p className="text-[10px] text-[#94a3b8]">Peringkat Emas</p>
            </GlassCard>
            <GlassCard className="text-center">
              <Trophy className="mx-auto h-5 w-5 text-red-600" />
              <p className="mt-1 font-heading text-lg font-bold text-foreground">{stats.total_points}</p>
              <p className="text-[10px] text-muted-foreground">Poin</p>
              <p className="text-[10px] text-[#94a3b8]">{badges.length} lencana diraih</p>
            </GlassCard>
          </div>

          <div>
            <SectionTitle action={{ label: "Lihat Detail →", href: "/donor-history" }}>
              Perjalanan Pahlawan Anda
            </SectionTitle>
            <GlassCard className="mt-3">
              <Timeline
                items={[
                  {
                    id: "1",
                    title: `Donor Terakhir${user.city ? ` - ${user.city}` : ""}`,
                    description: "Berhasil mendonorkan darah",
                    date: formatDate(status?.last_donation_date) || "Belum ada data",
                    status: "completed",
                  },
                  {
                    id: "2",
                    title: `Pencapaian: ${topBadge} Lencana`,
                    description: `Telah mendonorkan ${totalDonations} kali`,
                    status: "completed",
                  },
                  {
                    id: "3",
                    title: "Jadwal Donor Selanjutnya",
                    description: status?.eligibility_status === "eligible"
                      ? "Siap donor kapan saja"
                      : status?.eligibility_status === "waiting_period"
                        ? `Siap donor setelah ${getRecoveryEndDate(status?.last_donation_date) || "masa tunggu"}`
                        : status?.eligibility_status === "not_eligible"
                          ? "Tidak memenuhi syarat donor"
                          : "Menunggu izin dokter",
                    status: status?.eligibility_status === "eligible" ? "current" : "upcoming",
                  },
                ]}
              />
            </GlassCard>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/donor-history" className="flex items-center gap-2 rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 flex-1 min-w-[100px]">
              <Plus className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-xs font-medium text-foreground">Riwayat</span>
              <ChevronRight className="h-3 w-3 text-[#94a3b8] ml-auto shrink-0" />
            </Link>
            <Link href="/search" className="flex items-center gap-2 rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 flex-1 min-w-[80px]">
              <Search className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-xs font-medium text-foreground">Cari</span>
              <ChevronRight className="h-3 w-3 text-[#94a3b8] ml-auto shrink-0" />
            </Link>
            <Link href="/events" className="flex items-center gap-2 rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 flex-1 min-w-[80px]">
              <CalendarDays className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-xs font-medium text-foreground">Event</span>
              <ChevronRight className="h-3 w-3 text-[#94a3b8] ml-auto shrink-0" />
            </Link>
            <Link href="/passport" className="flex items-center gap-2 rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 flex-1 min-w-[80px]">
              <Award className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-foreground">Paspor</span>
              <ChevronRight className="h-3 w-3 text-[#94a3b8] ml-auto shrink-0" />
            </Link>
            <Link href="/recognition" className="flex items-center gap-2 rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 flex-1 min-w-[90px]">
              <Medal className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-foreground">Rekognisi</span>
              <ChevronRight className="h-3 w-3 text-[#94a3b8] ml-auto shrink-0" />
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-4 md:mt-0">
          {urgentRequests.length > 0 && (
            <div>
              <SectionTitle action={{ label: "Lihat Semua", href: "/requests" }}>
                Permintaan Mendesak
              </SectionTitle>
              <div className="mt-3 space-y-3">
                {urgentRequests.slice(0, 1).map((req) => (
                  <GlassCard key={req.id} elevated>
                    <div className="mb-2 flex items-center justify-between">
                      <UrgencyBadge level={req.urgency} />
                      <span className="text-[10px] text-[#94a3b8]">jadwal</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <BloodTypeBadge type={req.blood_type} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{req.hospital}</p>
                        <p className="text-xs text-muted-foreground">{req.city}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#94a3b8]">
                          <span>3 Kantong Darah</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`https://wa.me/${req.contact_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Hubungi Koordinator
                      </a>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Aktivitas Terkini</SectionTitle>
            <GlassCard className="mt-3 space-y-3">
              {(status?.last_donation_date
                ? [{ text: `Donor terakhir: ${formatDate(status.last_donation_date)}`, time: "Terakhir donor" }]
                : []
              ).concat(
                topBadge !== "Pemula"
                  ? [{ text: `Mencapai lencana ${topBadge}`, time: `${totalDonations} donasi` }]
                  : [],
                status?.eligibility_status === "eligible"
                  ? [{ text: "Siap donor darah kapan saja", time: "Status" }]
                  : status?.eligibility_status === "waiting_period"
                    ? [{ text: `Masa tunggu selesai ${getRecoveryEndDate(status?.last_donation_date) || "—"}`, time: "Status" }]
                    : status?.eligibility_status === "not_eligible"
                      ? [{ text: "Tidak memenuhi syarat donor", time: "Status" }]
                      : [{ text: "Menunggu izin dokter", time: "Status" }],
              ).map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-[#94a3b8]">{a.time}</p>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground">Pengaturan</h3>
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? "Batal" : "Edit"}
              </Button>
            </div>
            {editing && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div className="space-y-1">
                  <Label>Foto Profil</Label>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="hidden" />
                  {avatarFile ? (
                    <p className="text-sm text-emerald-600">{avatarFile.name} siap</p>
                  ) : (
                    <button type="button" onClick={() => avatarRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-muted-foreground hover:border-red-300">
                      <Camera className="h-5 w-5" />
                      Pilih foto profil
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Nama</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>WhatsApp</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Username</Label><Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Provinsi</Label><Input value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Kota</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Kecamatan</Label><Input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Tanggal Lahir</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Golongan Darah</Label>
                    <Select value={form.blood_type} onValueChange={v => setForm(p => ({ ...p, blood_type: v ?? "" }))}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="AB">AB</SelectItem>
                        <SelectItem value="O">O</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Jenis Kelamin</Label>
                    <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v ?? "" }))}>
                      <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={updateProfile}>Simpan</Button>
              </div>
            )}
            {!editing && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={status?.eligibility_status || "eligible"} dot />
                    <span className="text-xs text-[#94a3b8]">Prioritas {status?.search_priority || 3}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mode</span>
                  <div className="flex gap-2">
                    <Select defaultValue={status?.availability_mode || "automatic"} onValueChange={v => updateStatus(v ?? "automatic", status?.availability_status || "available")}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Otomatis</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue={status?.availability_status || "available"} onValueChange={v => updateStatus(status?.availability_mode || "manual", v ?? "available")}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Siap Donor</SelectItem>
                        <SelectItem value="temporarily_unavailable">Tidak Tersedia</SelectItem>
                        <SelectItem value="permanently_unavailable">Berhenti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href="/donor-history"><Button variant="outline" size="sm">Riwayat</Button></Link>
                  {user.username && <Link href={`/u/${user.username}`}><Button variant="outline" size="sm">Profil Publik</Button></Link>}
                </div>
              </div>
            )}
            {!editing && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <Lock className="h-4 w-4" />
                  {showChangePassword ? "Batal" : "Ubah Kata Sandi"}
                </button>
                {showChangePassword && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Kata Sandi Saat Ini</Label>
                      <Input type="password" placeholder="••••••••" className="text-sm" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Kata Sandi Baru</Label>
                      <Input type="password" placeholder="Min. 6 karakter" className="text-sm" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Konfirmasi Baru</Label>
                      <Input type="password" placeholder="Min. 6 karakter" className="text-sm" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} />
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" onClick={changePassword} disabled={pwLoading} className="w-full">
                        {pwLoading ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
