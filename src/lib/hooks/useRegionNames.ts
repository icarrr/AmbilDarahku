"use client";

import { useEffect, useState } from "react";

// Client-side resolver for regency (kab/kota) codes like "31.71" or "3171".
// lib/data/wilayah.ts is server-only (fs), so this lazily loads the per-province
// regency file the API routes already serve from /public/data.

const names = new Map<string, string>(); // "3171" -> "Kota Jakarta Selatan"
const loading = new Map<string, Promise<void>>(); // province code -> fetch

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalize(code: string): string | null {
  const n = code.replace(/\./g, "");
  return /^\d{4}$/.test(n) ? n : null;
}

function loadProvince(prov: string): Promise<void> {
  let p = loading.get(prov);
  if (!p) {
    p = fetch(`/data/regencies/${prov}.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { id: string; DESKRIPSI: string }[]) => {
        for (const it of items) names.set(it.id, titleCase(it.DESKRIPSI));
      })
      .catch(() => {});
    loading.set(prov, p);
  }
  return p;
}

/** Resolve a regency code to its display name; returns the input unchanged if it is not a code or not loaded yet. */
export function regionName(code: string | null | undefined): string {
  if (!code) return "";
  const n = normalize(code);
  if (!n) return code;
  return names.get(n) ?? code;
}

/** Loads names for the given codes and re-renders once they are available. Use `regionName` to display. */
export function useRegionNames(codes: (string | null | undefined)[]): typeof regionName {
  const [, setVersion] = useState(0);
  const provKey = Array.from(
    new Set(
      codes
        .map((c) => (c ? normalize(c) : null))
        .filter((n): n is string => !!n && !names.has(n))
        .map((n) => n.slice(0, 2))
    )
  )
    .sort()
    .join(",");

  useEffect(() => {
    if (!provKey) return;
    let active = true;
    Promise.all(provKey.split(",").map(loadProvince)).then(() => {
      if (active) setVersion((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, [provKey]);

  return regionName;
}
