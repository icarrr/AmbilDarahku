"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/claims", label: "Klaim" },
  { href: "/admin/verifications", label: "Verifikasi" },
  { href: "/admin/blood-requests", label: "Permintaan" },
  { href: "/admin/reports", label: "Laporan" },
  { href: "/admin/awards", label: "Penghargaan" },
  { href: "/admin/analytics", label: "Analitik" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-9 w-full max-w-xl rounded-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="py-10 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">Akses ditolak</p>
            <p className="mt-1 text-sm text-muted-foreground">Halaman ini hanya untuk admin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Navigasi admin" className="mx-auto max-w-6xl px-4 pt-6">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {ADMIN_NAV.map(item => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </>
  );
}
