"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BadgeCheck, ShieldCheck, Award, Droplets, Heart, Calendar,
  Download, RotateCcw, QrCode, Printer, MapPin,
} from "lucide-react";

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
  badge: { name: string; description: string; min_donations: number };
};

export default function PassportPage() {
  const { user } = useAuth();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPassport = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ passport: PassportData; user: unknown; badges: BadgeData[] }>("/passport");
      setPassport(data.passport);
      setBadges(data.badges || []);
    } catch {
      setPassport(null);
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
    try {
      const data = await api.post<{ passport: PassportData }>("/passport/renew");
      setPassport(data.passport);
      toast.success("Paspor berhasil diperbarui!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui paspor");
    }
  };

  const printPassport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center">
          <BadgeCheck className="mx-auto h-16 w-16 text-[#94a3b8]" />
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

  const volumePerBag = user?.weight_kg && user.weight_kg <= 55 ? 0.35 : 0.45;
  const liters = ((user?.total_donations || 0) * volumePerBag).toFixed(2);
  const livesSaved = (user?.total_donations || 0) * 3;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Paspor Donor
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={renewPassport}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Perbarui
          </Button>
          <Button variant="outline" size="sm" onClick={printPassport}>
            <Printer className="mr-1 h-3.5 w-3.5" />
            Cetak
          </Button>
        </div>
      </div>

      <div ref={printRef} className="space-y-4">
        <GlassCard className="relative overflow-hidden border-2 border-red-100 p-6">
          <div className="absolute right-0 top-0 h-24 w-24 opacity-5">
            <Heart className="h-full w-full text-red-600" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-red-600">
                Paspor Donor Darah Nasional
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {user?.full_name}
              </p>
            </div>
            <BloodTypeBadge type={user?.blood_type || "O"} size="lg" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                Nomor Identitas Donor
              </p>
              <p className="font-mono text-sm font-bold text-foreground">
                {passport.passport_number}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                Status
              </p>
              <p className={`text-sm font-bold ${passport.is_active ? "text-emerald-600" : "text-red-600"}`}>
                {passport.is_active ? "Aktif" : "Tidak Aktif"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                Diterbitkan
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(passport.issued_at)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
                Terakhir Diperbarui
              </p>
              <p className="text-sm font-medium text-foreground">
                {passport.last_renewed_at ? formatDate(passport.last_renewed_at) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/passport/verify/${passport.qr_token}`)}`}
                  alt="QR Code Paspor"
                  className="mx-auto h-24 w-24 rounded-lg border border-gray-200"
                />
                <p className="mt-1 text-[9px] text-[#94a3b8]">Scan untuk verifikasi</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#94a3b8]" />
                  <span className="text-xs text-muted-foreground">
                    {user?.city}, {user?.province}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#94a3b8]" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(user?.last_donation_date || "") || "Belum donor"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600">
                    Terverifikasi via AmbilDarahku
                  </span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="py-3 text-center">
            <Droplets className="mx-auto h-5 w-5 text-red-600" />
            <p className="mt-1 font-heading text-lg font-bold text-foreground">
              {user?.total_donations || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Donasi</p>
            <p className="text-[10px] text-[#94a3b8]">{liters} L</p>
          </GlassCard>
          <GlassCard className="py-3 text-center">
            <Heart className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-1 font-heading text-lg font-bold text-emerald-600">
              {livesSaved}
            </p>
            <p className="text-[10px] text-muted-foreground">Nyawa</p>
            <p className="text-[10px] text-[#94a3b8]">Terselamatkan</p>
          </GlassCard>
          <GlassCard className="py-3 text-center">
            <Award className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 font-heading text-lg font-bold text-foreground">
              {badges.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Lencana</p>
            <p className="text-[10px] text-[#94a3b8]">Diraih</p>
          </GlassCard>
        </div>

        {badges.length > 0 && (
          <GlassCard>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Lencana yang Diraih
            </h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {badges.slice(0, 8).map((b) => (
                <div key={b.id} className="rounded-lg bg-red-50 p-2 text-center">
                  <Award className="mx-auto h-5 w-5 text-red-600" />
                  <p className="mt-1 text-[10px] font-medium text-foreground leading-tight">
                    {b.badge.name}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard className="bg-gradient-to-br from-red-50 to-white">
          <p className="text-center text-[11px] text-muted-foreground">
            Paspor ini adalah bukti identitas donor darah nasional.
            Tunjukkan QR code kepada petugas PMI atau rumah sakit
            untuk verifikasi riwayat donor Anda.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#94a3b8]">
            <QrCode className="h-3 w-3" />
            <span>Verifikasi: {window.location.origin}/verify/{passport.qr_token.slice(0, 8)}...</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
