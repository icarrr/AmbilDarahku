"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { buttonVariants } from "@/components/ui/button";
import { Droplets, Heart, LogOut, Plus } from "lucide-react";
import { mainNav, memberNav, adminNavItem, isNavActive, type NavItem } from "@/components/nav-config";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-0">
      {children}
    </p>
  );
}

function SideLink({ href, label, icon: Icon, pathname }: NavItem & { pathname: string }) {
  const isActive = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        isActive
          ? "bg-primary/10 text-primary border-l-[4px] border-primary rounded-r-lg shadow-[inset_0_0_8px_-2px_rgba(220,38,38,0.15)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:z-40">
      <div className="glass-strong flex min-h-0 flex-1 flex-col border-r border-border">
        <Link href="/" className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Droplets className="h-4 w-4 text-white" />
          </div>
          <span className="font-heading text-base font-bold text-foreground">AmbilDarahku</span>
        </Link>

        <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <SectionLabel>Utama</SectionLabel>
          {mainNav.map((item) => <SideLink key={item.href} {...item} pathname={pathname} />)}

          {user && (
            <>
              {memberNav.map((group) => (
                <div key={group.title} className="space-y-1">
                  <SectionLabel>{group.title}</SectionLabel>
                  {group.items.map((item) => <SideLink key={item.href} {...item} pathname={pathname} />)}
                </div>
              ))}
              {isAdmin && (
                <div className="space-y-1">
                  <SectionLabel>Admin</SectionLabel>
                  <SideLink {...adminNavItem} label="Panel Admin" pathname={pathname} />
                </div>
              )}
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-border px-3 py-4">
          {user ? (
            <>
              <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-4 text-white">
                <Heart className="mb-2 h-6 w-6" />
                <p className="text-sm font-semibold">Jadilah Pahlawan</p>
                <p className="mt-0.5 text-xs text-red-100">Setetes darah Anda sangat berarti.</p>
                <Link
                  href="/requests/new"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur-sm hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Buat Permintaan Darah
                </Link>
              </div>
              <button
                onClick={logout}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                Masuk
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm", className: "w-full" })}>
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
