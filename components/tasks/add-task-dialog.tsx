"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createTask } from "@/lib/actions/tasks";
import { setTaskRecurrence } from "@/lib/actions/recurrence";
import { todayStr } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { CategoryRow, TaskPriority } from "@/types/models";

type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";

const NO_CATEGORY = "__none__";
const NO_PROJECT = "__none__";

export interface ProjectOption {
  id: string;
  name: string;
}

/**
 * "New task" with the full option set — the counterpart to the one-line
 * quick-add. Lives on Today and the dashboard.
 */
export function AddTaskDialog({
  categories,
  projects = [],
  defaultProjectId = null,
  className,
  label = "New task",
}: {
  categories: CategoryRow[];
  projects?: ProjectOption[];
  defaultProjectId?: string | null;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [important, setImportant] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(NO_CATEGORY);
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId ?? NO_PROJECT,
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(`${todayStr()}T00:00:00`),
  );
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("none");

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setImportant(false);
    setCategoryId(NO_CATEGORY);
    setProjectId(defaultProjectId ?? NO_PROJECT);
    setDueDate(new Date(`${todayStr()}T00:00:00`));
    setDueTime("");
    setRepeat("none");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    startTransition(async () => {
      const res = await createTask({
        title: t,
        description: description.trim() || null,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        due_time: dueTime || null,
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
        project_id: projectId === NO_PROJECT ? null : projectId,
        priority,
        is_important: important,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      // Recurrence is a separate rule keyed off the new task.
      if (repeat !== "none" && res.id) {
        const rec = await setTaskRecurrence(res.id, repeat, 1);
        if (!rec.ok) toast.error(`Task added, but repeat failed: ${rec.error}`);
      }

      toast.success("Task added");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className={cn("gap-1.5", className)}>
          <Plus className="size-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Notes</Label>
            <Textarea
              id="new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={2}
              disabled={pending}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Due date */}
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    className={cn(
                      "w-full justify-start font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {dueDate ? format(dueDate, "EEE, MMM d") : "No date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    autoFocus
                  />
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDueDate(undefined)}
                    >
                      Clear date
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <Label htmlFor="new-time">Time</Label>
              <Input
                id="new-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={pending}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Repeat */}
            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <Select
                value={repeat}
                onValueChange={(v) => setRepeat(v as Repeat)}
                disabled={pending || !dueDate}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Auto-detect</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={pending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PROJECT}>None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Important */}
          <Button
            type="button"
            variant={important ? "default" : "outline"}
            size="sm"
            onClick={() => setImportant((v) => !v)}
            disabled={pending}
            className="gap-1.5"
            aria-pressed={important}
          >
            <Star className={cn("size-4", important && "fill-current")} />
            {important ? "Important" : "Mark important"}
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending && <Loader2 className="animate-spin" />}
              Add task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
