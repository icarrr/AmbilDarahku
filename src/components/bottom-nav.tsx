"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useCallback, useRef, useState } from "react";
import { Menu, X, Plus, LogIn, LogOut } from "lucide-react";
import { mainNav, memberNav, adminNavItem, isNavActive, type NavItem } from "@/components/nav-config";
import { useDialogFocus } from "@/lib/use-dialog-focus";

// Bottom bar shows the first three main items; Event lives in the drawer.
const barItems = mainNav.slice(0, 3);

const barItemClass =
  "relative flex min-h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

function BarLink({ href, icon: Icon, label, shortLabel, pathname }: NavItem & { pathname: string }) {
  const isActive = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        barItemClass,
        isActive
          ? "text-primary after:absolute after:-top-1 after:left-1/2 after:h-[4px] after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary after:shadow-[0_0_6px_1px_rgba(220,38,38,0.5)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{shortLabel ?? label}</span>
    </Link>
  );
}

function DrawerLink({ href, icon: Icon, label, pathname, onNavigate }: NavItem & { pathname: string; onNavigate: () => void }) {
  const isActive = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useDialogFocus(drawerOpen, panelRef, closeDrawer);

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav aria-label="Navigasi utama" className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass-strong rounded-t-2xl px-1 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around">
            {barItems.map((item) => <BarLink key={item.href} {...item} pathname={pathname} />)}
            {user ? (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Buka menu navigasi"
                aria-expanded={drawerOpen}
                aria-haspopup="dialog"
                className={cn(barItemClass, "text-muted-foreground hover:text-foreground")}
              >
                <Menu className="h-5 w-5" />
                <span>Menu</span>
              </button>
            ) : (
              <BarLink href="/login" label="Masuk" icon={LogIn} pathname={pathname} />
            )}
          </div>
        </div>
      </nav>

      {/* ── Drawer ── */}
      {drawerOpen && user && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={closeDrawer}
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={-1}
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-popover px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl md:hidden animate-slide-up"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="drawer-title" className="font-heading text-base font-bold text-foreground">Menu</h3>
              <button
                onClick={closeDrawer}
                aria-label="Tutup menu"
                className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/requests/new"
              onClick={closeDrawer}
              className="mb-3 flex min-h-11 items-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              <span>Buat Permintaan Darah</span>
            </Link>

            <div className="flex flex-col gap-1">
              {mainNav.slice(3).map((item) => <DrawerLink key={item.href} {...item} pathname={pathname} onNavigate={closeDrawer} />)}
            </div>

            {memberNav.map((group) => (
              <div key={group.title} className="mt-3">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => <DrawerLink key={item.href} {...item} pathname={pathname} onNavigate={closeDrawer} />)}
                </div>
              </div>
            ))}

            {isAdmin && (
              <div className="mt-3 flex flex-col gap-1">
                <DrawerLink {...adminNavItem} pathname={pathname} onNavigate={closeDrawer} />
              </div>
            )}

            <button
              onClick={() => { closeDrawer(); logout(); }}
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
