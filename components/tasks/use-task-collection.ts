"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addDays, format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  toggleComplete,
  deleteTask,
  postponeTask,
  restorePostpone,
} from "@/lib/actions/tasks";
import type { Task } from "@/types/models";

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

/** Shared optimistic task-collection state + mutation handlers. */
export function useTaskCollection(initial: Task[]) {
  const [tasks, dispatch] = useOptimistic(initial, reducer);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function onToggle(task: Task, checked: boolean) {
    startTransition(async () => {
      dispatch({ type: "toggle", id: task.id, done: checked });
      const res = await toggleComplete(task.id, checked);
      if (!res.ok) toast.error(res.error);
    });
  }

  function onDelete(task: Task) {
    startTransition(async () => {
      dispatch({ type: "delete", id: task.id });
      const res = await deleteTask(task.id);
      if (res.ok) toast.success("Task deleted");
      else toast.error(res.error);
    });
  }

  function onEdit(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }

  function onSaved(id: string, patch: Partial<Task>) {
    dispatch({ type: "patch", id, patch });
  }

  function onAdd(task: Task) {
    dispatch({ type: "add", task });
  }

  function undoPostpone(id: string, prev: Snapshot) {
    startTransition(async () => {
      dispatch({ type: "patch", id, patch: prev });
      const res = await restorePostpone(id, prev);
      if (!res.ok) toast.error(res.error);
    });
  }

  function onPostpone(task: Task) {
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
        action: { label: "Undo", onClick: () => undoPostpone(task.id, res.prev) },
      });
    });
  }

  return {
    tasks,
    editing,
    dialogOpen,
    setDialogOpen,
    onToggle,
    onDelete,
    onEdit,
    onPostpone,
    onSaved,
    onAdd,
  };
}
