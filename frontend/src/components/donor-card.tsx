import { GlassCard } from "@/components/glass-card";
import { BloodTypeBadge } from "@/components/blood-type-badge";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { MapPin, Star } from "lucide-react";
import Link from "next/link";

interface DonorCardProps {
  name: string;
  bloodType: string;
  rhesus: string;
  city: string;
  distance?: string;
  status: string;
  totalDonations?: number;
  phone?: string;
  isTopDonor?: boolean;
  className?: string;
}

export function DonorCard({
  name,
  bloodType,
  rhesus,
  city,
  distance,
  status,
  totalDonations,
  phone,
  isTopDonor,
  className,
}: DonorCardProps) {
  const bloodDisplay = `${bloodType}${rhesus}`;
  return (
    <GlassCard className={cn("flex items-center gap-3", isTopDonor && "glass-card-elevated", className)}>
      {isTopDonor && (
        <div className="absolute -top-2 -right-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        </div>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 font-heading text-sm font-bold text-white">
        {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {isTopDonor && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{distance ? `${distance} • ${city}` : city}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <BloodTypeBadge type={bloodDisplay} size="sm" />
          <StatusBadge status={status} dot />
          {totalDonations !== undefined && (
            <span className="text-xs text-[#94a3b8]">{totalDonations}x donor</span>
          )}
        </div>
      </div>
      {phone && (
        <Link
          href={`https://wa.me/${phone}?text=Halo%2C%20saya%20membutuhkan%20donor%20darah.%20Apakah%20Anda%20tersedia%3F`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
        >
          WhatsApp
        </Link>
      )}
    </GlassCard>
  );
}
