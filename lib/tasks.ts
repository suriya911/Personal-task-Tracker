import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { APP_TIME_ZONE, dayIn } from "@/lib/timezone";
import type { Task, TaskPriority } from "@/types/models";

/**
 * Today as `yyyy-MM-dd` in the app's timezone — the same answer on the server
 * (UTC on Vercel) and in the browser (the visitor's own zone). See lib/timezone.
 */
export function todayStr(timeZone: string = APP_TIME_ZONE): string {
  return dayIn(new Date(), timeZone);
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
 *
 * Overdue tasks anchor to today, not to their stale due date: "postpone to
 * tomorrow" has to land on tomorrow, otherwise a task overdue since last week
 * just moves to another past day and stays overdue.
 */
export function nextPostpone(
  s: PostponeSnapshot,
  today = todayStr(),
): PostponeSnapshot {
  const base =
    s.due_date && s.due_date > today ? parseISO(s.due_date) : parseISO(today);
  return {
    due_date: format(addDays(base, 1), "yyyy-MM-dd"),
    postponed_count: s.postponed_count + 1,
    original_due_date: s.original_due_date ?? s.due_date ?? today,
  };
}

/**
 * Move a due date by whole days in either direction.
 *
 * `+1` is the postpone case and matches `nextPostpone` exactly (overdue tasks
 * anchor to today so they land on tomorrow). `-1` pulls a task forward and
 * *undoes* a postpone: the counter comes back down, and once it reaches zero
 * the original-due-date marker is cleared, so "postponed 3×" stays truthful.
 *
 * Never returns a date before today — pulling a task into the past would make
 * it instantly overdue, which is never what "do it sooner" means. Callers
 * should use `canPrepone` to disable the control instead of relying on this.
 */
export function shiftDue(
  s: PostponeSnapshot,
  delta: 1 | -1,
  today = todayStr(),
): PostponeSnapshot {
  if (delta === 1) return nextPostpone(s, today);

  const base = s.due_date ? parseISO(s.due_date) : parseISO(today);
  const moved = addDays(base, -1);
  const clamped = format(moved, "yyyy-MM-dd") < today ? parseISO(today) : moved;
  const count = Math.max(0, s.postponed_count - 1);

  return {
    due_date: format(clamped, "yyyy-MM-dd"),
    postponed_count: count,
    original_due_date: count === 0 ? null : s.original_due_date,
  };
}

/** A task can only be pulled forward while it still sits beyond today. */
export function canPrepone(
  dueDate: string | null,
  today = todayStr(),
): boolean {
  return !!dueDate && dueDate > today;
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

/**
 * Sort order used everywhere:
 *   still to do → title A–Z → group → position
 *
 * Finished work sinks to the bottom of its section instead of holding a slot
 * in the middle of the list. `position` only ever breaks a tie between two
 * tasks that match on every other key, so the order stays stable.
 *
 * Note that titles are compared before categories, so the list reads as one
 * alphabetical run rather than grouping into category blocks — category only
 * separates two tasks that share a title.
 */
export function taskComparator(a: Task, b: Task): number {
  const aDone = a.status === "done";
  const bDone = b.status === "done";
  if (aDone !== bDone) return aDone ? 1 : -1;

  // `numeric` so "Step 2" precedes "Step 10"; `base` so case and accents
  // don't split otherwise-identical titles.
  const byTitle = a.title.localeCompare(b.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (byTitle !== 0) return byTitle;

  // Uncategorised sorts after everything named, rather than jumping to the
  // top the way an empty string would.
  const aCat = a.category?.name ?? "￿";
  const bCat = b.category?.name ?? "￿";
  const byCategory = aCat.localeCompare(bCat, undefined, {
    sensitivity: "base",
  });
  if (byCategory !== 0) return byCategory;

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
