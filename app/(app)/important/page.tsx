import { getImportantTasks } from "@/lib/queries/tasks";
import { getCategories } from "@/lib/queries/categories";
import { ImportantView } from "@/components/tasks/important-view";

export default async function ImportantPage() {
  const [data, categories] = await Promise.all([
    getImportantTasks(),
    getCategories(),
  ]);

  return (
    <main className="relative flex flex-1 flex-col items-center px-6 pb-24 pt-10 sm:pt-16">
      <ImportantView initial={data.tasks} categories={categories} />
    </main>
  );
}
