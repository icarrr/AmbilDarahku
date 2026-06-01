"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Droplets, User, Mail, Phone, Lock, Calendar, Weight, Ruler, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const GENDERS = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", date_of_birth: "", gender: "",
    blood_type: "", weight_kg: "", height_cm: "",
    province: "", city: "", district: "", latitude: "", longitude: "",
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
      });
      toast.success("Pendaftaran berhasil!");
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (n: number, label: string) => (
    <button
      type="button"
      onClick={() => n < step && setStep(n)}
      className={cn(
        "flex items-center gap-2 text-sm",
        step >= n ? "text-red-600" : "text-[#94a3b8]",
      )}
    >
      <span className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        step > n ? "bg-red-600 text-white" : step === n ? "border-2 border-red-600 text-red-600" : "border-2 border-gray-200",
      )}>
        {step > n ? "✓" : n}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <GlassCard className="w-full py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Daftar Jadi Donor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bergabung dan selamatkan nyawa</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-4">
          {stepIndicator(1, "Data Diri")}
          <div className="h-px w-8 bg-gray-200" />
          {stepIndicator(2, "Medis")}
          <div className="h-px w-8 bg-gray-200" />
          {stepIndicator(3, "Lokasi")}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" placeholder="Nama lengkap" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Surel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" type="email" placeholder="email@example.com" value={form.email} onChange={e => update("email", e.target.value)} required />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Nomor WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" placeholder="08xxxx" value={form.phone} onChange={e => update("phone", e.target.value)} required />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Kata Sandi</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" type="password" placeholder="Min. 6 karakter" value={form.password} onChange={e => update("password", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tanggal Lahir</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis Kelamin</Label>
                  <Select value={form.gender} onValueChange={v => update("gender", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="button" className="w-full" onClick={() => setStep(2)}>Selanjutnya</Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Golongan Darah</Label>
                  <Select value={form.blood_type} onValueChange={v => update("blood_type", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Berat Badan (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" type="number" step="0.1" placeholder="55" value={form.weight_kg} onChange={e => update("weight_kg", e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tinggi Badan (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" type="number" step="0.1" placeholder="165" value={form.height_cm} onChange={e => update("height_cm", e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>Kembali</Button>
                <Button type="button" className="w-full" onClick={() => setStep(3)}>Selanjutnya</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Provinsi</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" value={form.province} onChange={e => update("province", e.target.value)} required placeholder="Jawa Timur" />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Kabupaten/Kota</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" value={form.city} onChange={e => update("city", e.target.value)} required placeholder="Malang" />
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Kecamatan</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10" value={form.district} onChange={e => update("district", e.target.value)} required placeholder="Lowokwaru" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input type="number" step="0.0000001" value={form.latitude} onChange={e => update("latitude", e.target.value)} placeholder="-7.98" />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input type="number" step="0.0000001" value={form.longitude} onChange={e => update("longitude", e.target.value)} placeholder="112.63" />
                </div>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Lokasi digunakan untuk mencari donor terdekat. Kami tidak menampilkan alamat detail Anda.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep(2)}>Kembali</Button>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Daftar"}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-red-600 hover:text-red-700">Masuk</Link>
        </p>
      </GlassCard>
    </div>
  );
}
