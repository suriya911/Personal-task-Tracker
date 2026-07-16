import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { Task, TaskPriority } from "@/types/models";

/** Local calendar day as `yyyy-MM-dd`. Server + client agree on the user's TZ. */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export interface PostponeSnapshot {
  due_date: string | null;
  original_due_date: string | null;
  postponed_count: number;
}

/**
 * Postpone math: push due date one day, bump the count, and set
 * original_due_date exactly once (the first time). Pure — the server action
 * and the optimistic UI both derive from this so they never drift.
 */
export function nextPostpone(
  s: PostponeSnapshot,
  today = todayStr(),
): PostponeSnapshot {
  const base = s.due_date ? parseISO(s.due_date) : parseISO(today);
  return {
    due_date: format(addDays(base, 1), "yyyy-MM-dd"),
    postponed_count: s.postponed_count + 1,
    original_due_date: s.original_due_date ?? s.due_date ?? today,
  };
}

/**
 * Day-group header: relative wording for the next 7 days, absolute beyond.
 * "Tomorrow" · "Thursday, Jul 16" · "Mon, Aug 3"
 */
export function formatDayHeader(dateStr: string, today: string): string {
  const date = parseISO(dateStr);
  const diff = differenceInCalendarDays(date, parseISO(today));
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 7) return format(date, "EEEE, MMM d");
  return format(date, "EEE, MMM d");
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Sort order used everywhere: important → priority → position. */
export function taskComparator(a: Task, b: Task): number {
  if (a.is_important !== b.is_important) return a.is_important ? -1 : 1;
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  return a.position - b.position;
}

/** Priority as a left-edge bar color (Phase 5 visual, applied here early). */
export function priorityBarClass(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-rose-500";
    case "medium":
      return "bg-amber-500";
    default:
      return "bg-transparent";
  }
}

export function isDone(task: Pick<Task, "status">): boolean {
  return task.status === "done";
}
