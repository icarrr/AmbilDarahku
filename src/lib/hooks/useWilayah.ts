"use client";

import { useState, useEffect, useCallback } from "react";

type WilayahItem = { id: string; JENIS: number; DESKRIPSI: string };
type Option = { code: string; name: string };

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function toOptions(items: WilayahItem[]): Option[] {
  return items
    .map((w) => ({ code: w.id, name: titleCase(w.DESKRIPSI) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Module-level cache — refetch-free across hook instances and remounts
const cache = new Map<string, WilayahItem[]>();

async function fetchJson(url: string): Promise<WilayahItem[]> {
  const hit = cache.get(url);
  if (hit) return hit;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const items: WilayahItem[] = await res.json();
    cache.set(url, items);
    return items;
  } catch {
    return [];
  }
}

// Lazy per-level loading — only fetches what the current selection needs,
// instead of shipping the whole 586KB wilayah.json on page load.
export function useWilayah() {
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [regencies, setRegencies] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);

  useEffect(() => {
    fetchJson("/data/provinces.json").then((items) => setProvinces(toOptions(items)));
  }, []);

  const loadRegencies = useCallback(async (provCode: string | null | undefined) => {
    if (!provCode) {
      setRegencies([]);
      setDistricts([]);
      return;
    }
    const items = await fetchJson(`/data/regencies/${provCode}.json`);
    setRegencies(toOptions(items));
    setDistricts([]);
  }, []);

  const loadDistricts = useCallback(async (regencyCode: string | null | undefined) => {
    if (!regencyCode) {
      setDistricts([]);
      return;
    }
    const items = await fetchJson(`/data/districts/${regencyCode}.json`);
    setDistricts(toOptions(items));
  }, []);

  return {
    loaded: provinces.length > 0,
    provinces,
    regencies,
    districts,
    loadRegencies,
    loadDistricts,
  };
}