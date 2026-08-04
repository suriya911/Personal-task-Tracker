"use client";

import { useState } from "react";
import { addDays, format, nextSaturday, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { todayStr } from "@/lib/tasks";

/**
 * Reschedule a task to any day, not just tomorrow.
 *
 * The old control only ever added a day, which is the wrong move for the case
 * that matters most: an overdue task usually needs pulling to *today*, and
 * pushing it one more day is how a task ends up postponed seven times. Today
 * therefore leads the menu whenever the task is late.
 */
export function RescheduleButton({
  dueDate,
  onPick,
}: {
  /** Current due date, `yyyy-MM-dd`, or null. */
  dueDate: string | null;
  onPick: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = todayStr();
  const overdue = !!dueDate && dueDate < today;

  const choose = (date: string | null) => {
    onPick(date);
    setOpen(false);
  };

  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const now = parseISO(today);

  const options: { label: string; hint: string; date: string | null }[] = [
    { label: "Today", hint: format(now, "EEE d"), date: today },
    {
      label: "Tomorrow",
      hint: format(addDays(now, 1), "EEE d"),
      date: fmt(addDays(now, 1)),
    },
    {
      label: "This weekend",
      hint: format(nextSaturday(now), "EEE d"),
      date: fmt(nextSaturday(now)),
    },
    {
      label: "Next week",
      hint: format(addDays(now, 7), "EEE d"),
      date: fmt(addDays(now, 7)),
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="touch-target size-8 text-muted-foreground"
              aria-label="Reschedule"
            >
              <CalendarClock className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Reschedule</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-56 p-1">
        {overdue && (
          <p className="px-2 pt-1.5 pb-1 text-xs text-muted-foreground">
            Overdue since {format(parseISO(dueDate), "MMM d")}
          </p>
        )}

        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => choose(o.date)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <span>{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}

        <div className="my-1 h-px bg-foreground/10" />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Pick a date…
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate ? parseISO(dueDate) : undefined}
              onSelect={(d) => d && choose(fmt(d))}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {dueDate && (
          <button
            type="button"
            onClick={() => choose(null)}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            No date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
