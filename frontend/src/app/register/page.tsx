"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const RHESUS = ["+", "-"];
const GENDERS = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    rhesus: "",
    weight_kg: "",
    height_cm: "",
    province: "",
    city: "",
    district: "",
    latitude: "",
    longitude: "",
  });

  const update = (field: string, value: string | null) => setForm(prev => ({ ...prev, [field]: value ?? "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      toast.success("Pendaftaran berhasil!");
      router.push("/profile");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Pendaftaran gagal";
        toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Daftar Jadi Donor</CardTitle>
          <CardDescription>
            Langkah {step} dari 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input id="full_name" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor WhatsApp</Label>
                  <Input id="phone" type="tel" placeholder="628123456789" value={form.phone} onChange={e => update("phone", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={e => update("password", e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                    <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select value={form.gender || ""} onValueChange={v => update("gender", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" className="w-full" onClick={() => setStep(2)}>Selanjutnya</Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Golongan Darah</Label>
                    <Select value={form.blood_type || ""} onValueChange={v => update("blood_type", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPES.map(bt => (
                          <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rhesus</Label>
                    <Select value={form.rhesus || ""} onValueChange={v => update("rhesus", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent>
                        {RHESUS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Berat Badan (kg)</Label>
                    <Input id="weight" type="number" step="0.1" value={form.weight_kg} onChange={e => update("weight_kg", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Tinggi Badan (cm)</Label>
                    <Input id="height" type="number" step="0.1" value={form.height_cm} onChange={e => update("height_cm", e.target.value)} required />
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
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input id="province" value={form.province} onChange={e => update("province", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Kabupaten/Kota</Label>
                  <Input id="city" value={form.city} onChange={e => update("city", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan</Label>
                  <Input id="district" value={form.district} onChange={e => update("district", e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" type="number" step="0.0000001" value={form.latitude} onChange={e => update("latitude", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" type="number" step="0.0000001" value={form.longitude} onChange={e => update("longitude", e.target.value)} required />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
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

          {step === 1 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-red-600 hover:underline">Masuk</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
