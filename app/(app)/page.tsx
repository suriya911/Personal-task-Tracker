import { Database, PlugZap } from "lucide-react";
import { getTodayData } from "@/lib/queries/tasks";
import { getCategories } from "@/lib/queries/categories";
import { materializeRecurring } from "@/lib/recurrence-server";
import { todayStr } from "@/lib/tasks";
import { TodayView } from "@/components/tasks/today-view";

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  // Lazily generate any due recurring instances before reading Today.
  await materializeRecurring(todayStr());

  const [data, categories] = await Promise.all([
    getTodayData(),
    getCategories(),
  ]);

  return (
    <main className="relative flex flex-1 flex-col items-center px-6 pt-10 pb-36 sm:pt-16">
      {/* Aurora header glow — signature element */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(263_70%_62%/0.15),transparent)]"
      />

      {data.authed ? (
        <TodayView
          greeting={greetingFor()}
          today={todayStr()}
          categories={categories}
          initial={data}
        />
      ) : (
        <NotConnected />
      )}
    </main>
  );
}

function NotConnected() {
  return (
    <div className="relative flex w-full max-w-[720px] flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <PlugZap className="size-10 text-primary/70" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Today view is ready</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The core loop is built. Add your Supabase credentials to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>{" "}
          and sign in — tasks, quick-add, complete, and the progress ring all
          light up automatically.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="size-3.5" />
        Waiting on <code>NEXT_PUBLIC_SUPABASE_URL</code>
      </div>
    </div>
  );
}
