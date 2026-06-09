"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Droplets, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-foreground">
              AmbilDarahku
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/search">Cari Donor</NavLink>
            <NavLink href="/requests">Permintaan Darah</NavLink>
            <NavLink href="/leaderboard">Peringkat</NavLink>
            {user && <NavLink href="/profile">Profil</NavLink>}
            {isAdmin && (
              <NavLink href="/admin" className="text-red-600">
                Admin
              </NavLink>
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Button variant="outline" size="sm" onClick={logout}>
                Keluar
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Daftar</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="flex items-center justify-center rounded-lg p-1.5 text-gray-600 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu navigasi"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-gray-100 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Utama</p>
              <MobileNavLink href="/" onClick={() => setOpen(false)}>Beranda</MobileNavLink>
              <MobileNavLink href="/search" onClick={() => setOpen(false)}>Cari Donor</MobileNavLink>
              <MobileNavLink href="/requests" onClick={() => setOpen(false)}>Permintaan Darah</MobileNavLink>
              {user && (
                <>
                  <div className="pt-2">
                    <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Menu</p>
                  </div>
                  <MobileNavLink href="/profile" onClick={() => setOpen(false)}>Profil</MobileNavLink>
                  <MobileNavLink href="/donor-history" onClick={() => setOpen(false)}>Riwayat Donor</MobileNavLink>
                  <MobileNavLink href="/events" onClick={() => setOpen(false)}>Event Donor</MobileNavLink>
                  <MobileNavLink href="/leaderboard" onClick={() => setOpen(false)}>Peringkat</MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink href="/admin" onClick={() => setOpen(false)} className="text-red-600">Admin</MobileNavLink>
                  )}
                </>
              )}
              <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
                {user ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { logout(); setOpen(false); }}>
                    Keluar
                  </Button>
                ) : (
                  <>
                    <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">Masuk</Button>
                    </Link>
                    <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                      <Button size="sm" className="w-full">Daftar</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "text-red-600 after:absolute after:-bottom-1 after:left-1/2 after:h-[4px] after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-red-600 after:shadow-[0_0_6px_1px_rgba(220,38,38,0.4)]"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, className, onClick }: { href: string; children: React.ReactNode; className?: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
