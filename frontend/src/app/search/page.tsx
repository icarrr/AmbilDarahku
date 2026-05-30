"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Donor = {
  id: string;
  full_name: string;
  blood_type: string;
  rhesus: string;
  city: string;
  total_donations: number;
  phone?: string;
};

const BLOOD_TYPES = ["A", "B", "AB", "O"];

export default function SearchPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filters, setFilters] = useState({ blood_type: "", rhesus: "", city: "" });
  const [searched, setSearched] = useState(false);

  const search = async () => {
    const params = new URLSearchParams();
    if (filters.blood_type) params.set("blood_type", filters.blood_type);
    if (filters.rhesus) params.set("rhesus", filters.rhesus);
    if (filters.city) params.set("city", filters.city);
    params.set("availability_status", "available");

    try {
      const data = await api.get<{ donors: Donor[] }>(`/donors?${params}`);
      setDonors(data.donors);
    } catch {
      setDonors([]);
    }
    setSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cari Donor Darah</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Golongan Darah</Label>
              <Select value={filters.blood_type || ""} onValueChange={v => setFilters(p => ({ ...p, blood_type: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map(bt => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rhesus</Label>
              <Select value={filters.rhesus || ""} onValueChange={v => setFilters(p => ({ ...p, rhesus: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="+">+</SelectItem>
                  <SelectItem value="-">-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kota</Label>
              <Input placeholder="Contoh: Bandung" value={filters.city} onChange={e => setFilters(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={search}>Cari</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{donors.length} donor ditemukan</p>
          {donors.map(donor => (
            <Card key={donor.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{donor.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {donor.blood_type}{donor.rhesus} &middot; {donor.city} &middot; {donor.total_donations}x donor
                  </p>
                </div>
                <a href={`https://wa.me/${donor.phone || "62"}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Hubungi WhatsApp
                </a>
              </CardContent>
            </Card>
          ))}
          {donors.length === 0 && (
            <p className="text-center text-gray-500 py-8">Tidak ada donor yang cocok</p>
          )}
        </div>
      )}
    </div>
  );
}
