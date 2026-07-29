import { CheckCircle2, Circle, Flame, ListChecks, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Chrome that makes each panel read as a little app window. */
function Window({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <header className="flex items-center gap-2 border-b border-foreground/10 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
        </span>
        <h2 className="ml-1 text-xs font-medium">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {badge}
          </span>
        )}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export interface HomeTask {
  id: string;
  title: string;
  done: boolean;
  color: string | null;
}

/** Window 1 — what's on today. */
export function TodayWindow({
  tasks,
  total,
  done,
  sample,
}: {
  tasks: HomeTask[];
  total: number;
  done: number;
  sample: boolean;
}) {
  return (
    <Window title="Today" badge={sample ? "Sample" : undefined}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{done}</span>
        <span className="text-sm text-muted-foreground">
          of {total} done today
        </span>
      </div>

      <div
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/15"
        role="meter"
        aria-valuenow={total ? Math.round((done / total) * 100) : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Today's progress"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>

      {tasks.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nothing scheduled for today.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              {t.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/60" />
              )}
              {t.color && (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
              )}
              <span
                className={cn(
                  "truncate",
                  t.done && "text-muted-foreground line-through",
                )}
              >
                {t.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Window>
  );
}

/** Window 2 — the statistics glance. */
export function StatsWindow({
  doneThisWeek,
  delta,
  rate,
  streak,
  daily,
  sample,
}: {
  doneThisWeek: number;
  delta: number;
  rate: number;
  streak: number;
  daily: number[];
  sample: boolean;
}) {
  const max = Math.max(...daily, 1);

  return (
    <Window title="Statistics" badge={sample ? "Sample" : undefined}>
      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={<ListChecks className="size-3" />}
          label="This week"
          value={doneThisWeek}
        />
        <Stat
          icon={<TrendingUp className="size-3" />}
          label="Rate"
          value={`${rate}%`}
        />
        <Stat
          icon={<Flame className="size-3" />}
          label="Streak"
          value={streak}
        />
      </div>

      <p className="mt-4 mb-1.5 text-xs text-muted-foreground">
        Completed per day · last {daily.length} days
        {delta !== 0 && (
          <span className={cn("ml-1", delta > 0 && "text-emerald-500")}>
            ({delta > 0 ? `+${delta}` : delta} vs prior week)
          </span>
        )}
      </p>

      <div className="flex h-20 items-end gap-1">
        {daily.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/80"
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 3 : 1 }}
            title={`${v} done`}
          />
        ))}
      </div>
    </Window>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold">{value}</div>
    </div>
  );
}
