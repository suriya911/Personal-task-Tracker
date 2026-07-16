import { taskComparator } from "@/lib/tasks";
import type { Task } from "@/types/models";

export interface ScheduledGroups {
  days: { date: string; tasks: Task[] }[];
  noDate: Task[];
}

/**
 * Group future todo tasks by day (ascending, empty days omitted) plus a
 * no-due-date bucket. Pure — the Scheduled view derives its render from this.
 */
export function groupScheduled(tasks: Task[], today: string): ScheduledGroups {
  const grouped = new Map<string, Task[]>();
  const noDate: Task[] = [];

  for (const t of tasks) {
    if (t.status !== "todo") continue;
    if (!t.due_date) {
      noDate.push(t);
    } else if (t.due_date > today) {
      let arr = grouped.get(t.due_date);
      if (!arr) {
        arr = [];
        grouped.set(t.due_date, arr);
      }
      arr.push(t);
    }
  }

  const days = [...grouped.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, ts]) => ({ date, tasks: ts.slice().sort(taskComparator) }));

  return { days, noDate: noDate.slice().sort(taskComparator) };
}
