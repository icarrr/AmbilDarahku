"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Droplets, LayoutDashboard, History, CalendarDays, Trophy, Search,
  TriangleAlert, Heart, LogOut, User,
} from "lucide-react";

const mainLinks = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/search", label: "Cari Donor", icon: Search },
  { href: "/requests", label: "Permintaan Darah", icon: TriangleAlert },
];

const menuLinks = [
  { href: "/profile", label: "Profil", icon: User },
  { href: "/donor-history", label: "Riwayat Donor", icon: History },
  { href: "/events", label: "Event Donor", icon: CalendarDays },
  { href: "/leaderboard", label: "Peringkat", icon: Trophy },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:z-40">
      <div className="glass-strong flex flex-1 flex-col border-r border-gray-100">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
            <Droplets className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-base font-bold text-foreground">AmbilDarahku</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
            Utama
          </p>
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-600 border-l-[4px] border-red-600 rounded-r-lg shadow-[inset_0_0_8px_-2px_rgba(220,38,38,0.15)]"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {user && (
            <>
              <div className="pt-4">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  Menu
                </p>
              </div>
              {menuLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-50 text-red-600 border-l-[4px] border-red-600 rounded-r-lg shadow-[inset_0_0_8px_-2px_rgba(220,38,38,0.15)]"
                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/admin"
                      ? "bg-red-50 text-red-600"
                      : "text-muted-foreground hover:bg-gray-50 hover:text-foreground",
                  )}
                >
                  <Trophy className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-gray-100 px-3 py-4">
          {user ? (
            <>
              <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-4 text-white">
                <Heart className="mb-2 h-6 w-6" />
                <p className="text-sm font-semibold">Jadilah Pahlawan</p>
                <p className="mt-0.5 text-xs text-red-100">Setetes darah Anda sangat berarti.</p>
                <Link
                  href="/donor-history"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm hover:bg-white/30"
                >
                  Donor Sekarang
                </Link>
              </div>
              <button
                onClick={logout}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="w-full">
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
