import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { lookupName } from "@/lib/data/wilayah";
import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { Droplets, Search, MapPin, ShieldCheck, MessageCircle, Award, ExternalLink, Calendar } from "lucide-react";
import { supabase } from "@/lib/db";

export const metadata: Metadata = {
  title: "AmbilDarahku — Temukan Donor Darah Lebih Cepat",
  description: "Platform donor darah berbasis komunitas. Bangun jaringan donor darah, cari donor terdekat, dan selamatkan nyawa.",
  openGraph: {
    title: "AmbilDarahku — Temukan Donor Darah Lebih Cepat",
    description: "Platform donor darah berbasis komunitas. Bangun jaringan donor darah, cari donor terdekat, dan selamatkan nyawa.",
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k+`;
  return `${n}+`;
}

function formatEventDate(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr);
  const months = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: months[d.getMonth()],
  };
}

// Events may store a regency code ("31.71") or free text; resolve codes for display.
function cityLabel(city: string): string {
  try {
    return lookupName(city);
  } catch {
    return city;
  }
}

async function getUpcomingEvents() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("events")
      .select("title, location, city, event_date, start_time, end_time")
      .eq("status", "upcoming")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(3);
    return data || [];
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`, { next: { revalidate: 60 } });
    const data = await res.json();
    return data.stats;
  } catch {
    return { active_donors: 0, lives_saved: 0, partner_hospitals: 0, cities_reached: 0 };
  }
}

export default async function LandingPage() {
  // Parallel — stats + events no longer sequential waterfall
  const [stats, events] = await Promise.all([getStats(), getUpcomingEvents()]);

  const statCards = [
    { value: stats.active_donors > 0 ? formatStat(stats.active_donors) : "12k+", label: "Donor Aktif", icon: <Droplets className="h-4 w-4" /> },
    { value: stats.lives_saved > 0 ? formatStat(stats.lives_saved) : "8.5k", label: "Nyawa Terselamatkan", icon: <Award className="h-4 w-4" /> },
    { value: stats.cities_reached > 0 ? formatStat(stats.cities_reached) : "15", label: "Kota Terjangkau", icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div>
      <section className="relative overflow-hidden px-5 pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-red-50/40 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center md:text-left md:flex md:items-center md:gap-12">
            <div className="md:flex-1">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-600">
                #SatuTetesSejutaHarapan
              </p>
              <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl md:leading-tight">
                Temukan Donor Darah{" "}
                <span className="text-red-600">Lebih Cepat</span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                Bangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa melalui platform yang cepat, transparan, dan terpercaya.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
                <Link href="/search" className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 px-5 sm:w-auto")}>
                  <Search className="h-4 w-4" />
                  Cari Donor
                </Link>
                <Link href="/register" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full gap-2 px-5 sm:w-auto")}>
                  <Award className="h-4 w-4" />
                  Daftar Sebagai Donor
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/login" className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">
                  Masuk
                </Link>
              </p>
            </div>
            <div className="mt-10 hidden md:flex md:flex-1 md:items-center md:justify-center">
              <div className="grid grid-cols-2 gap-4">
                <BloodTypeBadge type="A+" size="lg" className="text-2xl px-6 py-4" />
                <BloodTypeBadge type="O+" size="lg" className="text-2xl px-6 py-4" />
                <BloodTypeBadge type="AB-" size="lg" className="text-2xl px-6 py-4" />
                <BloodTypeBadge type="B+" size="lg" className="text-2xl px-6 py-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-12">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 sm:gap-3 md:gap-6">
          {statCards.map((stat, i) => (
            <GlassCard key={stat.label} className={`p-3 text-center sm:p-4 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </div>
              <p className="font-heading text-lg font-bold text-foreground sm:text-xl">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs">{stat.label}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Bagaimana Kami Membantu?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Langkah sederhana untuk mulai menyelamatkan nyawa.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Search className="h-5 w-5" />,
              title: "Cari Donor",
              desc: "Temukan donor berdasarkan golongan darah dan lokasi terdekat secara real-time.",
            },
            {
              icon: <MessageCircle className="h-5 w-5" />,
              title: "Hubungi Koordinasi",
              desc: "Terhubung langsung dengan koordinator atau donor melalui integrasi WhatsApp.",
            },
            {
              icon: <ShieldCheck className="h-5 w-5" />,
              title: "Verifikasi Donor",
              desc: "Setiap donor melewati sistem verifikasi untuk memastikan keamanan dan kualitas darah.",
            },
            {
              icon: <Award className="h-5 w-5" />,
              title: "Donasi & Lacak",
              desc: "Lacak riwayat donasi Anda dan dapatkan lencana eksklusif sebagai apresiasi.",
            },
          ].map((feature) => (
            <GlassCard key={feature.title}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="bg-red-50/60 px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              Dapatkan Lencana Kehormatan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Kumpulkan poin dan buka lencana eksklusif yang menunjukkan status Anda sebagai Pahlawan Komunitas.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Donor Pertama", icon: "🩸" },
              { label: "Pahlawan Darah", icon: "🏅" },
              { label: "Penyelamat Jiwa", icon: "❤️" },
              { label: "Pelindung", icon: "🛡️" },
              { label: "Elit", icon: "💎" },
            ].map((badge) => (
              <GlassCard key={badge.label} className="text-center">
                <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-card text-3xl shadow-sm md:size-20">
                  {badge.icon}
                </div>
                <p className="text-sm font-semibold text-foreground">{badge.label}</p>
              </GlassCard>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/leaderboard" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Lihat Semua Lencana
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-red-50/40 px-5 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Partner Kami
          </h2>
          <div className="mt-8 flex justify-center">
            <a
              href="https://www.instagram.com/kawansedarah/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <img
                src="/images/kawan-sedarah.webp"
                alt="Kawan Sedarah"
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl shadow-md"
              />
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Event Donor Terdekat
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ikuti kegiatan donor darah massal di lokasi sekitar Anda.
              </p>
            </div>
            <Link href="/events" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Lihat Kalender
              <span className="text-lg">→</span>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.length > 0 ? events.map((event: any) => {
              const fd = formatEventDate(event.event_date);
              const loc = [event.location, event.city ? cityLabel(event.city) : null].filter(Boolean).join(", ");
              const time = [event.start_time, event.end_time].filter(Boolean).join(" - ");
              return (
                <Link key={event.event_date + event.title} href="/events" className="block cursor-pointer">
                  <GlassCard className="flex gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-center text-primary">
                      <span className="text-xs font-bold">{fd.day}</span>
                      <span className="text-sm font-bold">{fd.month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 break-words text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">{loc}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </div>
                  </GlassCard>
                </Link>
              );
            }) : (
              <GlassCard className="col-span-full py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Belum ada event donor terdekat.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:pb-32">
        <GlassCard elevated className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Siap Menjadi Pahlawan?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftarkan diri Anda hari ini dan jadilah bagian dari perubahan positif di komunitas Anda.
          </p>
          <div className="mt-6">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "gap-2 px-5")}>
              <ExternalLink className="h-4 w-4" />
              Daftar Gratis Sekarang
            </Link>
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
                  <Droplets className="h-4 w-4 text-white" />
                </div>
                <span className="font-heading text-base font-bold text-foreground">AmbilDarahku</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Platform digital untuk memudahkan pencarian dan pendataan donor darah di Indonesia secara cepat, aman, dan transparan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Layanan</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/search" className="hover:text-red-600">Cari Donor</Link></li>
                  <li><Link href="/register" className="hover:text-red-600">Daftar Donor</Link></li>
                  <li><Link href="/requests/new" className="hover:text-red-600">Permintaan Darah</Link></li>
                  <li><Link href="/events" className="hover:text-red-600">Event</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Kontak</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="https://www.instagram.com/ambildarahku/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600">@ambildarahku</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AmbilDarahku. Dibuat dengan ❤️ untuk kemanusiaan.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Kebijakan Privasi</Link>
              <Link href="/terms" className="hover:text-foreground">Ketentuan Layanan</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
