import { format, parseISO, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { todayStr } from "@/lib/tasks";
import { dayIn } from "@/lib/timezone";

export interface DayPoint {
  /** yyyy-MM-dd */
  date: string;
  done: number;
}

export interface CategorySlice {
  name: string;
  color: string | null;
  open: number;
}

export interface WeekdayPoint {
  /** Mon…Sun */
  label: string;
  done: number;
}

export interface StatsData {
  authed: boolean;
  doneThisWeek: number;
  /** doneThisWeek minus the 7 days before that. */
  deltaVsLastWeek: number;
  /** done ÷ (done + open), over the last 30 days. NaN-safe: 0 when empty. */
  completionRate: number;
  openCount: number;
  done30: number;
  overdue: number;
  /** Consecutive days (ending today or yesterday) with ≥1 completion. */
  streak: number;
  /** Last 14 days, oldest first. */
  daily: DayPoint[];
  /** Open tasks per category, largest first, tail folded into "Other". */
  byCategory: CategorySlice[];
  /** Completions by weekday over the last 8 weeks, Mon…Sun. */
  byWeekday: WeekdayPoint[];
}

const EMPTY: StatsData = {
  authed: false,
  doneThisWeek: 0,
  deltaVsLastWeek: 0,
  completionRate: 0,
  openCount: 0,
  done30: 0,
  overdue: 0,
  streak: 0,
  daily: [],
  byCategory: [],
  byWeekday: [],
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Everything the Statistics view needs, computed from two queries. */
export async function getStats(): Promise<StatsData> {
  const supabase = await createClient();
  if (!supabase) return EMPTY;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const today = todayStr();
  const since = subDays(new Date(), 56).toISOString();

  const [openRes, doneRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("due_date, category:categories(name, color)")
      .eq("status", "todo")
      .is("parent_task_id", null)
      .eq("is_recurrence_template", false),
    supabase
      .from("tasks")
      .select("completed_at")
      .eq("status", "done")
      .gte("completed_at", since)
      .is("parent_task_id", null)
      .eq("is_recurrence_template", false),
  ]);

  type OpenRow = {
    due_date: string | null;
    category: { name: string; color: string | null } | null;
  };
  const open = (openRes.data as OpenRow[] | null) ?? [];
  // completed_at is a timestamptz; which calendar day it counts for depends on
  // the zone, so resolve it in the app's zone rather than the runtime's.
  const doneDates = ((doneRes.data as { completed_at: string | null }[] | null) ?? [])
    .filter((r) => r.completed_at)
    .map((r) => dayIn(new Date(r.completed_at!)));

  const doneByDay = new Map<string, number>();
  for (const d of doneDates) doneByDay.set(d, (doneByDay.get(d) ?? 0) + 1);

  // Pure calendar arithmetic from today's date-string — no instants involved,
  // so this can't drift with the runtime zone.
  const todayDate = parseISO(today);
  const dayKey = (daysAgo: number) =>
    format(subDays(todayDate, daysAgo), "yyyy-MM-dd");
  const countBack = (from: number, to: number) => {
    let n = 0;
    for (let i = from; i < to; i++) n += doneByDay.get(dayKey(i)) ?? 0;
    return n;
  };

  const doneThisWeek = countBack(0, 7);
  const doneLastWeek = countBack(7, 14);
  const done30 = countBack(0, 30);

  let streak = 0;
  for (let i = doneByDay.has(dayKey(0)) ? 0 : 1; ; i++) {
    if (!doneByDay.has(dayKey(i))) break;
    streak++;
  }

  const daily: DayPoint[] = [];
  for (let i = 13; i >= 0; i--)
    daily.push({ date: dayKey(i), done: doneByDay.get(dayKey(i)) ?? 0 });

  const byWeekday: WeekdayPoint[] = WEEKDAYS.map((label) => ({
    label,
    done: 0,
  }));
  for (const d of doneDates) {
    // Read the weekday off a UTC-noon instant so the result is the same in
    // every runtime zone. getUTCDay: 0 = Sunday; remap to Mon-first.
    const idx = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
    byWeekday[idx].done += 1;
  }

  const catMap = new Map<string, CategorySlice>();
  for (const t of open) {
    const key = t.category?.name ?? "No category";
    const cur = catMap.get(key);
    if (cur) cur.open += 1;
    else
      catMap.set(key, {
        name: key,
        color: t.category?.color ?? null,
        open: 1,
      });
  }
  const sorted = [...catMap.values()].sort((a, b) => b.open - a.open);
  const byCategory = sorted.slice(0, 6);
  const tail = sorted.slice(6);
  if (tail.length > 0)
    byCategory.push({
      name: "Other",
      color: null,
      open: tail.reduce((n, c) => n + c.open, 0),
    });

  const openCount = open.length;
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;

  return {
    authed: true,
    doneThisWeek,
    deltaVsLastWeek: doneThisWeek - doneLastWeek,
    completionRate: done30 + openCount > 0 ? done30 / (done30 + openCount) : 0,
    openCount,
    done30,
    overdue,
    streak,
    daily,
    byCategory,
    byWeekday,
  };
}
