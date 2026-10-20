"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { verificationLevelDescription } from "@/lib/verification-level";
import Link from "next/link";
import { toast } from "sonner";
import {
  BadgeCheck, ShieldCheck, Award, Droplets, Heart, Calendar,
  RotateCcw, QrCode, Printer, MapPin, Medal, Star, LogIn, Loader2,
} from "lucide-react";
import { getAppUrl } from "@/lib/url";

type PassportData = {
  id: string;
  passport_number: string;
  qr_token: string;
  issued_at: string;
  last_renewed_at: string | null;
  is_active: boolean;
};

type BadgeData = {
  id: string;
  badge: { name: string; description: string; min_donations: number; icon_url?: string };
};

type TitleData = {
  id: string;
  title: string;
  awarded_at: string;
  description?: string;
};

type UserData = {
  full_name: string;
  blood_type: string;
  city: string;
  city_name?: string;
  province: string;
  province_name?: string;
  total_donations: number;
  verification_level: number;
  weight_kg: number;
  last_donation_date?: string;
};

export default function PassportPage() {
  const { user, loading: authLoading } = useAuth();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [titles, setTitles] = useState<TitleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPassport = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api.get<{ passport: PassportData; user: UserData; badges: BadgeData[]; titles: TitleData[] }>("/passport");
      setPassport(data.passport);
      setUserData(data.user);
      setBadges(data.badges || []);
      setTitles(data.titles || []);
    } catch (err: unknown) {
      setPassport(null);
      // A 404 means "no passport yet"; anything else is a real load failure.
      if (!(err instanceof Error && /404|not found/i.test(err.message))) setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPassport();
  }, [user]);

  const requestPassport = async () => {
    setRequesting(true);
    try {
      const data = await api.post<{ passport: PassportData }>("/passport/request");
      setPassport(data.passport);
      toast.success("Paspor berhasil dibuat!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat paspor");
    } finally {
      setRequesting(false);
    }
  };

  const renewPassport = async () => {
    setRenewing(true);
    try {
      const data = await api.post<{ passport: PassportData }>("/passport/renew");
      setPassport(data.passport);
      toast.success("Paspor berhasil diperbarui!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui paspor");
    } finally {
      setRenewing(false);
      setConfirmRenew(false);
    }
  };

  const printPassport = () => {
    window.print();
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-10 text-center">
          <LogIn className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="font-heading text-lg font-bold text-foreground">Masuk untuk Melihat Paspor</h2>
          <p className="mt-1 text-sm text-muted-foreground">Silakan masuk untuk melihat atau mengajukan paspor donor Anda.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>Masuk</Link>
            <Link href="/register" className={buttonVariants({ variant: "outline", className: "w-full" })}>Daftar Akun</Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <GlassCard className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">Paspor belum dapat dimuat.</p>
          <p className="mt-1 text-xs text-muted-foreground">Periksa koneksi Anda lalu coba lagi.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchPassport}>Coba Lagi</Button>
        </GlassCard>
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center">
          <BadgeCheck className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-xl font-bold text-foreground">
            Paspor Donor Darah
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda belum memiliki paspor donor. Ajukan sekarang untuk mendapatkan
            nomor identitas donor nasional dan QR code verifikasi.
          </p>
          <Button
            onClick={requestPassport}
            disabled={requesting}
            className="mt-6"
          >
            {requesting ? "Memproses..." : "Ajukan Paspor"}
          </Button>
        </div>
      </div>
    );
  }

  const display = userData || user;
  const liters = ((display?.total_donations || 0) * 0.45).toFixed(2);
  const livesSaved = (display?.total_donations || 0) * 3;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 print:px-0 print:py-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Paspor Donor Darah
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmRenew(true)} disabled={renewing}>
            {renewing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1 h-3.5 w-3.5" />}
            {renewing ? "Memperbarui..." : "Perbarui"}
          </Button>
          <Button variant="outline" size="sm" onClick={printPassport}>
            <Printer className="mr-1 h-3.5 w-3.5" />
            Cetak
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-6 text-white">
          <div className="absolute right-0 top-0 h-32 w-32 opacity-10">
            <Heart className="h-full w-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-widest text-red-200">
                Paspor Donor Darah Nasional
              </p>
              <h2 className="mt-1 break-words font-heading text-2xl font-bold">{display?.full_name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {display?.blood_type ? (
                  <BloodTypeBadge type={display.blood_type} size="sm" />
                ) : (
                  <span className="text-sm font-bold">—</span>
                )}
                <span className="text-xs text-red-200">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {display?.city_name || display?.city}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-red-200">ID Donor</p>
              <p className="font-mono text-sm font-bold">{passport.passport_number}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-b from-red-50 to-white p-3 text-center">
            <Droplets className="mx-auto h-5 w-5 text-red-600" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{display?.total_donations || 0}</p>
            <p className="text-[10px] text-muted-foreground">Donasi</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-emerald-50 to-white p-3 text-center">
            <Heart className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-1 font-heading text-xl font-bold text-emerald-600">{livesSaved}</p>
            <p className="text-[10px] text-muted-foreground">Nyawa</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-amber-50 to-white p-3 text-center">
            <Award className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{liters}L</p>
            <p className="text-[10px] text-muted-foreground">Volume</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white p-3 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{display?.verification_level ?? 0}/3</p>
            <p className="text-[10px] text-muted-foreground">Verif</p>
          </div>
        </div>

        {(display?.verification_level ?? 0) > 0 && (
          <GlassCard className="px-4 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-foreground">
                  Level {display?.verification_level}: {verificationLevelDescription(display?.verification_level)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Verifikasi yang lebih tinggi meningkatkan skor kepercayaan.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {titles.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border border-amber-100">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-amber-800">
              <Medal className="h-4 w-4" />
              Gelar Penghargaan
            </h3>
            <div className="mt-3 space-y-2">
              {titles.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/80 p-3">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <p className="text-[10px] text-muted-foreground">{formatDate(t.awarded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-heading text-sm font-bold text-foreground">Lencana yang Diraih</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {badges.slice(0, 8).map((b) => (
                <div key={b.id} className="rounded-xl bg-red-50 p-2 text-center">
                  <Award className="mx-auto h-5 w-5 text-red-600" />
                  <p className="mt-1 text-[10px] font-medium text-foreground">{b.badge.name}</p>
                  <p className="text-[9px] text-muted-foreground">{b.badge.min_donations} donor</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">QR Code Verifikasi</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${getAppUrl()}/passport/verify/${passport.qr_token}`)}`}
            alt="QR"
            className="mx-auto mt-2 h-28 w-28 rounded-lg border border-border bg-white"
          />
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">{passport.passport_number}</p>
          <p className="text-[10px] text-muted-foreground">
            Diterbitkan: {formatDate(passport.issued_at)}
          </p>
        </div>

        <GlassCard className="bg-gradient-to-br from-red-50 to-white">
          <p className="text-center text-[11px] text-muted-foreground">
            Paspor ini adalah bukti identitas donor darah nasional.
            Tunjukkan QR code kepada petugas PMI atau rumah sakit
            untuk verifikasi riwayat donor Anda.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <QrCode className="h-3 w-3" />
            <span>Data diperbarui secara otomatis. Hasil cetak: {new Date().toLocaleDateString("id-ID")}</span>
          </div>
        </GlassCard>
      </div>

      <ConfirmDialog
        open={confirmRenew}
        onCancel={() => { if (!renewing) setConfirmRenew(false); }}
        onConfirm={renewPassport}
        title="Perbarui paspor?"
        description="Tanggal pembaruan paspor akan dicatat ulang hari ini. Nomor paspor dan QR code verifikasi Anda tetap sama."
        confirmText="Perbarui"
        loading={renewing}
      />
    </div>
  );
}
