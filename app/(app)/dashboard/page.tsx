import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTodayData } from "@/lib/queries/tasks";
import { getStats } from "@/lib/queries/stats";
import {
  StatsWindow,
  TodayWindow,
  type HomeTask,
} from "@/components/home/home-windows";

export const metadata = { title: "Dashboard" };

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowRight className="size-3" />
    </Link>
  );
}

export default async function DashboardPage() {
  const [today, stats] = await Promise.all([getTodayData(), getStats()]);

  const tasks: HomeTask[] = today.today.slice(0, 6).map((t) => ({
    id: t.id,
    title: t.title,
    done: t.status === "done",
    color: t.category?.color ?? null,
  }));
  const done = today.today.filter((t) => t.status === "done").length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
      <div className="w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {today.today.length === 0
              ? "Nothing due today."
              : `${done} of ${today.today.length} done today${
                  today.overdue.length > 0
                    ? ` · ${today.overdue.length} overdue`
                    : ""
                }.`}
          </p>
        </header>

        {/* Two windows: side by side from md up, stacked on phones. */}
        <div className="grid gap-4 md:grid-cols-2">
          <TodayWindow
            tasks={tasks}
            total={today.today.length}
            done={done}
            sample={false}
            action={<OpenLink href="/" label="Open Today" />}
          />
          <StatsWindow
            doneThisWeek={stats.doneThisWeek}
            delta={stats.deltaVsLastWeek}
            rate={Math.round(stats.completionRate * 100)}
            streak={stats.streak}
            daily={stats.daily.map((d) => d.done)}
            sample={false}
            action={<OpenLink href="/stats" label="All stats" />}
          />
        </div>
      </div>
    </main>
  );
}
