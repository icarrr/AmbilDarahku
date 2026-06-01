"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass-card";
import { toast } from "sonner";
import { Droplets } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Berhasil masuk");
      router.push("/profile");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal masuk";
      toast.error(message);
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masuk ke akun AmbilDarahku Anda</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Surel</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-red-600 hover:text-red-700">Lupa password?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-red-600 hover:text-red-700">Daftar</Link>
        </p>
      </GlassCard>
    </div>
  );
}
