import { cn } from "@/lib/utils";

const bloodTypeColors: Record<string, string> = {
  "A+": "bg-red-100 text-red-700",
  "A-": "bg-red-50 text-red-600",
  "B+": "bg-blue-100 text-blue-700",
  "B-": "bg-blue-50 text-blue-600",
  "AB+": "bg-purple-100 text-purple-700",
  "AB-": "bg-purple-50 text-purple-600",
  "O+": "bg-green-100 text-green-700",
  "O-": "bg-green-50 text-green-600",
};

interface BloodTypeBadgeProps {
  type: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BloodTypeBadge({ type, className, size = "md" }: BloodTypeBadgeProps) {
  const colorClass = bloodTypeColors[type] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-heading font-bold",
        size === "sm" && "px-1.5 py-0.5 text-xs",
        size === "md" && "px-2 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        colorClass,
        className,
      )}
    >
      {type}
    </span>
  );
}
