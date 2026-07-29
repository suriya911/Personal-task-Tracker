import Link from "next/link";
import { CheckCircle2, CalendarDays, BarChart3, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scenery } from "@/components/layout/scenery";

export const metadata = { title: "Task Manager — Nothing slips" };

const HIGHLIGHTS = [
  { icon: Sun, label: "One calm Today list" },
  { icon: CalendarDays, label: "Calendar & scheduling" },
  { icon: BarChart3, label: "Progress statistics" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col items-center justify-center px-6 py-10">
      <Scenery />

      <div className="glass-panel relative w-full max-w-lg rounded-3xl p-8 text-center sm:p-12">
        <div className="mb-4 inline-flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-6 text-primary" />
          Task Manager
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Nothing slips.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
          A calm place for your tasks — plan today, schedule the rest, and
          watch your progress add up.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Get started</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h.label}
              className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground"
            >
              <h.icon className="size-3.5 text-primary" />
              {h.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-6 text-xs text-muted-foreground/70">
        Free & private — your tasks stay yours.
      </p>
    </main>
  );
}
