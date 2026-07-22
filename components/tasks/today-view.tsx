"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addDays, format, parseISO } from "date-fns";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskListCard } from "@/components/tasks/task-list-card";
import { ProgressRing } from "@/components/tasks/progress-ring";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  createTask,
  toggleComplete,
  deleteTask,
  postponeTask,
  restorePostpone,
} from "@/lib/actions/tasks";
import { taskComparator } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Task, CategoryRow } from "@/types/models";

interface TodayViewProps {
  greeting: string;
  today: string; // yyyy-MM-dd
  categories: CategoryRow[];
  initial: { overdue: Task[]; today: Task[]; noDate: Task[] };
}

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

export function TodayView({
  greeting,
  today,
  categories,
  initial,
}: TodayViewProps) {
  const flat = [...initial.overdue, ...initial.today, ...initial.noDate];
  const [optimistic, dispatch] = useOptimistic(flat, reducer);
  const [, startTransition] = useTransition();
  const [overdueOpen, setOverdueOpen] = useState(false);
  const [noDateOpen, setNoDateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Derive sections from the optimistic list.
  const overdue = optimistic
    .filter((t) => t.status === "todo" && t.due_date && t.due_date < today)
    .sort(taskComparator);
  const todaySec = optimistic
    .filter((t) => t.due_date === today && t.status !== "archived")
    .sort(taskComparator);
  const noDate = optimistic
    .filter((t) => t.status === "todo" && !t.due_date)
    .sort(taskComparator);

  const done = todaySec.filter((t) => t.status === "done").length;
  const total = todaySec.length;
  const allEmpty = overdue.length + todaySec.length + noDate.length === 0;

  function handleAdd(title: string) {
    const optimisticTask: Task = {
      id: crypto.randomUUID(),
      user_id: "optimistic",
      category_id: null,
      project_id: null,
      parent_task_id: null,
      recurrence_id: null,
      is_recurrence_template: false,
      title,
      description: null,
      status: "todo",
      priority: "medium",
      is_important: false,
      due_date: today,
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
      const res = await createTask({ title });
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
          original_due_date:
            task.original_due_date ?? task.due_date ?? today,
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
    <div className="w-full max-w-[720px] space-y-6">
      {/* Header: greeting + progress ring */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-2xl font-semibold text-transparent">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Nothing due today."
              : `${done} of ${total} done today.`}
          </p>
        </div>
        {total > 0 && <ProgressRing done={done} total={total} />}
      </header>

      {allEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Collapsible
              title="Overdue"
              count={overdue.length}
              open={overdue.length <= 5 || overdueOpen}
              collapsible={overdue.length > 5}
              onToggle={() => setOverdueOpen((v) => !v)}
              accent="text-rose-400"
            >
              <TaskListCard>
                <TaskRows
                  tasks={overdue}
                  showDueDate
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPostpone={handlePostpone}
                />
              </TaskListCard>
            </Collapsible>
          )}

          {todaySec.length > 0 && (
            <Section title="Today" count={todaySec.length}>
              <TaskListCard>
                <TaskRows
                  tasks={todaySec}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPostpone={handlePostpone}
                />
              </TaskListCard>
            </Section>
          )}

          {noDate.length > 0 && (
            <Collapsible
              title="No due date"
              count={noDate.length}
              open={noDateOpen}
              collapsible
              onToggle={() => setNoDateOpen((v) => !v)}
            >
              <TaskListCard>
                <TaskRows
                  tasks={noDate}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPostpone={handlePostpone}
                />
              </TaskListCard>
            </Collapsible>
          )}
        </div>
      )}

      <TaskDialog
        task={editing}
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />

      <QuickAdd onAdd={handleAdd} />
    </div>
  );
}

function TaskRows({
  tasks,
  showDueDate,
  onToggle,
  onDelete,
  onEdit,
  onPostpone,
}: {
  tasks: Task[];
  showDueDate?: boolean;
  onToggle: (t: Task, done: boolean) => void;
  onDelete: (t: Task) => void;
  onEdit: (t: Task) => void;
  onPostpone: (t: Task) => void;
}) {
  return (
    <div className="space-y-0.5">
      {tasks.map((task, i) => (
        <div
          key={task.id}
          className="animate-in fade-in slide-in-from-bottom-1 duration-150 fill-mode-both motion-reduce:animate-none"
          style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
        >
          <TaskItem
            task={task}
            showDueDate={showDueDate}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onPostpone={onPostpone}
          />
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 flex items-center gap-2 px-3">
        <h2 className={cn("text-xs font-medium uppercase tracking-wide", accent)}>
          {title}
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function Collapsible({
  title,
  count,
  open,
  collapsible,
  onToggle,
  accent,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  collapsible: boolean;
  onToggle: () => void;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={collapsible ? onToggle : undefined}
        className={cn(
          "mb-1 flex w-full items-center gap-2 px-3",
          collapsible && "cursor-pointer",
        )}
        aria-expanded={open}
      >
        <h2 className={cn("text-xs font-medium uppercase tracking-wide", accent)}>
          {title}
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
        {collapsible && (
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>
      {open && children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl border-dashed py-16 text-center">
      <CheckCircle2 className="size-10 text-primary/60" />
      <div>
        <p className="font-medium">All clear</p>
        <p className="text-sm text-muted-foreground">
          Nothing on your plate. Add a task above to get going.
        </p>
      </div>
    </div>
  );
}
