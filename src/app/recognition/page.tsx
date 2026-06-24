"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { Button } from "@/components/ui/button";
import {
  Printer, Award, Droplets, Heart, ShieldCheck, MapPin, Calendar,
  Medal, Star, CheckCircle, QrCode,
} from "lucide-react";
import { getAppUrl } from "@/lib/url";

type BadgeData = {
  id: string;
  badge: { name: string; description: string; min_donations: number };
};

type TitleData = {
  id: string;
  title: string;
  awarded_at: string;
  description?: string;
};

type PassportData = {
  passport_number: string;
  qr_token: string;
  issued_at: string;
};

type UserData = {
  full_name: string;
  blood_type: string;
  city: string;
  city_name?: string;
  province: string;
  province_name?: string;
  total_donations: number;
  total_points: number;
  donation_volume_total: number;
  verification_level: number;
  national_donor_id?: string;
  weight_kg: number;
  last_donation_date?: string;
};

export default function RecognitionPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [titles, setTitles] = useState<TitleData[]>([]);
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ user: UserData; badges: BadgeData[]; titles: TitleData[]; passport: PassportData | null }>("/recognition")
      .then(d => {
        setUserData(d.user);
        setBadges(d.badges || []);
        setTitles(d.titles || []);
        setPassport(d.passport || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const printPage = () => window.print();

  if (loading || !userData) {
    return <div className="mx-auto max-w-lg px-4 py-8 text-center text-muted-foreground">Memuat...</div>;
  }

  const liters = ((userData.total_donations || 0) * 0.45).toFixed(2);
  const livesSaved = (userData.total_donations || 0) * 3;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-xl font-bold text-foreground">Portofolio Pengakuan</h1>
        <Button variant="outline" size="sm" onClick={printPage}>
          <Printer className="mr-1 h-3.5 w-3.5" />
          Cetak
        </Button>
      </div>

      <div ref={printRef} className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-6 text-white">
          <div className="absolute right-0 top-0 h-32 w-32 opacity-10">
            <Heart className="h-full w-full" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-red-200">
                Portofolio Donor Darah
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold">{userData.full_name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <BloodTypeBadge type={userData.blood_type} size="sm" />
                <span className="text-xs text-red-200">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {userData.city_name || userData.city}
                </span>
              </div>
            </div>
            <div className="text-right">
              {passport && (
                <div>
                  <p className="text-[10px] text-red-200">ID Donor</p>
                  <p className="font-mono text-sm font-bold">{passport.passport_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-gradient-to-b from-red-50 to-white p-3 text-center">
            <Droplets className="mx-auto h-5 w-5 text-red-600" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{userData.total_donations}</p>
            <p className="text-[10px] text-[#94a3b8]">Donasi</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-emerald-50 to-white p-3 text-center">
            <Heart className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-1 font-heading text-xl font-bold text-emerald-600">{livesSaved}</p>
            <p className="text-[10px] text-[#94a3b8]">Nyawa</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-amber-50 to-white p-3 text-center">
            <Award className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{liters}L</p>
            <p className="text-[10px] text-[#94a3b8]">Volume</p>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white p-3 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">{userData.verification_level}/3</p>
            <p className="text-[10px] text-[#94a3b8]">Verif</p>
          </div>
        </div>

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
                    <p className="text-[10px] text-[#94a3b8]">{formatDate(t.awarded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <h3 className="font-heading text-sm font-bold text-foreground">Lencana yang Diraih</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {badges.filter(b => b.badge).slice(0, 8).map((b) => (
              <div key={b.id} className="rounded-xl bg-red-50 p-2 text-center">
                <Award className="mx-auto h-5 w-5 text-red-600" />
                <p className="mt-1 text-[10px] font-medium text-foreground">{b.badge.name}</p>
                <p className="text-[9px] text-[#94a3b8]">{b.badge.min_donations} donor</p>
              </div>
            ))}
          </div>
        </div>

        {passport && (
          <div className="rounded-2xl bg-white p-4 text-center border border-gray-100">
            <p className="text-xs font-medium text-[#94a3b8]">QR Code Verifikasi</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${getAppUrl()}/passport/verify/${passport.qr_token}`)}`}
              alt="QR"
              className="mx-auto mt-2 h-28 w-28 rounded-lg border border-gray-200"
            />
            <p className="mt-2 font-mono text-[10px] text-[#94a3b8]">{passport.passport_number}</p>
            <p className="text-[10px] text-[#94a3b8]">
              Diterbitkan: {formatDate(passport.issued_at)}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-r from-red-50 to-transparent p-3">
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#94a3b8]">
            <QrCode className="h-3 w-3" />
            <span>Portofolio ini diverifikasi melalui AmbilDarahku</span>
          </div>
          <p className="mt-1 text-center text-[9px] text-[#94a3b8]">
            Data diperbarui secara otomatis. Hasil cetak: {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  );
}
