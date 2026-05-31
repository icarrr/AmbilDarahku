import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon?: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}

export function StatCard({ icon, value, label, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex items-center gap-3", className)}>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
          {icon}
        </div>
      )}
      <div>
        <p className="font-heading text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </GlassCard>
  );
}
