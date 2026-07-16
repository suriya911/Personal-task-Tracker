"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateTask } from "@/lib/actions/tasks";
import { setTaskRecurrence } from "@/lib/actions/recurrence";
import { NotesPanel } from "@/components/tasks/notes-panel";
import { AttachmentsPanel } from "@/components/tasks/attachments-panel";
import { Separator } from "@/components/ui/separator";
import type { Task, TaskPriority, CategoryRow } from "@/types/models";

type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";

interface TaskDialogProps {
  task: Task | null;
  categories: CategoryRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (id: string, patch: Partial<Task>) => void;
}

const NO_CATEGORY = "__none__";

export function TaskDialog({
  task,
  categories,
  open,
  onOpenChange,
  onSaved,
}: TaskDialogProps) {
  const [pending, startTransition] = useTransition();

  // Local form state, re-seeded whenever a different task opens.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [important, setImportant] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(NO_CATEGORY);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [dueTime, setDueTime] = useState<string>("");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [interval, setIntervalValue] = useState(1);
  const [repeatTouched, setRepeatTouched] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed on open / task change without an effect.
  if (task && seededFor !== task.id) {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setImportant(task.is_important);
    setCategoryId(task.category_id ?? NO_CATEGORY);
    setDueDate(task.due_date);
    setDueTime(task.due_time?.slice(0, 5) ?? "");
    setRepeat(task.recurrence?.frequency ?? "none");
    setIntervalValue(task.recurrence?.interval ?? 1);
    setRepeatTouched(false);
    setSeededFor(task.id);
  }

  const unitLabel = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[
    repeat === "none" ? "daily" : repeat
  ];

  function save() {
    if (!task) return;
    const t = title.trim();
    if (!t) {
      toast.error("Title required");
      return;
    }
    const patch: Partial<Task> = {
      title: t,
      description: description.trim() || null,
      priority,
      is_important: important,
      category_id: categoryId === NO_CATEGORY ? null : categoryId,
      due_date: dueDate,
      due_time: dueTime ? `${dueTime}:00` : null,
      category:
        categoryId === NO_CATEGORY
          ? null
          : (categories.find((c) => c.id === categoryId) ?? null),
    };

    startTransition(async () => {
      onSaved(task.id, patch);
      onOpenChange(false);
      const res = await updateTask({
        id: task.id,
        title: t,
        description: patch.description,
        priority,
        is_important: important,
        category_id: patch.category_id,
        due_date: dueDate,
        due_time: patch.due_time,
      });
      if (!res.ok) toast.error(res.error);

      if (repeatTouched) {
        const rr = await setTaskRecurrence(
          task.id,
          repeat === "none" ? null : repeat,
          interval,
        );
        if (!rr.ok) toast.error(rr.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Notes</Label>
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {dueDate ? format(parseISO(dueDate), "MMM d, yyyy") : "None"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? parseISO(dueDate) : undefined}
                    onSelect={(d) =>
                      setDueDate(d ? format(d, "yyyy-MM-dd") : null)
                    }
                    autoFocus
                  />
                  {dueDate && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDueDate(null)}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-time">Time</Label>
              <Input
                id="t-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={!dueDate}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <Select
              value={repeat}
              onValueChange={(v) => {
                setRepeat(v as Repeat);
                setRepeatTouched(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {repeat !== "none" && (
              <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                <span>Every</span>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={interval}
                  onChange={(e) => {
                    setIntervalValue(Math.max(1, Number(e.target.value) || 1));
                    setRepeatTouched(true);
                  }}
                  className="h-8 w-16 text-center"
                />
                <span>
                  {unitLabel}
                  {interval > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant={important ? "default" : "outline"}
            onClick={() => setImportant((v) => !v)}
            className="w-full"
          >
            <Star
              className={cn("size-4", important && "fill-current")}
            />
            {important ? "Important" : "Mark important"}
          </Button>

          {task && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <NotesPanel taskId={task.id} />
              </div>
              <div className="space-y-1.5">
                <Label>Attachments</Label>
                <AttachmentsPanel taskId={task.id} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
