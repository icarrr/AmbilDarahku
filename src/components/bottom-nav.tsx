"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import {
  House, Search, TriangleAlert, Menu, X, Plus,
  User, History, CalendarDays, Trophy, BadgeCheck,
  FileText, Shield, Timeline,
} from "lucide-react";

const primaryItems = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/requests", label: "Darah", icon: TriangleAlert },
];

const drawerItems = [
  { href: "/requests/new", label: "Buat Permintaan Darah", icon: Plus, prominent: true },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/donor-history", label: "Riwayat", icon: History },
  { href: "/events", label: "Event", icon: CalendarDays },
  { href: "/leaderboard", label: "Peringkat", icon: Trophy },
  { href: "/passport", label: "Paspor", icon: BadgeCheck },
  { href: "/claims", label: "Klaim", icon: FileText },
  { href: "/verification", label: "Verif", icon: Shield },
  { href: "/timeline", label: "Linimasa", icon: Timeline },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs min-w-[56px] transition-colors active:scale-95",
          isActive
            ? "text-red-600 after:absolute after:-top-1 after:left-1/2 after:h-[4px] after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red-600 after:shadow-[0_0_6px_1px_rgba(220,38,38,0.5)]"
            : "text-gray-400 hover:text-gray-600",
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
        <div className="glass-strong rounded-t-2xl px-1 pb-1 pt-2">
          <div className="flex items-center justify-around">
            {primaryItems.map((item) => <NavLink key={item.href} {...item} />)}
            {user && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs min-w-[56px] text-gray-400 transition-colors hover:text-gray-600 active:scale-95"
              >
                <Menu className="h-5 w-5" />
                <span>Menu</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Drawer ── */}
      {drawerOpen && user && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-[61] max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-10 pt-4 shadow-xl md:hidden animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-foreground">Menu</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {drawerItems.map(({ href, label, icon: Icon, prominent }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      prominent
                        ? "mb-2 bg-red-600 text-white hover:bg-red-700"
                        : isActive
                          ? "bg-red-50 text-red-600"
                          : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", prominent && "text-white")} />
                    <span>{label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    pathname === "/admin"
                      ? "bg-red-50 text-red-600"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Trophy className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
