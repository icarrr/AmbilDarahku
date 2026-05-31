import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  className?: string;
}

const rankStyles: Record<number, string> = {
  1: "bg-amber-400 text-amber-900 shadow-[0_0_12px_-2px_rgba(251,191,36,0.5)]",
  2: "bg-slate-300 text-slate-700",
  3: "bg-amber-700 text-amber-100",
};

export function RankBadge({ rank, className }: RankBadgeProps) {
  const style = rankStyles[rank] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        style,
        className,
      )}
    >
      {rank}
    </span>
  );
}
