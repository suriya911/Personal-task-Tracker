"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskCollection } from "@/components/tasks/use-task-collection";
import { formatDayHeader } from "@/lib/tasks";
import { groupScheduled } from "@/lib/scheduled";
import { cn } from "@/lib/utils";
import type { CategoryRow, Task } from "@/types/models";

export function ScheduledView({
  initial,
  today,
  categories,
}: {
  initial: Task[];
  today: string;
  categories: CategoryRow[];
}) {
  const c = useTaskCollection(initial);
  const [noDateOpen, setNoDateOpen] = useState(false);

  // Re-derive day groups from the (optimistic) list so postpone/complete
  // reflow instantly.
  const { days, noDate } = useMemo(
    () => groupScheduled(c.tasks, today),
    [c.tasks, today],
  );

  const empty = days.length === 0 && noDate.length === 0;

  return (
    <div className="w-full max-w-[720px] space-y-6">
      <h1 className="text-2xl font-semibold">Scheduled</h1>

      {empty ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">Nothing scheduled ahead</p>
          <p className="text-sm text-muted-foreground">
            Future tasks will show up here, grouped by day.
          </p>
        </div>
      ) : (
        <>
          {days.map((group) => (
            <section key={group.date}>
              <div className="sticky top-14 z-10 mb-1 flex items-center gap-2 bg-background/80 py-1.5 backdrop-blur">
                <h2 className="text-sm font-medium">
                  {formatDayHeader(group.date, today)}
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {group.tasks.length}
                </span>
                <div className="ml-2 h-px flex-1 bg-border" />
              </div>
              <div className="space-y-0.5">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={c.onToggle}
                    onDelete={c.onDelete}
                    onEdit={c.onEdit}
                    onPostpone={c.onPostpone}
                  />
                ))}
              </div>
            </section>
          ))}

          {noDate.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setNoDateOpen((v) => !v)}
                className="mb-1 flex w-full items-center gap-2"
                aria-expanded={noDateOpen}
              >
                <h2 className="text-sm font-medium text-muted-foreground">
                  No due date
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {noDate.length}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform",
                    noDateOpen && "rotate-180",
                  )}
                />
              </button>
              {noDateOpen && (
                <div className="space-y-0.5">
                  {noDate.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={c.onToggle}
                      onDelete={c.onDelete}
                      onEdit={c.onEdit}
                      onPostpone={c.onPostpone}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

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
