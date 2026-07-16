import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { taskComparator, todayStr } from "@/lib/tasks";
import type { Task } from "@/types/models";

const SELECT =
  "*, category:categories(id, name, color, icon), recurrence:recurrence_rules(frequency, interval)";

export interface TodayData {
  /** Auth state — null means "not signed in / Supabase not configured yet". */
  authed: boolean;
  overdue: Task[];
  today: Task[];
  noDate: Task[];
}

const EMPTY: TodayData = { authed: false, overdue: [], today: [], noDate: [] };

/**
 * Everything the Today view needs, in one round trip's worth of queries.
 * - overdue: todo, due before today
 * - today:   due today (todo OR completed today — so a just-checked task stays
 *            visible, struck through, and the progress ring can count it)
 * - noDate:  todo, no due date
 */
export async function getTodayData(): Promise<TodayData> {
  const supabase = await createClient();
  if (!supabase) return EMPTY;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const today = todayStr();

  const [overdueRes, todayRes, noDateRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("status", "todo")
      .lt("due_date", today)
      .is("parent_task_id", null).eq("is_recurrence_template", false),
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("due_date", today)
      .neq("status", "archived")
      .is("parent_task_id", null).eq("is_recurrence_template", false),
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("status", "todo")
      .is("due_date", null)
      .is("parent_task_id", null).eq("is_recurrence_template", false),
  ]);

  const sort = (rows: unknown): Task[] =>
    ((rows as Task[] | null) ?? []).slice().sort(taskComparator);

  return {
    authed: true,
    overdue: sort(overdueRes.data),
    today: sort(todayRes.data),
    noDate: sort(noDateRes.data),
  };
}

/** Starred, not-yet-done tasks — the Important view. */
export async function getImportantTasks(): Promise<{
  authed: boolean;
  tasks: Task[];
}> {
  const supabase = await createClient();
  if (!supabase) return { authed: false, tasks: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, tasks: [] };

  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .eq("is_important", true)
    .eq("status", "todo")
    .is("parent_task_id", null).eq("is_recurrence_template", false);

  return {
    authed: true,
    tasks: ((data as Task[] | null) ?? []).slice().sort(taskComparator),
  };
}

/** All future tasks grouped by day (ascending, empty days skipped) + a no-date bucket. */
export async function getScheduledTasks(): Promise<{
  authed: boolean;
  days: { date: string; tasks: Task[] }[];
  noDate: Task[];
}> {
  const supabase = await createClient();
  if (!supabase) return { authed: false, days: [], noDate: [] };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, days: [], noDate: [] };

  const today = todayStr();

  const [futureRes, noDateRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("status", "todo")
      .gt("due_date", today)
      .is("parent_task_id", null).eq("is_recurrence_template", false)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select(SELECT)
      .eq("status", "todo")
      .is("due_date", null)
      .is("parent_task_id", null).eq("is_recurrence_template", false),
  ]);

  const grouped = new Map<string, Task[]>();
  for (const t of (futureRes.data as Task[] | null) ?? []) {
    if (!t.due_date) continue;
    const arr = grouped.get(t.due_date) ?? [];
    arr.push(t);
    grouped.set(t.due_date, arr);
  }

  const days = [...grouped.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, tasks]) => ({ date, tasks: tasks.sort(taskComparator) }));

  return {
    authed: true,
    days,
    noDate: ((noDateRes.data as Task[] | null) ?? []).slice().sort(taskComparator),
  };
}

/** Tasks for one month, keyed by `yyyy-MM-dd`. `month` is any date in the month. */
export async function getMonthTasks(month: Date): Promise<{
  authed: boolean;
  byDate: Record<string, Task[]>;
}> {
  const supabase = await createClient();
  if (!supabase) return { authed: false, byDate: {} };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authed: false, byDate: {} };

  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");

  const { data } = await supabase
    .from("tasks")
    .select(SELECT)
    .neq("status", "archived")
    .not("due_date", "is", null)
    .gte("due_date", start)
    .lte("due_date", end)
    .is("parent_task_id", null).eq("is_recurrence_template", false);

  const byDate: Record<string, Task[]> = {};
  for (const t of (data as Task[] | null) ?? []) {
    if (!t.due_date) continue;
    (byDate[t.due_date] ??= []).push(t);
  }
  for (const k of Object.keys(byDate)) byDate[k].sort(taskComparator);

  return { authed: true, byDate };
}
