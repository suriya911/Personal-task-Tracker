import Link from "next/link";
import { CheckCircle2, CalendarDays, BarChart3, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scenery } from "@/components/layout/scenery";
import { HeroIllustration } from "@/components/layout/hero-illustration";

export const metadata = { title: "Task Manager — Nothing slips" };

const HIGHLIGHTS = [
  { icon: Sun, label: "One calm Today list" },
  { icon: CalendarDays, label: "Calendar & scheduling" },
  { icon: BarChart3, label: "Progress statistics" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col">
      <Scenery />

      {/* Top nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5 text-primary" />
          Task Manager
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Plan today.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              Nothing slips.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base md:mx-0">
            A calm place for your tasks — plan today, schedule the rest, and
            watch your progress add up.
          </p>

          <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row md:justify-start sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Get started — it&apos;s free</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 md:justify-start">
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

        <div className="glass-panel rounded-3xl p-3 sm:p-5">
          <HeroIllustration />
        </div>
      </section>

      <p className="relative z-10 pb-6 text-center text-xs text-muted-foreground/70">
        Free & private — your tasks stay yours.
      </p>
    </main>
  );
}
