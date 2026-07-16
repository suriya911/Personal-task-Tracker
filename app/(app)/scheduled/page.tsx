import { getScheduledTasks } from "@/lib/queries/tasks";
import { getCategories } from "@/lib/queries/categories";
import { todayStr } from "@/lib/tasks";
import { ScheduledView } from "@/components/scheduled/scheduled-view";

export default async function ScheduledPage() {
  const [data, categories] = await Promise.all([
    getScheduledTasks(),
    getCategories(),
  ]);

  const initial = [...data.days.flatMap((d) => d.tasks), ...data.noDate];

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-10 sm:pt-16">
      <ScheduledView
        initial={initial}
        today={todayStr()}
        categories={categories}
      />
    </main>
  );
}
