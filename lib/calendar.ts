import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Cell background tint that scales with task load. Pure — unit-tested. */
export function loadTint(count: number): string {
  if (count <= 0) return "";
  if (count <= 1) return "bg-primary/5";
  if (count <= 2) return "bg-primary/10";
  if (count <= 4) return "bg-primary/[0.13]";
  return "bg-primary/[0.16]";
}

/**
 * All day-cells for a month grid (Monday-first), including the leading/trailing
 * days from adjacent months. Always a whole number of weeks. `month` is `yyyy-MM`.
 */
export function buildMonthGrid(month: string): string[] {
  const m = parseISO(`${month}-01`);
  const start = startOfWeek(startOfMonth(m), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(m), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}
