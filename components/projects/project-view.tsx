"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  createTask,
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
  | { type: "add"; task: Task }
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string }
  | { type: "patch"; id: string; patch: Partial<Task> };

function reducer(state: Task[], action: Action): Task[] {
  switch (action.type) {
    case "add":
      return [action.task, ...state];
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

export function ProjectView({
  projectId,
  initial,
  categories,
}: {
  projectId: string;
  initial: Task[];
  categories: CategoryRow[];
}) {
  const [optimistic, dispatch] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tasks = optimistic
    .filter((t) => t.status !== "archived")
    .sort(taskComparator);
  const done = tasks.filter((t) => t.status === "done").length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      user_id: "optimistic",
      category_id: null,
      project_id: projectId,
      parent_task_id: null,
      recurrence_id: null,
      is_recurrence_template: false,
      title: t,
      description: null,
      status: "todo",
      priority: "medium",
      is_important: false,
      due_date: null,
      due_time: null,
      reminder_at: null,
      postponed_count: 0,
      original_due_date: null,
      completed_at: null,
      position: -Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: null,
    };
    startTransition(async () => {
      dispatch({ type: "add", task: optimisticTask });
      const res = await createTask({ title: t, project_id: projectId, due_date: null });
      if (!res.ok) toast.error(res.error);
    });
  }

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
          original_due_date: task.original_due_date ?? task.due_date ?? nextDue,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {done} / {tasks.length} done
        </span>
      </div>

      <form onSubmit={handleAdd} className="relative">
        <Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task to this project…"
          className="pl-9"
        />
      </form>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No tasks yet. Add one above.
        </p>
      ) : (
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
