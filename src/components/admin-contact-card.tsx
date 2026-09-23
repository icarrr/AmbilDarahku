"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/glass-card";
import { Phone, Mail, MapPin, Copy, Check, ShieldCheck } from "lucide-react";

type AdminUserDetail = {
  id: string;
  full_name: string;
  username?: string;
  phone?: string;
  email?: string;
  role?: string;
  gender?: string;
  date_of_birth?: string;
  weight_kg?: number;
  height_cm?: number;
  address?: string;
  city?: string;
  province?: string;
  district?: string;
};

// Admin-only widget for the public /u/[username] page.
// Renders null unless the viewer is an admin; contact fields are fetched
// client-side from the admin-gated endpoint — never part of SSR HTML.
export function AdminContactCard({ userId }: { userId: string }) {
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ user: AdminUserDetail }>(`/admin/users/${userId}`)
      .then(d => setUser(d.user))
      .catch(() => setUser(null));
  }, [isAdmin, userId]);

  if (!isAdmin || !user) return null;

  const cityName = user.city || "";
  const phone = user.phone || "";
  const email = user.email || "";

  const copyContact = async () => {
    try {
      await navigator.clipboard.writeText(`Nama: ${user.full_name}\nWA: ${phone}\nEmail: ${email}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  return (
    <GlassCard className="mt-4 border-amber-200 bg-amber-50/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-semibold text-foreground">Kontak Donor (Admin)</p>
        </div>
        <button
          onClick={copyContact}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Tersalin" : "Salin Kontak"}
        </button>
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2 text-foreground">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{phone || "—"}</span>
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="break-all">{email || "—"}</span>
        </p>
        <p className="flex items-center gap-2 text-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="break-words">{user.address || cityName || "—"}</span>
        </p>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-amber-100 pt-1.5 text-xs text-muted-foreground">
          <span>Role: <span className="font-medium text-foreground">{user.role || "—"}</span></span>
          <span>Jenis Kelamin: <span className="font-medium text-foreground">{user.gender === "male" ? "Laki-laki" : user.gender === "female" ? "Perempuan" : "—"}</span></span>
          <span>Lahir: <span className="font-medium text-foreground">{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString("id-ID") : "—"}</span></span>
          <span>Bentuk: <span className="font-medium text-foreground">{user.weight_kg ? `${user.weight_kg}kg` : "—"}{user.height_cm ? ` / ${user.height_cm}cm` : ""}</span></span>
        </div>
      </div>
    </GlassCard>
  );
}