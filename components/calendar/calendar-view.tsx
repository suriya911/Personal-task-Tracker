"use client";

import Link from "next/link";
import { useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskCollection } from "@/components/tasks/use-task-collection";
import { loadTint } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { Task, CategoryRow } from "@/types/models";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({
  initial,
  month,
  today,
  prevMonth,
  nextMonth,
  categories,
}: {
  initial: Task[];
  month: string; // yyyy-MM
  today: string;
  prevMonth: string;
  nextMonth: string;
  categories: CategoryRow[];
}) {
  const c = useTaskCollection(initial);
  const [selected, setSelected] = useState<string | null>(null);

  const monthDate = parseISO(`${month}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDate = new Map<string, Task[]>();
  for (const t of c.tasks) {
    if (!t.due_date) continue;
    const arr = byDate.get(t.due_date);
    if (arr) arr.push(t);
    else byDate.set(t.due_date, [t]);
  }

  const monthTotal = c.tasks.length;
  const monthDone = c.tasks.filter((t) => t.status === "done").length;
  const isCurrentMonth = month === today.slice(0, 7);

  const selectedTasks = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="size-8 shrink-0">
            <Link href={`/calendar?m=${prevMonth}`} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="truncate text-center text-base font-semibold tabular-nums sm:min-w-40 sm:text-lg">
            {format(monthDate, "MMMM yyyy")}
          </h1>
          <Button asChild variant="ghost" size="icon" className="size-8 shrink-0">
            <Link href={`/calendar?m=${nextMonth}`} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
            {monthTotal} tasks · {monthDone} done
          </span>
          <Button asChild variant="outline" size="sm" disabled={isCurrentMonth}>
            <Link href="/calendar">Today</Link>
          </Button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const ds = format(day, "yyyy-MM-dd");
          const tasks = byDate.get(ds) ?? [];
          const count = tasks.length;
          const inMonth = isSameMonth(day, monthDate);
          const isToday = ds === today;
          const isSelected = ds === selected;
          const allDone = count > 0 && tasks.every((t) => t.status === "done");
          const overdue =
            ds < today && tasks.some((t) => t.status === "todo");
          const colors = [
            ...new Set(
              tasks.map((t) => t.category?.color).filter(Boolean) as string[],
            ),
          ];

          return (
            <button
              key={ds}
              type="button"
              onClick={() => count > 0 && setSelected(ds)}
              className={cn(
                "relative flex aspect-square flex-col rounded-lg border border-transparent p-1.5 text-left transition-colors",
                loadTint(count),
                count > 0 && "hover:border-border cursor-pointer",
                !inMonth && "opacity-40",
                isToday && "ring-1 ring-primary",
                isSelected && "border-primary",
              )}
            >
              {overdue && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-rose-500" />
              )}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  isToday && "font-semibold text-primary",
                )}
              >
                {format(day, "d")}
              </span>

              {allDone ? (
                <Check className="mt-1 size-3 text-emerald-500" />
              ) : (
                colors.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {colors.slice(0, 3).map((col) => (
                      <span
                        key={col}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                    {colors.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{colors.length - 3}
                      </span>
                    )}
                  </div>
                )
              )}

              {count > 0 && (
                <span className="mt-auto self-end text-[10px] tabular-nums text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected
                ? format(parseISO(selected), "EEEE, MMMM d")
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-0.5 overflow-y-auto px-4 pb-4">
            {selectedTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks this day.
              </p>
            ) : (
              selectedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={c.onToggle}
                  onDelete={c.onDelete}
                  onEdit={c.onEdit}
                  onPostpone={c.onPostpone}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TaskDialog
        task={c.editing}
        categories={categories}
        open={c.dialogOpen}
        onOpenChange={c.setDialogOpen}
        onSaved={c.onSaved}
      />
    </div>
  );
}
