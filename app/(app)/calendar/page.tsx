import { addMonths, format, parseISO, subMonths } from "date-fns";
import { getMonthTasks } from "@/lib/queries/tasks";
import { getCategories } from "@/lib/queries/categories";
import { todayStr } from "@/lib/tasks";
import { CalendarView } from "@/components/calendar/calendar-view";

function normalizeMonth(m?: string): string {
  if (m && /^\d{4}-\d{2}$/.test(m)) return m;
  return format(new Date(), "yyyy-MM");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const month = normalizeMonth(m);
  const monthDate = parseISO(`${month}-01`);

  const [data, categories] = await Promise.all([
    getMonthTasks(monthDate),
    getCategories(),
  ]);

  const initial = Object.values(data.byDate).flat();

  return (
    <main className="flex flex-1 flex-col px-4 pb-24 pt-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <CalendarView
          initial={initial}
          month={month}
          today={todayStr()}
          prevMonth={format(subMonths(monthDate, 1), "yyyy-MM")}
          nextMonth={format(addMonths(monthDate, 1), "yyyy-MM")}
          categories={categories}
        />
      </div>
    </main>
  );
}
