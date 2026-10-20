import {
  House, Search, Droplet, CalendarDays, Trophy, BadgeCheck,
  FileText, Shield, Timeline, History, User, ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
};

export type NavGroup = { title: string; items: NavItem[] };

// Single source for both the mobile drawer and the desktop sidebar.
export const mainNav: NavItem[] = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/search", label: "Cari Donor", shortLabel: "Cari", icon: Search },
  { href: "/requests", label: "Permintaan Darah", shortLabel: "Permintaan", icon: Droplet },
  { href: "/events", label: "Event Donor", shortLabel: "Event", icon: CalendarDays },
];

export const memberNav: NavGroup[] = [
  {
    title: "Donasi Saya",
    items: [
      { href: "/donor-history", label: "Riwayat Donor", icon: History },
      { href: "/claims", label: "Klaim Donor", icon: FileText },
      { href: "/timeline", label: "Linimasa", icon: Timeline },
    ],
  },
  {
    title: "Identitas",
    items: [
      { href: "/profile", label: "Profil", icon: User },
      { href: "/passport", label: "Paspor Donor", icon: BadgeCheck },
      { href: "/verification", label: "Verifikasi", icon: Shield },
    ],
  },
  {
    title: "Komunitas",
    items: [{ href: "/leaderboard", label: "Peringkat", icon: Trophy }],
  },
];

export const adminNavItem: NavItem = { href: "/admin", label: "Admin", icon: ShieldCheck };

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
