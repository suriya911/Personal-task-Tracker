"use client";

import { ViewTransition } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, Repeat, ChevronLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { canPrepone, priorityBarClass } from "@/lib/tasks";
import { RescheduleButton } from "@/components/tasks/reschedule-button";
import type { Task } from "@/types/models";

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task, done: boolean) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  /** Reschedule to an explicit date (null clears it). */
  onReschedule: (task: Task, date: string | null) => void;
  /** Omit to hide the prepone control (Today, where it can never apply). */
  onPrepone?: (task: Task) => void;
  showDueDate?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  onReschedule,
  onPrepone,
  showDueDate,
}: TaskItemProps) {
  const done = task.status === "done";

  return (
    // Naming the row lets the browser tween it from its old slot to its new
    // one when the list re-sorts — so ticking a task visibly slides it down
    // to the finished pile instead of teleporting there.
    // `default="none"` keeps rows out of unrelated transitions — without it
    // every route change would pull each row out of the page's own dissolve.
    <ViewTransition name={`task-${task.id}`} update="task-row" default="none">
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg pl-3 pr-2 py-2.5",
          "transition-colors duration-100 hover:bg-muted/40",
          done && "opacity-50",
        )}
      >
      {/* Priority left-edge bar */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2 bottom-2 w-0.5 rounded-full",
          priorityBarClass(task.priority),
        )}
      />

      <Checkbox
        checked={done}
        onCheckedChange={(v) => onToggle(task, v === true)}
        className="touch-target size-5 shrink-0 transition-transform data-[state=checked]:scale-110 motion-reduce:transition-none"
        aria-label={done ? "Mark not done" : "Mark done"}
      />

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          {task.category && (
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: task.category.color }}
              title={task.category.name}
            />
          )}
          <span
            className={cn(
              "truncate text-sm transition-all duration-200",
              done && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
          {task.recurrence_id && (
            <Repeat
              className="size-3 shrink-0 text-muted-foreground"
              aria-label="Repeats"
            />
          )}
        </div>
        {showDueDate && task.due_date && (
          <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
            {format(parseISO(task.due_date), "MMM d")}
            {task.postponed_count >= 3 && (
              <span className="ml-2 text-muted-foreground/70">
                postponed {task.postponed_count}×
              </span>
            )}
          </span>
        )}
      </button>

      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {/* Pull forward a day. Only meaningful while the task is still ahead
            of today, which is why Scheduled is where this earns its place. */}
        {!done && onPrepone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                disabled={!canPrepone(task.due_date)}
                onClick={() => onPrepone(task)}
                className="touch-target size-8 text-muted-foreground"
                aria-label="Move one day earlier"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canPrepone(task.due_date)
                ? "One day earlier"
                : "Already due today"}
            </TooltipContent>
          </Tooltip>
        )}
        {!done && (
          <RescheduleButton
            dueDate={task.due_date}
            onPick={(d) => onReschedule(task, d)}
          />
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(task)}
          className="touch-target size-8 text-muted-foreground"
          aria-label="Delete task"
        >
          <Trash2 className="size-4" />
        </Button>
        </div>
      </div>
    </ViewTransition>
  );
}
