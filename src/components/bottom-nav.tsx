"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { House, Search, TriangleAlert, User, History, CalendarDays, Trophy, Plus, BadgeCheck, FileText, Shield, Timeline, Medal } from "lucide-react";

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

  const NavLink = ({ href, icon: Icon, label, isCompact = false }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; isCompact?: boolean }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "relative flex flex-col items-center gap-0.5 rounded-lg transition-colors active:scale-95",
          isCompact
            ? "px-1.5 py-1 text-[10px] min-w-[48px]"
            : "px-3 py-1.5 text-xs min-w-[56px]",
          isActive
            ? "text-red-600" + (isCompact ? "" : " after:absolute after:-top-1 after:left-1/2 after:h-[4px] after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red-600 after:shadow-[0_0_6px_1px_rgba(220,38,38,0.5)]")
            : "text-gray-400 hover:text-gray-600",
        )}
      >
        <Icon className={isCompact ? "h-4 w-4" : "h-5 w-5"} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="glass-strong rounded-t-2xl px-1 pb-1 pt-2">
        <div className="flex items-center justify-around">
          {primaryItems.map(item => <NavLink key={item.href} {...item} />)}
          {user && (
            <Link
              href="/requests/new"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-90"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>
        {showSecondary && (
          <div className="mt-1 flex items-center justify-around border-t border-gray-100 pt-1 overflow-x-auto">
            {secondaryItems.map(item => <NavLink key={item.href} {...item} isCompact />)}
            <NavLink href="/passport" icon={BadgeCheck} label="Paspor" isCompact />
            <NavLink href="/claims" icon={FileText} label="Klaim" isCompact />
            <NavLink href="/verification" icon={Shield} label="Verif" isCompact />
            <NavLink href="/timeline" icon={Timeline} label="Linimasa" isCompact />
            {isAdmin && <NavLink href="/admin" icon={Trophy} label="Admin" isCompact />}
          </div>
        )}
      </div>
    </nav>
  );
}
