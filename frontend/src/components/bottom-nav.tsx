"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { House, Search, TriangleAlert, User, History, CalendarDays, Trophy, Plus } from "lucide-react";

const primaryItems = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/requests", label: "Darah", icon: TriangleAlert },
];

const secondaryItems = [
  { href: "/profile", label: "Profil", icon: User },
  { href: "/donor-history", label: "Riwayat", icon: History },
  { href: "/events", label: "Event", icon: CalendarDays },
  { href: "/leaderboard", label: "Peringkat", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const showSecondary = !!user;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-strong rounded-t-2xl px-2 pb-safe-or-2 pt-2">
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-red-600 after:absolute after:-top-1 after:left-1/2 after:h-[4px] after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red-600 after:shadow-[0_0_6px_1px_rgba(220,38,38,0.5)]"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {user && (
            <Link
              href="/requests/new"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>
        {showSecondary && (
          <div className="mt-1 flex items-center justify-around border-t border-gray-100 pt-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                    isActive
                      ? "text-red-600"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                  pathname === "/admin"
                    ? "text-red-600"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                <Trophy className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
