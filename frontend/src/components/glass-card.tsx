import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function GlassCard({ children, className, elevated }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        elevated ? "glass-card-elevated" : "glass-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
