import type { Metadata } from "next";
import { cache } from "react";
import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { GlassCard } from "@/components/glass-card";
import { ShieldCheck, Award, Droplets, Heart, MapPin, Calendar } from "lucide-react";
import { lookupName } from "@/lib/data/wilayah";

type Props = { params: Promise<{ token: string }> };

type VerifyResult = {
  valid: boolean;
  passport_number?: string;
  issued_at?: string;
  donor?: {
    full_name: string;
    blood_type: string;
    city: string;
    city_name?: string;
    total_donations: number;
    total_points: number;
  };
  donorCityName?: string;
  error?: string;
};

// Shared with generateMetadata — React cache() dedupes page + metadata queries
const verifyPassport = cache(async function (token: string): Promise<VerifyResult | null> {
  try {
    const { data: passport } = await supabase
      .from("donor_passports")
      .select("passport_number, issued_at, user_id")
      .eq("qr_token", token)
      .eq("is_active", true)
      .maybeSingle();
    if (!passport) return null;

    const { data: donor } = await supabase
      .from("users")
      .select("full_name, blood_type, city, total_donations, total_points")
      .eq("id", passport.user_id)
      .maybeSingle();
    if (!donor) return null;

    return {
      valid: true,
      passport_number: passport.passport_number,
      issued_at: passport.issued_at,
      donor,
      donorCityName: lookupName(donor.city || ""),
    };
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await verifyPassport(token);
  if (!result?.valid) return { title: "Verifikasi Paspor" };
  return {
    title: `Paspor ${result.donor?.full_name}`,
    description: `Paspor donor darah ${result.donor?.blood_type} — ${result.donor?.full_name}`,
  };
}

export default async function VerifyPassportPage({ params }: Props) {
  const { token } = await params;
  const result = await verifyPassport(token);

  if (!result || !result.valid) {
    notFound();
  }

  const { donor, passport_number, issued_at, donorCityName } = result;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="font-heading text-lg font-bold text-emerald-700">
          Paspor Terverifikasi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paspor donor darah ini valid dan terdaftar di sistem AmbilDarahku.
        </p>
      </div>

      <GlassCard className="mt-6 border-2 border-emerald-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">
              Nomor Identitas Donor
            </p>
            <p className="font-mono text-sm font-bold text-foreground">
              {passport_number}
            </p>
          </div>
          <BloodTypeBadge type={donor?.blood_type || "O"} size="lg" />
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-lg font-bold text-foreground">{donor?.full_name}</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {donorCityName || donor?.city}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Diterbitkan: {issued_at ? new Date(issued_at).toLocaleDateString("id-ID") : "—"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <Droplets className="mx-auto h-5 w-5 text-red-600" />
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {donor?.total_donations || 0}
            </p>
            <p className="text-xs text-muted-foreground">Donasi</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <Heart className="mx-auto h-5 w-5 text-emerald-500" />
            <p className="mt-1 font-heading text-xl font-bold text-emerald-600">
              {(donor?.total_donations || 0) * 3}
            </p>
            <p className="text-xs text-muted-foreground">Nyawa Terselamatkan</p>
          </div>
        </div>
      </GlassCard>

      <p className="mt-4 text-center text-xs text-[#94a3b8]">
        Verifikasi ini dilakukan melalui sistem AmbilDarahku.
        Hasil verifikasi dapat berubah jika data donor diperbarui.
      </p>
    </div>
  );
}
