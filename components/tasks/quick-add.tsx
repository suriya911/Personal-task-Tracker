"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronUp,
  Loader2,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { ProjectOption } from "@/components/tasks/add-task-dialog";

type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";

const NO_CATEGORY = "__none__";
const NO_PROJECT = "__none__";

export interface QuickAddDraft {
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  is_important: boolean;
  category_id: string | null;
  project_id: string | null;
}

/**
 * The one way to add a task: a glass pill docked above the view slider.
 * Typing a title and pressing Enter is the whole flow; clicking the chevron
 * unfolds the rest of the options *upward*, since the pill is anchored to the
 * bottom of the viewport and a downward panel would run off-screen.
 *
 * `md:pl-64` keeps it centred in the content area (not the whole viewport)
 * once the sidebar appears at md.
 */
export function QuickAdd({
  categories,
  projects = [],
  onOptimistic,
}: {
  categories: CategoryRow[];
  projects?: ProjectOption[];
  /** Lets Today paint the row instantly; the server revalidate reconciles. */
  onOptimistic?: (draft: QuickAddDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [important, setImportant] = useState(false);
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [projectId, setProjectId] = useState(NO_PROJECT);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(`${todayStr()}T00:00:00`),
  );
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("none");

  // "/" focuses quick-add from anywhere; Escape folds the options away.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function resetOptions() {
    setPriority("medium");
    setImportant(false);
    setCategoryId(NO_CATEGORY);
    setProjectId(NO_PROJECT);
    setDueDate(new Date(`${todayStr()}T00:00:00`));
    setDueTime("");
    setRepeat("none");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    const draft: QuickAddDraft = {
      title: t,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      priority,
      is_important: important,
      category_id: categoryId === NO_CATEGORY ? null : categoryId,
      project_id: projectId === NO_PROJECT ? null : projectId,
    };

    // Clear the field immediately — the task is already on its way.
    setTitle("");
    setOpen(false);

    startTransition(async () => {
      onOptimistic?.(draft);

      const res = await createTask({
        ...draft,
        due_time: dueTime || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (repeat !== "none" && res.id) {
        const rec = await setTaskRecurrence(res.id, repeat, 1);
        if (!rec.ok) toast.error(`Added, but repeat failed: ${rec.error}`);
      }
      resetOptions();
    });
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:pl-64">
      <div
        className={cn(
          "glass-panel pointer-events-auto w-full max-w-xl shadow-2xl shadow-black/20",
          // Rounds tight to a pill when closed, softens to a card when the
          // options are showing.
          open ? "rounded-3xl" : "rounded-full",
          "transition-[border-radius] duration-200",
        )}
      >
        {/* Options unfold above the input. Grid rows animate to auto height
            without hard-coding a max-height that would clip on small screens. */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="grid gap-3 px-4 pt-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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

              <div className="space-y-1.5">
                <Label htmlFor="qa-time" className="text-xs">
                  Time
                </Label>
                <Input
                  id="qa-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TaskPriority)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Repeat</Label>
                <Select
                  value={repeat}
                  onValueChange={(v) => setRepeat(v as Repeat)}
                  disabled={!dueDate}
                >
                  <SelectTrigger size="sm" className="w-full">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
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

              {projects.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
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

              <Button
                type="button"
                variant={important ? "default" : "outline"}
                size="sm"
                onClick={() => setImportant((v) => !v)}
                aria-pressed={important}
                className="gap-1.5 sm:col-span-2"
              >
                <Star className={cn("size-4", important && "fill-current")} />
                {important ? "Important" : "Mark important"}
              </Button>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-2 py-1.5 pr-1.5 pl-1.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </span>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…  (press /)"
            aria-label="Add a task"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Hide options" : "Show options"}
            className="touch-target size-8 shrink-0 text-muted-foreground"
          >
            <ChevronUp
              className={cn(
                "size-4 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </Button>
        </form>
      </div>
    </div>
  );
}
