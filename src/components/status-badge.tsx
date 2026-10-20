import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  available: { label: "Tersedia", class: "bg-emerald-100 text-emerald-700" },
  temporarily_unavailable: { label: "Tidak Tersedia", class: "bg-amber-100 text-amber-700" },
  permanently_unavailable: { label: "Tidak Aktif", class: "bg-gray-100 text-gray-500" },
  eligible: { label: "Siap Donor", class: "bg-emerald-100 text-emerald-700" },
  waiting_period: { label: "Masa Tunggu", class: "bg-amber-100 text-amber-700" },
  not_eligible: { label: "Tidak Memenuhi Syarat", class: "bg-red-100 text-red-700" },
  needs_clearance: { label: "Perlu Izin Dokter", class: "bg-purple-100 text-purple-700" },
  pending: { label: "Tertunda", class: "bg-yellow-100 text-yellow-700" },
  verified: { label: "Terverifikasi", class: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", class: "bg-red-100 text-red-700" },
  approved: { label: "Disetujui", class: "bg-emerald-100 text-emerald-700" },
  awarded: { label: "Diberikan", class: "bg-emerald-100 text-emerald-700" },
  fulfilled: { label: "Terpenuhi", class: "bg-emerald-100 text-emerald-700" },
  self_reported: { label: "Dicatat Sendiri", class: "bg-blue-100 text-blue-700" },
  open: { label: "Terbuka", class: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Selesai", class: "bg-emerald-100 text-emerald-700" },
  dismissed: { label: "Diabaikan", class: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Dibatalkan", class: "bg-gray-100 text-gray-600" },
  expired: { label: "Kedaluwarsa", class: "bg-gray-100 text-gray-600" },
  active: { label: "Aktif", class: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Tidak Aktif", class: "bg-gray-100 text-gray-500" },
};

export function StatusBadge({ status, className, dot }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status || "—", class: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.class,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {config.label}
    </span>
  );
}
