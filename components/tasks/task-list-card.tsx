import { cn } from "@/lib/utils";

/** Glass card wrapper for a group of task rows (Today/Scheduled/Important/Project lists). */
export function TaskListCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl p-1.5", className)}>
      {children}
    </div>
  );
}
