import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  getDate,
  getDay,
  getDaysInMonth,
  parseISO,
  setDate,
  startOfMonth,
  format,
} from "date-fns";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  days_of_week: number[] | null; // 0 = Sunday … 6 = Saturday
  day_of_month: number | null; // 1..31
  anchor_date: string; // yyyy-MM-dd
  ends_at: string | null; // yyyy-MM-dd
}

type Freq = RecurrenceRule["frequency"];

/**
 * Derive a rule's interval + weekly/monthly anchoring fields from a frequency
 * and anchor date. Pure — shared by the create and edit paths so they can't
 * diverge (the source of an earlier duplicate-rule bug).
 */
export function buildRuleFields(
  frequency: Freq,
  interval: number,
  anchorDate: Date,
): { interval: number; days_of_week: number[] | null; day_of_month: number | null } {
  return {
    interval: Math.max(1, Math.floor(interval)),
    days_of_week: frequency === "weekly" ? [getDay(anchorDate)] : null,
    day_of_month: frequency === "monthly" ? getDate(anchorDate) : null,
  };
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/** Clamp a day-of-month to the target month's length (e.g. 31 → Feb 28). */
function clampedDate(monthAnchor: Date, day: number): Date {
  return setDate(monthAnchor, Math.min(day, getDaysInMonth(monthAnchor)));
}

/**
 * Smallest occurrence date on or after `from`, or null if the rule has ended.
 * Pure and deterministic — safe to unit-test.
 */
export function getNextOccurrence(
  rule: RecurrenceRule,
  from: string,
): string | null {
  const anchor = parseISO(rule.anchor_date);
  const fromDate = parseISO(from);
  const interval = Math.max(1, rule.interval);
  const start = fromDate < anchor ? anchor : fromDate;

  let result: Date | null = null;

  switch (rule.frequency) {
    case "daily": {
      const diff = differenceInCalendarDays(start, anchor);
      const n = diff <= 0 ? 0 : Math.ceil(diff / interval);
      result = addDays(anchor, n * interval);
      break;
    }
    case "weekly": {
      const wanted =
        rule.days_of_week && rule.days_of_week.length > 0
          ? rule.days_of_week
          : [getDay(anchor)];
      // Scan forward a bounded window for the first matching, in-phase day.
      for (let i = 0; i <= 371 * interval; i++) {
        const d = addDays(start, i);
        if (!wanted.includes(getDay(d))) continue;
        const weeks = differenceInCalendarWeeks(d, anchor, { weekStartsOn: 1 });
        if (weeks >= 0 && weeks % interval === 0) {
          result = d;
          break;
        }
      }
      break;
    }
    case "monthly": {
      const day = rule.day_of_month ?? getDate(anchor);
      const anchorFirst = startOfMonth(anchor);
      const monthDiff =
        (start.getFullYear() - anchor.getFullYear()) * 12 +
        (start.getMonth() - anchor.getMonth());
      let n = Math.max(0, Math.floor(monthDiff / interval));
      for (let k = 0; k < 600; k++) {
        const cand = clampedDate(addMonths(anchorFirst, n * interval), day);
        if (differenceInCalendarDays(cand, start) >= 0) {
          result = cand;
          break;
        }
        n++;
      }
      break;
    }
    case "yearly": {
      const yearDiff = start.getFullYear() - anchor.getFullYear();
      let n = Math.max(0, yearDiff);
      for (let k = 0; k < 200; k++) {
        const y = addYears(anchor, n * interval);
        const cand = clampedDate(startOfMonth(y), getDate(anchor));
        if (differenceInCalendarDays(cand, start) >= 0) {
          result = cand;
          break;
        }
        n++;
      }
      break;
    }
  }

  if (!result) return null;
  if (rule.ends_at && differenceInCalendarDays(result, parseISO(rule.ends_at)) > 0) {
    return null;
  }
  return fmt(result);
}

/** All occurrences in [start, end] inclusive. */
export function getOccurrencesBetween(
  rule: RecurrenceRule,
  start: string,
  end: string,
): string[] {
  const out: string[] = [];
  let cursor = start;
  for (let guard = 0; guard < 1000; guard++) {
    const next = getNextOccurrence(rule, cursor);
    if (!next || next > end) break;
    out.push(next);
    cursor = fmt(addDays(parseISO(next), 1));
  }
  return out;
}
