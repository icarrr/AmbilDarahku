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
        className,
      )}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}
