import { cn } from "@/lib/utils";
import Link from "next/link";

interface SectionTitleProps {
  children: React.ReactNode;
  action?: { label: string; href: string };
  className?: string;
}

export function SectionTitle({ children, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="font-heading text-lg font-semibold text-foreground">{children}</h2>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
