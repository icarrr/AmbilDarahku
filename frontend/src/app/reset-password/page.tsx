"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { Lock, CheckCircle, XCircle, Droplets } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setStatus("error");
      setMessage("Kata sandi minimal 6 karakter");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Kata sandi tidak cocok");
      return;
    }
    if (!token) {
      setStatus("error");
      setMessage("Token reset tidak ditemukan");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password }, false);
      setStatus("success");
      setMessage("Kata sandi berhasil diubah!");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Gagal mereset kata sandi");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="font-heading text-xl font-bold text-foreground">Tautan Tidak Valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-red-600 hover:text-red-700">
            Minta tautan baru
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="font-heading text-xl font-bold text-foreground">Berhasil!</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Button className="mt-4" onClick={() => router.push("/login")}>Masuk Sekarang</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <GlassCard className="w-full py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Atur Ulang Kata Sandi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan kata sandi baru Anda</p>
        </div>

        {status === "error" && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Kata Sandi Baru</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input id="password" className="pl-10" type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input id="confirm" className="pl-10" type="password" placeholder="Min. 6 karakter" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Atur Ulang Kata Sandi"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
