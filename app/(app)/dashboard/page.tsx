import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTodayData } from "@/lib/queries/tasks";
import { getStats } from "@/lib/queries/stats";
import {
  StatsWindow,
  TodayWindow,
  type HomeTask,
} from "@/components/home/home-windows";
import {
  PendingTasks,
  type PendingTask,
} from "@/components/home/pending-tasks";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { getCategories } from "@/lib/queries/categories";
import { getSidebarData } from "@/lib/queries/sidebar";
import { materializeRecurring } from "@/lib/recurrence-server";
import { todayStr } from "@/lib/tasks";
import { hourIn } from "@/lib/timezone";

export const metadata = { title: "Dashboard" };

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="touch-target flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowRight className="size-3" />
    </Link>
  );
}

export default async function DashboardPage() {
  // Same lazy upkeep as Today, so the dashboard is never a stale view.
  await materializeRecurring(todayStr());

  const [today, stats, categories, sidebar] = await Promise.all([
    getTodayData(),
    getStats(),
    getCategories(),
    getSidebarData(),
  ]);

  const tasks: HomeTask[] = today.today.slice(0, 6).map((t) => ({
    id: t.id,
    title: t.title,
    done: t.status === "done",
    color: t.category?.color ?? null,
  }));
  const done = today.today.filter((t) => t.status === "done").length;

  // Everything still open, overdue first — the actionable queue.
  const stamp = todayStr();
  const pending: PendingTask[] = [
    ...today.overdue,
    ...today.today.filter((t) => t.status !== "done"),
    ...today.noDate,
  ].map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.due_date,
    bucket: !t.due_date
      ? ("none" as const)
      : t.due_date < stamp
        ? ("overdue" as const)
        : t.due_date === stamp
          ? ("today" as const)
          : ("later" as const),
    categoryName: t.category?.name ?? null,
    categoryColor: t.category?.color ?? null,
    postponedCount: t.postponed_count,
    originalDueDate: t.original_due_date,
  }));

  // Zone-aware: this renders on the server, where the clock is UTC.
  const hour = hourIn();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
      <div className="w-full max-w-4xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
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
          </div>
          <AddTaskDialog
            categories={categories}
            projects={sidebar.projects.map((p) => ({ id: p.id, name: p.name }))}
            className="shrink-0"
          />
        </header>

        {/* Two windows: side by side from lg up (below that the sidebar
            leaves too little room), stacked on phones and tablets. */}
        <div className="grid gap-4 lg:grid-cols-2">
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

        {/* Pending queue — check off or push to tomorrow without leaving here. */}
        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-medium">
              Pending
              {pending.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                  {pending.length}
                </span>
              )}
            </h2>
            <OpenLink href="/" label="Open Today" />
          </div>
          <PendingTasks initial={pending} />
        </section>
      </div>
    </main>
  );
}
