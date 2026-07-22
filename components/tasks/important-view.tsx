"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskListCard } from "@/components/tasks/task-list-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  toggleComplete,
  deleteTask,
  postponeTask,
  restorePostpone,
} from "@/lib/actions/tasks";
import { taskComparator } from "@/lib/tasks";
import type { Task, CategoryRow } from "@/types/models";

type Snapshot = {
  due_date: string | null;
  original_due_date: string | null;
  postponed_count: number;
};

type Action =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string }
  | { type: "patch"; id: string; patch: Partial<Task> };

function reducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case "toggle":
      return state.map((t) =>
        t.id === action.id
          ? {
              ...t,
              status: action.done ? "done" : "todo",
              completed_at: action.done ? new Date().toISOString() : null,
            }
          : t,
      );
    case "delete":
      return state.filter((t) => t.id !== action.id);
    case "patch":
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.patch } : t,
      );
  }
}

export function ImportantView({
  initial,
  categories,
}: {
  initial: Task[];
  categories: CategoryRow[];
}) {
  const [optimistic, dispatch] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tasks = optimistic
    .filter((t) => t.is_important && t.status !== "archived")
    .sort(taskComparator);

  function handleToggle(task: Task, checked: boolean) {
    startTransition(async () => {
      dispatch({ type: "toggle", id: task.id, done: checked });
      const res = await toggleComplete(task.id, checked);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handleDelete(task: Task) {
    startTransition(async () => {
      dispatch({ type: "delete", id: task.id });
      const res = await deleteTask(task.id);
      if (res.ok) toast.success("Task deleted");
      else toast.error(res.error);
    });
  }

  function handleEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  function handleSaved(id: string, patch: Partial<Task>) {
    dispatch({ type: "patch", id, patch });
  }

  function handleUndoPostpone(id: string, prev: Snapshot) {
    startTransition(async () => {
      dispatch({ type: "patch", id, patch: prev });
      const res = await restorePostpone(id, prev);
      if (!res.ok) toast.error(res.error);
    });
  }

  function handlePostpone(task: Task) {
    const base = task.due_date ? parseISO(task.due_date) : new Date();
    const nextDue = format(addDays(base, 1), "yyyy-MM-dd");
    startTransition(async () => {
      dispatch({
        type: "patch",
        id: task.id,
        patch: {
          due_date: nextDue,
          postponed_count: task.postponed_count + 1,
          original_due_date:
            task.original_due_date ?? task.due_date ?? nextDue,
        },
      });
      const res = await postponeTask(task.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Moved to tomorrow", {
        action: {
          label: "Undo",
          onClick: () => handleUndoPostpone(task.id, res.prev),
        },
      });
    });
  }

  return (
    <div className="w-full max-w-[720px] space-y-4">
      <header className="flex items-center gap-2">
        <Star className="size-5 fill-amber-400 text-amber-400" />
        <h1 className="text-2xl font-semibold">Important</h1>
        <span className="text-sm tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl border-dashed py-16 text-center">
          <Star className="size-10 text-amber-400/50" />
          <div>
            <p className="font-medium">Nothing starred</p>
            <p className="text-sm text-muted-foreground">
              Star a task to keep it here.
            </p>
          </div>
        </div>
      ) : (
        <TaskListCard>
          <div className="space-y-0.5">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showDueDate
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPostpone={handlePostpone}
              />
            ))}
          </div>
        </TaskListCard>
      )}

      <TaskDialog
        task={editing}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
