"use client";

import { useOptimistic, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Inbox,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  restorePostpone,
  shiftTaskDue,
  toggleComplete,
} from "@/lib/actions/tasks";
import { canPrepone, shiftDue } from "@/lib/tasks";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { CategoryRow, Task } from "@/types/models";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface PendingTask {
  id: string;
  title: string;
  dueDate: string | null;
  /** "overdue" | "today" | "later" | "none" — drives the due-date chip. */
  bucket: "overdue" | "today" | "later" | "none";
  categoryName: string | null;
  categoryColor: string | null;
  postponedCount: number;
  originalDueDate: string | null;
}

type Snapshot = {
  due_date: string | null;
  original_due_date: string | null;
  postponed_count: number;
};

type Action =
  | { type: "done"; id: string }
  | { type: "postpone"; id: string; dueDate: string }
  | { type: "patch"; id: string; patch: Partial<PendingTask> }
  | { type: "restore"; id: string; task: PendingTask };

function reducer(state: PendingTask[], action: Action): PendingTask[] {
  switch (action.type) {
    case "done":
    case "postpone":
      // Both remove the row from "pending today" — done is finished, a
      // postponed task belongs to tomorrow.
      return state.filter((t) => t.id !== action.id);
    case "patch":
      // Preponing keeps the row (it moves closer, not away), so update in place.
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.patch } : t,
      );
    case "restore":
      return [...state, action.task].sort((a, b) =>
        (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1,
      );
  }
}

const CHIP: Record<PendingTask["bucket"], string> = {
  overdue: "text-destructive",
  today: "text-muted-foreground",
  later: "text-muted-foreground",
  none: "text-muted-foreground",
};

export function PendingTasks({
  initial,
  full,
  categories,
  today,
}: {
  initial: PendingTask[];
  /** Full rows, used only to open the edit dialog for a given id. */
  full: Task[];
  categories: CategoryRow[];
  today: string;
}) {
  const [tasks, dispatch] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function onEdit(id: string) {
    const task = full.find((t) => t.id === id);
    if (!task) return;
    setEditing(task);
    setDialogOpen(true);
  }

  /** Reflect a dialog save in the row without a round trip. */
  function onSaved(id: string, patch: Partial<Task>) {
    dispatch({
      type: "patch",
      id,
      patch: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.due_date !== undefined
          ? {
              dueDate: patch.due_date,
              bucket: !patch.due_date
                ? ("none" as const)
                : patch.due_date < today
                  ? ("overdue" as const)
                  : patch.due_date === today
                    ? ("today" as const)
                    : ("later" as const),
            }
          : {}),
      },
    });
  }

  function markDone(task: PendingTask) {
    startTransition(async () => {
      dispatch({ type: "done", id: task.id });
      const res = await toggleComplete(task.id, true);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Done", {
        action: {
          label: "Undo",
          onClick: () =>
            startTransition(async () => {
              dispatch({ type: "restore", id: task.id, task });
              const undo = await toggleComplete(task.id, false);
              if (!undo.ok) toast.error(undo.error);
            }),
        },
      });
    });
  }

  /** delta +1 pushes the task out a day, -1 pulls it in. */
  function shift(task: PendingTask, delta: 1 | -1) {
    // Same pure helper the server action uses, so the optimistic date matches.
    const next = shiftDue(
      {
        due_date: task.dueDate,
        original_due_date: task.originalDueDate,
        postponed_count: task.postponedCount,
      },
      delta,
      today,
    );

    startTransition(async () => {
      if (delta === 1) {
        dispatch({ type: "postpone", id: task.id, dueDate: next.due_date ?? "" });
      } else {
        // Still pending, just sooner — keep it on screen with fresh dates.
        dispatch({
          type: "patch",
          id: task.id,
          patch: {
            dueDate: next.due_date,
            postponedCount: next.postponed_count,
            originalDueDate: next.original_due_date,
            bucket: next.due_date === today ? "today" : "later",
          },
        });
      }

      const res = await shiftTaskDue(task.id, delta);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(delta === 1 ? "Moved to tomorrow" : "Moved a day earlier", {
        action: { label: "Undo", onClick: () => undoPostpone(task, res.prev) },
      });
    });
  }

  function undoPostpone(task: PendingTask, prev: Snapshot) {
    startTransition(async () => {
      dispatch({ type: "restore", id: task.id, task });
      const res = await restorePostpone(task.id, prev);
      if (!res.ok) toast.error(res.error);
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center gap-2 rounded-2xl border-dashed py-10 text-center">
        <Inbox className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">Nothing pending</p>
        <p className="text-xs text-muted-foreground">
          Everything due is done. Enjoy it.
        </p>
      </div>
    );
  }

  return (
    <>
    <ul className="glass-panel divide-y divide-foreground/5 rounded-2xl">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="group flex items-center gap-3 px-3 py-2.5 sm:px-4"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => markDone(t)}
                aria-label={`Mark "${t.title}" done`}
                className="touch-target shrink-0 text-muted-foreground/60 transition-colors hover:text-primary"
              >
                <Circle className="size-5 group-hover:hidden" />
                <CheckCircle2 className="hidden size-5 group-hover:block" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Mark done</TooltipContent>
          </Tooltip>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{t.title}</p>
            {/* One line, never wrapping mid-phrase: each chip is atomic and
                the overflow is clipped rather than broken across lines. */}
            <p className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-xs whitespace-nowrap">
              {t.categoryName && (
                <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        t.categoryColor ?? "var(--muted-foreground)",
                    }}
                  />
                  <span className="truncate">{t.categoryName}</span>
                </span>
              )}
              <span className={cn("shrink-0", CHIP[t.bucket])}>
                {t.bucket === "overdue"
                  ? `Overdue${t.dueDate ? ` · ${format(parseISO(t.dueDate), "MMM d")}` : ""}`
                  : t.bucket === "today"
                    ? "Today"
                    : t.bucket === "later" && t.dueDate
                      ? format(parseISO(t.dueDate), "EEE, MMM d")
                      : "No due date"}
              </span>
              {t.postponedCount > 0 && (
                <span className="hidden shrink-0 text-muted-foreground/70 sm:inline">
                  · postponed {t.postponedCount}×
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {/* Prepone — disabled once the task is already today or overdue,
                since pulling it further back would only make it late. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canPrepone(t.dueDate, today)}
                  onClick={() => shift(t, -1)}
                  aria-label={`Move "${t.title}" one day earlier`}
                  className="touch-target size-8 text-muted-foreground"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {canPrepone(t.dueDate, today)
                  ? "One day earlier"
                  : "Already due today"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => shift(t, 1)}
                  aria-label={`Move "${t.title}" one day later`}
                  className="touch-target size-8 text-muted-foreground"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>One day later</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(t.id)}
                  aria-label={`Edit "${t.title}"`}
                  className="touch-target size-8 text-muted-foreground"
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit task</TooltipContent>
            </Tooltip>
          </div>
        </li>
      ))}
    </ul>

    <TaskDialog
      task={editing}
      categories={categories}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      onSaved={onSaved}
    />
    </>
  );
}
