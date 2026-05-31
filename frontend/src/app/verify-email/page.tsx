"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan");
      return;
    }
    api.post<{ message: string; access_token: string; refresh_token: string }>("/auth/verify-email", { token }, false)
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
        }
        setStatus("success");
        setMessage("Email berhasil diverifikasi!");
        setTimeout(() => router.push("/profile"), 1500);
      })
      .catch((err) => { setStatus("error"); setMessage(err instanceof Error ? err.message : "Gagal memverifikasi email"); });
  }, [token, router]);

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      setMessage("Email verifikasi telah dikirim ulang");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal mengirim ulang");
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
        <GlassCard className="w-full py-8 text-center">
          <Mail className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h1 className="font-heading text-xl font-bold text-foreground">Verifikasi Email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami telah mengirim email verifikasi ke alamat email Anda. Silakan periksa kotak masuk Anda.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tidak menerima email?{" "}
            <button onClick={resend} disabled={sending} className="font-medium text-red-600 hover:text-red-700">
              {sending ? "Mengirim..." : "Kirim ulang"}
            </button>
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/profile")}>Profil</Button>
            <Button onClick={() => router.push("/")}>Beranda</Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <GlassCard className="w-full py-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-red-600" />
            <h1 className="font-heading text-xl font-bold text-foreground">Memverifikasi...</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="font-heading text-xl font-bold text-foreground">Verifikasi Berhasil</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-4" onClick={() => router.push("/profile")}>Lanjut ke Profil</Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <h1 className="font-heading text-xl font-bold text-foreground">Verifikasi Gagal</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="outline" onClick={resend} disabled={sending}>
                {sending ? "Mengirim..." : "Kirim Ulang"}
              </Button>
              <Link href="/profile"><Button>Profil</Button></Link>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-6"><p className="text-muted-foreground">Memuat...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
