"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatsData } from "@/lib/queries/stats";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

type Tip = { x: number; y: number; title: string; value: string } | null;

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-foreground/10 bg-popover/95 px-2 py-1 text-xs shadow-lg backdrop-blur-xl"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <div className="text-muted-foreground">{tip.title}</div>
      <div className="font-medium tabular-nums">{tip.value}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-panel rounded-2xl p-4 sm:p-5", className)}>
      <h2 className="text-sm font-medium">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* KPI tiles                                                           */
/* ------------------------------------------------------------------ */

function StatTile({
  label,
  value,
  sub,
  icon,
  wash,
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  /** Soft radial tint behind the glass, like the reference dashboard cards. */
  wash: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: wash }}
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-1.5 text-3xl font-semibold">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const d = points
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - 4 - (v / max) * (h - 8)).toFixed(1)}`,
    )
    .join(" ");
  const lastX = (points.length - 1) * step;
  const lastY = h - 4 - (points[points.length - 1] / max) * (h - 8);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 h-8 w-full max-w-30"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="4"
        fill="var(--chart-1)"
        stroke="var(--card)"
        strokeWidth="2"
      />
    </svg>
  );
}

function Meter({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  return (
    <div
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Completion rate"
      className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15"
    >
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completions area chart (last 14 days)                               */
/* ------------------------------------------------------------------ */

function CompletionsChart({ daily }: { daily: StatsData["daily"] }) {
  const [tip, setTip] = useState<Tip>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const W = 640;
  const H = 200;
  const PAD = { l: 30, r: 14, t: 10, b: 22 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const { pts, yMax, ticks } = useMemo(() => {
    const rawMax = Math.max(...daily.map((d) => d.done), 1);
    const yMax = rawMax <= 4 ? rawMax + 1 : Math.ceil(rawMax / 2) * 2;
    const step = innerW / (daily.length - 1);
    const pts = daily.map((d, i) => ({
      x: PAD.l + i * step,
      y: PAD.t + innerH - (d.done / yMax) * innerH,
      ...d,
    }));
    const tickCount = Math.min(yMax, 4);
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
      Math.round((yMax / tickCount) * i),
    );
    return { pts, yMax, ticks: [...new Set(ticks)] };
  }, [daily, innerW, innerH, PAD.l, PAD.t]);

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${PAD.t + innerH} L${PAD.l},${PAD.t + innerH} Z`;
  const last = pts[pts.length - 1];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < pts.length; i++)
      if (Math.abs(pts[i].x - xView) < Math.abs(pts[best].x - xView)) best = i;
    const p = pts[best];
    setHoverIdx(best);
    setTip({
      x: (p.x / W) * rect.width,
      y: (p.y / H) * rect.height,
      title: format(new Date(`${p.date}T12:00:00`), "EEE, MMM d"),
      value: `${p.done} done`,
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <Tooltip tip={tip} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Tasks completed per day, last 14 days"
        onMouseMove={onMove}
        onMouseLeave={() => {
          setTip(null);
          setHoverIdx(null);
        }}
      >
        {ticks.map((t) => {
          const y = PAD.t + innerH - (t / yMax) * innerH;
          return (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PAD.l - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {t}
              </text>
            </g>
          );
        })}
        {pts
          .filter((_, i) => i % 3 === 1 || i === pts.length - 1)
          .map((p) => (
            <text
              key={p.date}
              x={p.x}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {format(new Date(`${p.date}T12:00:00`), "MMM d")}
            </text>
          ))}
        <path d={area} fill="var(--chart-1)" opacity="0.1" />
        <path
          d={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoverIdx !== null && (
          <line
            x1={pts[hoverIdx].x}
            x2={pts[hoverIdx].x}
            y1={PAD.t}
            y2={PAD.t + innerH}
            stroke="var(--muted-foreground)"
            strokeWidth="1"
            opacity="0.4"
          />
        )}
        {hoverIdx !== null && (
          <circle
            cx={pts[hoverIdx].x}
            cy={pts[hoverIdx].y}
            r="4"
            fill="var(--chart-1)"
            stroke="var(--card)"
            strokeWidth="2"
          />
        )}
        <circle
          cx={last.x}
          cy={last.y}
          r="4"
          fill="var(--chart-1)"
          stroke="var(--card)"
          strokeWidth="2"
        />
        <text
          x={last.x}
          y={last.y - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize="11"
          fontWeight="600"
        >
          {last.done}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Open tasks by category — horizontal bars                            */
/* ------------------------------------------------------------------ */

function CategoryBars({ slices }: { slices: StatsData["byCategory"] }) {
  const max = Math.max(...slices.map((s) => s.open), 1);
  return (
    <div className="space-y-2.5">
      {slices.map((s) => (
        <div
          key={s.name}
          className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2"
          title={`${s.name}: ${s.open} open`}
        >
          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color ?? "var(--muted-foreground)" }}
            />
            {s.name}
          </span>
          <div className="h-4">
            <div
              className="h-full rounded-r bg-[var(--chart-1)] transition-[width]"
              style={{ width: `${(s.open / max) * 100}%`, minWidth: 3 }}
            />
          </div>
          <span className="text-right text-xs tabular-nums">{s.open}</span>
        </div>
      ))}
      {slices.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No open tasks — nice.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completions by weekday — columns                                    */
/* ------------------------------------------------------------------ */

function WeekdayColumns({ byWeekday }: { byWeekday: StatsData["byWeekday"] }) {
  const [tip, setTip] = useState<Tip>(null);
  const max = Math.max(...byWeekday.map((d) => d.done), 1);
  const maxIdx = byWeekday.findIndex((d) => d.done === max);

  return (
    <div className="relative">
      <Tooltip tip={tip} />
      <div className="flex h-36 items-end justify-between gap-2 border-b border-border pb-0">
        {byWeekday.map((d, i) => (
          <div
            key={d.label}
            className="group flex h-full w-full max-w-10 flex-col items-center justify-end"
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              const parent = el.offsetParent as HTMLElement;
              setTip({
                x: el.offsetLeft + el.offsetWidth / 2 - (parent?.offsetLeft ?? 0),
                y: el.offsetTop + (1 - d.done / max) * el.offsetHeight,
                title: d.label,
                value: `${d.done} done`,
              });
            }}
            onMouseLeave={() => setTip(null)}
          >
            {i === maxIdx && d.done > 0 && (
              <span className="mb-1 text-[11px] font-semibold">{d.done}</span>
            )}
            <div
              className="w-full rounded-t bg-[var(--chart-1)] transition-opacity group-hover:opacity-80"
              style={{
                height: `${(d.done / max) * 100}%`,
                minHeight: d.done > 0 ? 3 : 0,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        {byWeekday.map((d) => (
          <span
            key={d.label}
            className="w-full max-w-10 text-center text-[10px] text-muted-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function StatsView({ data }: { data: StatsData }) {
  const delta = data.deltaVsLastWeek;
  const rate = Math.round(data.completionRate * 100);

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Statistics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How your tasks are moving.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Done this week"
          value={data.doneThisWeek}
          icon={<CheckCircle2 className="size-3.5" />}
          wash="radial-gradient(120% 90% at 20% 0%, hsl(263 70% 62% / 0.14), transparent 60%)"
          sub={
            <span
              className={cn(
                "inline-flex items-center gap-1",
                delta > 0 && "text-emerald-500",
                delta < 0 && "text-muted-foreground",
              )}
            >
              {delta >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {delta >= 0 ? `+${delta}` : delta} vs last week
            </span>
          }
        >
          <Sparkline points={data.daily.map((d) => d.done)} />
        </StatTile>

        <StatTile
          label="Completion rate"
          value={`${rate}%`}
          wash="radial-gradient(120% 90% at 80% 0%, hsl(217 91% 60% / 0.13), transparent 60%)"
          sub="done ÷ all tasks, last 30 days"
        >
          <Meter ratio={data.completionRate} />
        </StatTile>

        <StatTile
          label="Overdue"
          value={data.overdue}
          icon={
            <AlertTriangle
              className={cn(
                "size-3.5",
                data.overdue > 0 && "text-destructive",
              )}
            />
          }
          wash="radial-gradient(120% 90% at 20% 0%, hsl(0 72% 55% / 0.10), transparent 60%)"
          sub={data.overdue > 0 ? "needs attention" : "all clear"}
        />

        <StatTile
          label="Streak"
          value={data.streak}
          icon={<Flame className="size-3.5 text-amber-500" />}
          wash="radial-gradient(120% 90% at 80% 0%, hsl(38 92% 55% / 0.12), transparent 60%)"
          sub={data.streak === 1 ? "day with tasks done" : "days with tasks done"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <ChartCard
          title="Completions"
          subtitle="Tasks finished per day, last 14 days"
          className="lg:col-span-3"
        >
          <CompletionsChart daily={data.daily} />
        </ChartCard>

        <ChartCard
          title="Open tasks by category"
          subtitle={`${data.openCount} open in total`}
          className="lg:col-span-2"
        >
          <CategoryBars slices={data.byCategory} />
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard
          title="Busiest weekdays"
          subtitle="Completions by weekday, last 8 weeks"
        >
          <WeekdayColumns byWeekday={data.byWeekday} />
        </ChartCard>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View as table
        </summary>
        <div className="glass-panel mt-2 overflow-x-auto rounded-2xl p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 pr-4 font-medium">Day</th>
                <th className="py-1 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((d) => (
                <tr key={d.date} className="border-t border-border/50">
                  <td className="py-1 pr-4">
                    {format(new Date(`${d.date}T12:00:00`), "EEE, MMM d")}
                  </td>
                  <td className="py-1 tabular-nums">{d.done}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
