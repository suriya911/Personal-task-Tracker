"use client";

import { useOptimistic, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock, CheckCircle2, Circle, Inbox } from "lucide-react";
import { toast } from "sonner";
import {
  postponeTask,
  restorePostpone,
  toggleComplete,
} from "@/lib/actions/tasks";
import { nextPostpone } from "@/lib/tasks";
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
  | { type: "restore"; id: string; task: PendingTask };

function reducer(state: PendingTask[], action: Action): PendingTask[] {
  switch (action.type) {
    case "done":
    case "postpone":
      // Both remove the row from "pending today" — done is finished, a
      // postponed task belongs to tomorrow.
      return state.filter((t) => t.id !== action.id);
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

export function PendingTasks({ initial }: { initial: PendingTask[] }) {
  const [tasks, dispatch] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();

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

  function postpone(task: PendingTask) {
    // Same pure helper the server action uses, so the optimistic date matches.
    const next = nextPostpone({
      due_date: task.dueDate,
      original_due_date: task.originalDueDate,
      postponed_count: task.postponedCount,
    });

    startTransition(async () => {
      dispatch({
        type: "postpone",
        id: task.id,
        dueDate: next.due_date ?? "",
      });
      const res = await postponeTask(task.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Moved to tomorrow", {
        action: {
          label: "Undo",
          onClick: () => undoPostpone(task, res.prev),
        },
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
                className="text-muted-foreground/60 transition-colors hover:text-primary"
              >
                <Circle className="size-5 group-hover:hidden" />
                <CheckCircle2 className="hidden size-5 group-hover:block" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Mark done</TooltipContent>
          </Tooltip>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{t.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs">
              {t.categoryName && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        t.categoryColor ?? "var(--muted-foreground)",
                    }}
                  />
                  {t.categoryName}
                </span>
              )}
              <span className={cn(CHIP[t.bucket])}>
                {t.bucket === "overdue"
                  ? `Overdue${t.dueDate ? ` · ${format(parseISO(t.dueDate), "MMM d")}` : ""}`
                  : t.bucket === "today"
                    ? "Today"
                    : t.bucket === "later" && t.dueDate
                      ? format(parseISO(t.dueDate), "EEE, MMM d")
                      : "No due date"}
              </span>
              {t.postponedCount > 0 && (
                <span className="text-muted-foreground/70">
                  · postponed {t.postponedCount}×
                </span>
              )}
            </p>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => postpone(t)}
                aria-label={`Postpone "${t.title}" to tomorrow`}
                className="size-8 shrink-0 text-muted-foreground"
              >
                <CalendarClock className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Postpone to tomorrow</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
