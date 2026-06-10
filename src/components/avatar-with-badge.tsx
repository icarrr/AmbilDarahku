import { cn } from "@/lib/utils";
import { getFileUrl } from "@/lib/file";

interface AvatarWithBadgeProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  badge?: { label: string; level?: "gold" | "silver" | "bronze" };
  className?: string;
}

export function AvatarWithBadge({ name, avatarUrl, size = "md", badge, className }: AvatarWithBadgeProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-4xl",
  };

  const badgeColors = {
    gold: "bg-amber-400 text-amber-900",
    silver: "bg-slate-300 text-slate-700",
    bronze: "bg-amber-700 text-amber-100",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {avatarUrl ? (
        <img
          src={getFileUrl(avatarUrl) || ""}
          alt={name}
          className={cn("rounded-full object-cover", sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 font-heading font-bold text-white",
            sizeClasses[size],
          )}
        >
          {initials}
        </div>
      )}
      {badge && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap",
            badgeColors[badge.level || "gold"],
          )}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}
