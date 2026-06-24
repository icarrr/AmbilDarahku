"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { Mail, ArrowLeft, Droplets } from "lucide-react";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email }, false);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <GlassCard className="w-full py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Lupa Kata Sandi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan email Anda</p>
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-emerald-800">
                Kami akan mengirim email permintaan reset sandi jika email yang anda masukkan terdaftar di sistem kami.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Hubungi admin di{" "}
              <a href="https://www.instagram.com/ambildarahku/" target="_blank" rel="noopener noreferrer" className="font-medium text-red-600 hover:text-red-700">
                @ambildarahku
              </a>{" "}
              jika Anda merasa email terdaftar namun tidak menerima email.
            </p>
            <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
              <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Surel</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input id="email" className="pl-10" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Permintaan Reset"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="inline-flex items-center gap-1 font-medium text-red-600 hover:text-red-700">
                <ArrowLeft className="h-4 w-4" /> Kembali ke masuk
              </Link>
            </p>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
