"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-red-700 dark:text-red-400">
          AmbilDarahku
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/search" className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600">
                Cari Donor
              </Link>
              <Link href="/requests/new" className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600">
                Request
              </Link>
              <Link href="/leaderboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600">
                Peringkat
              </Link>
              <Link href="/profile" className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600">
                Profil
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Keluar
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
