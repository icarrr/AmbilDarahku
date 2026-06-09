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

type FormErrors = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", date_of_birth: "", gender: "",
    blood_type: "", weight_kg: "", height_cm: "",
    province: "", city: "", district: "",
  });

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const fieldError = (key: string) => {
    if (!errors[key]) return null;
    return <p className="mt-0.5 text-xs text-red-500">{errors[key]}</p>;
  };

  const validateStep1 = () => {
    const e: FormErrors = {};
    if (!form.full_name.trim()) e.full_name = "Nama lengkap wajib diisi";
    if (!form.email.trim()) e.email = "Surel wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format surel tidak valid";
    if (!form.phone.trim()) e.phone = "Nomor WA wajib diisi";
    else if (!/^08\d{8,12}$/.test(form.phone)) e.phone = "Format nomor tidak valid (mulai 08)";
    if (!form.password) e.password = "Kata sandi wajib diisi";
    else if (form.password.length < 6) e.password = "Minimal 6 karakter";
    if (!form.date_of_birth) e.date_of_birth = "Tanggal lahir wajib diisi";
    if (!form.gender) e.gender = "Pilih jenis kelamin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: FormErrors = {};
    if (!form.blood_type) e.blood_type = "Pilih golongan darah";
    if (!form.weight_kg || parseFloat(form.weight_kg) <= 0) e.weight_kg = "Berat badan tidak valid";
    if (!form.height_cm || parseFloat(form.height_cm) <= 0) e.height_cm = "Tinggi badan tidak valid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: FormErrors = {};
    if (!form.province.trim()) e.province = "Provinsi wajib diisi";
    if (!form.city.trim()) e.city = "Kota wajib diisi";
    if (!form.district.trim()) e.district = "Kecamatan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await register({
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
      });
      toast.success("Pendaftaran berhasil!");
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (n: number) => {
    if (n === 2 && !validateStep1()) return;
    if (n === 3 && !validateStep2()) return;
    setStep(n);
    setErrors({});
  };

  const stepIndicator = (n: number, label: string) => (
    <button
      type="button"
      onClick={() => n < step && setStep(n)}
      className={cn(
        "flex items-center gap-1 text-xs",
        step >= n ? "text-red-600" : "text-[#94a3b8]",
      )}
    >
      <span className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
        step > n ? "bg-red-600 text-white" : step === n ? "border-2 border-red-600 text-red-600" : "border-2 border-gray-200",
      )}>
        {step > n ? "✓" : n}
      </span>
      <span className="hidden sm:inline text-xs">{label}</span>
    </button>
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg items-center px-4 py-4">
      <GlassCard className="w-full py-6 px-5 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">Daftar Jadi Donor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bergabung dan selamatkan nyawa</p>
        </div>

        <div className="mb-3 flex items-center justify-center gap-2">
          {stepIndicator(1, "Data Diri")}
          <div className="h-px w-6 bg-gray-200" />
          {stepIndicator(2, "Medis")}
          <div className="h-px w-6 bg-gray-200" />
          {stepIndicator(3, "Lokasi")}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.full_name && "border-red-400")} placeholder="Nama lengkap" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
                </div>
                {fieldError("full_name")}
              </div>
              <div className="space-y-1.5">
                <Label>Surel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.email && "border-red-400")} type="email" placeholder="email@example.com" value={form.email} onChange={e => update("email", e.target.value)} required />
                </div>
                {fieldError("email")}
              </div>
              <div className="space-y-1.5">
                <Label>Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.phone && "border-red-400")} placeholder="08xxxx" value={form.phone} onChange={e => update("phone", e.target.value)} required />
                </div>
                {fieldError("phone")}
              </div>
              <div className="space-y-1.5">
                <Label>Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.password && "border-red-400")} type="password" placeholder="Min. 6 karakter" value={form.password} onChange={e => update("password", e.target.value)} required />
                </div>
                {fieldError("password")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Tanggal Lahir</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className={cn("pl-10", errors.date_of_birth && "border-red-400")} type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} required />
                  </div>
                  {fieldError("date_of_birth")}
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis Kelamin</Label>
                  <Select value={form.gender} onValueChange={v => update("gender", v ?? "")}>
                    <SelectTrigger className={errors.gender ? "border-red-400" : ""}><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fieldError("gender")}
                </div>
              </div>
              <Button type="button" className="w-full mt-3" onClick={() => nextStep(2)}>Selanjutnya</Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Golongan Darah</Label>
                <Select value={form.blood_type} onValueChange={v => update("blood_type", v ?? "")}>
                  <SelectTrigger className={errors.blood_type ? "border-red-400" : ""}><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError("blood_type")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Berat Badan (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className={cn("pl-10", errors.weight_kg && "border-red-400")} type="number" step="0.1" placeholder="55" value={form.weight_kg} onChange={e => update("weight_kg", e.target.value)} required />
                  </div>
                  {fieldError("weight_kg")}
                </div>
                <div className="space-y-1.5">
                  <Label>Tinggi Badan (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className={cn("pl-10", errors.height_cm && "border-red-400")} type="number" step="0.1" placeholder="165" value={form.height_cm} onChange={e => update("height_cm", e.target.value)} required />
                  </div>
                  {fieldError("height_cm")}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Kembali</Button>
                <Button type="button" className="flex-1" onClick={() => nextStep(3)}>Selanjutnya</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label>Provinsi</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.province && "border-red-400")} value={form.province} onChange={e => update("province", e.target.value)} required placeholder="Jawa Timur" />
                </div>
                {fieldError("province")}
              </div>
              <div className="space-y-1.5">
                <Label>Kabupaten/Kota</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.city && "border-red-400")} value={form.city} onChange={e => update("city", e.target.value)} required placeholder="Malang" />
                </div>
                {fieldError("city")}
              </div>
              <div className="space-y-1.5">
                <Label>Kecamatan</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input className={cn("pl-10", errors.district && "border-red-400")} value={form.district} onChange={e => update("district", e.target.value)} required placeholder="Lowokwaru" />
                </div>
                {fieldError("district")}
              </div>
              <p className="text-xs text-[#94a3b8]">
                Lokasi digunakan untuk mencari donor terdekat. Kami tidak menampilkan alamat detail Anda.
              </p>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Kembali</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <span className="flex items-center justify-center gap-1.5"><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Memproses...</span> : "Daftar"}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-red-600 hover:text-red-700">Masuk</Link>
        </p>
      </GlassCard>
    </div>
  );
}
