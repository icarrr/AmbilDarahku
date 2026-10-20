import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

export function GlassCard({ children, className, elevated, onClick, role, tabIndex }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        elevated ? "glass-card-elevated" : "glass-card",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className,
      )}
      onClick={onClick}
      role={role ?? (onClick ? "button" : undefined)}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      onKeyDown={onClick ? (e) => {
        // Only when the card itself is focused — don't hijack keys from nested links/inputs.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      } : undefined}
    >
      {children}
    </div>
  );
}
