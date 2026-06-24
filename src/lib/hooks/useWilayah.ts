"use client";

import { useState, useEffect } from "react";

type WilayahItem = { id: string; JENIS: number; DESKRIPSI: string };

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useWilayah() {
  const [data, setData] = useState<WilayahItem[]>([]);

  useEffect(() => {
    fetch("/data/wilayah.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const provinces = data
    .filter((w) => w.JENIS === 1)
    .map((w) => ({ code: w.id, name: titleCase(w.DESKRIPSI) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const getRegencies = (provCode: string) =>
    data
      .filter((w) => w.JENIS === 2 && w.id.startsWith(provCode))
      .map((w) => ({ code: w.id, name: titleCase(w.DESKRIPSI) }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const getDistricts = (regencyCode: string) =>
    data
      .filter((w) => w.JENIS === 3 && w.id.startsWith(regencyCode))
      .map((w) => ({ code: w.id, name: titleCase(w.DESKRIPSI) }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const getName = (code: string): string => {
    const item = data.find((w) => w.id === code);
    return item ? titleCase(item.DESKRIPSI) : code;
  };

  return {
    loaded: data.length > 0,
    provinces,
    getRegencies,
    getDistricts,
    getName,
  };
}
