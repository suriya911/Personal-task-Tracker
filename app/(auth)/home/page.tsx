import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scenery } from "@/components/layout/scenery";
import {
  StatsWindow,
  TodayWindow,
  type HomeTask,
} from "@/components/home/home-windows";
import { getTodayData } from "@/lib/queries/tasks";
import { getStats } from "@/lib/queries/stats";

export const metadata = { title: "Task Manager — Nothing slips" };

/** Shown to visitors who aren't signed in, so the windows aren't empty. */
const SAMPLE_TASKS: HomeTask[] = [
  { id: "s1", title: "Send the project update", done: true, color: "#3b82f6" },
  { id: "s2", title: "Review interview notes", done: true, color: "#8b5cf6" },
  { id: "s3", title: "Pay electricity bill", done: false, color: "#ef4444" },
  { id: "s4", title: "Gym at 7", done: false, color: "#10b981" },
];
const SAMPLE_DAILY = [2, 4, 1, 5, 3, 6, 4, 2, 5, 7, 3, 4, 6, 5];

export default async function HomePage() {
  const [today, stats] = await Promise.all([getTodayData(), getStats()]);
  const signedIn = today.authed;

  const todayTasks: HomeTask[] = signedIn
    ? today.today.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.title,
        done: t.status === "done",
        color: t.category?.color ?? null,
      }))
    : SAMPLE_TASKS;

  const total = signedIn ? today.today.length : SAMPLE_TASKS.length;
  const doneCount = signedIn
    ? today.today.filter((t) => t.status === "done").length
    : SAMPLE_TASKS.filter((t) => t.done).length;

  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <Scenery />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5 text-primary" />
          Task Manager
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href={signedIn ? "/" : "/login"}>
              {signedIn ? "Open app" : "Get started"}
            </Link>
          </Button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Plan today.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              Nothing slips.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            A calm place for your tasks — plan today, schedule the rest, and
            watch your progress add up.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <TodayWindow
            tasks={todayTasks}
            total={total}
            done={doneCount}
            sample={!signedIn}
          />
          <StatsWindow
            doneThisWeek={signedIn ? stats.doneThisWeek : 31}
            delta={signedIn ? stats.deltaVsLastWeek : 6}
            rate={signedIn ? Math.round(stats.completionRate * 100) : 78}
            streak={signedIn ? stats.streak : 5}
            daily={
              signedIn ? stats.daily.map((d) => d.done) : SAMPLE_DAILY
            }
            sample={!signedIn}
          />
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href={signedIn ? "/" : "/login"}>
              {signedIn ? "Open your tasks" : "Get started — it's free"}
            </Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground/70">
            Free &amp; private — your tasks stay yours.
          </p>
        </div>
      </section>
    </main>
  );
}
