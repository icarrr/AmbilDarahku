import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  status?: "completed" | "current" | "upcoming";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isCompleted = item.status === "completed" || !item.status;
        return (
          <div key={item.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[11px] top-6 h-full -translate-x-1/2 border-l-2 border-dashed",
                  isCompleted ? "border-red-500" : "border-gray-200",
                )}
              />
            )}
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                  isCompleted
                    ? "border-red-500 bg-red-500 text-white"
                    : item.status === "current"
                      ? "border-red-500 bg-white"
                      : "border-gray-300 bg-white",
                )}
              >
                {isCompleted && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {item.status === "current" && <div className="h-2 w-2 rounded-full bg-red-500" />}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              {item.date && <p className="mt-0.5 text-xs text-[#94a3b8]">{item.date}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
