import { cn } from "@/lib/utils";

interface UrgencyBadgeProps {
  level: string;
  className?: string;
}

export function UrgencyBadge({ level, className }: UrgencyBadgeProps) {
  const isCritical = level === "critical";
  const label = level === "critical" ? "Kritis" : level === "urgent" ? "Mendesak" : "Biasa";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        isCritical
          ? "bg-red-600 text-white animate-pulse"
          : level === "urgent"
            ? "bg-amber-500 text-white"
            : "bg-blue-100 text-blue-700",
        className,
      )}
    >
      {isCritical && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      {label}
    </span>
  );
}
