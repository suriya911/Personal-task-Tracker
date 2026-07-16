import { describe, it, expect } from "vitest";
import {
  taskComparator,
  formatDayHeader,
  priorityBarClass,
  nextPostpone,
} from "@/lib/tasks";
import type { Task } from "@/types/models";

const task = (over: Partial<Task>): Task =>
  ({
    id: Math.random().toString(),
    user_id: "u",
    category_id: null,
    project_id: null,
    parent_task_id: null,
    recurrence_id: null,
    is_recurrence_template: false,
    title: "t",
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
    position: 0,
    created_at: "",
    updated_at: "",
    category: null,
    ...over,
  }) as Task;

describe("taskComparator", () => {
  it("important beats high priority", () => {
    const important = task({ is_important: true, priority: "low" });
    const highPrio = task({ is_important: false, priority: "high" });
    expect([highPrio, important].sort(taskComparator)[0]).toBe(important);
  });

  it("orders by priority when importance is equal", () => {
    const high = task({ priority: "high" });
    const low = task({ priority: "low" });
    expect([low, high].sort(taskComparator)[0]).toBe(high);
  });

  it("falls back to position", () => {
    const a = task({ position: 1 });
    const b = task({ position: 0 });
    expect([a, b].sort(taskComparator)[0]).toBe(b);
  });
});

describe("formatDayHeader", () => {
  const today = "2026-07-15";
  it("labels the next day Tomorrow", () => {
    expect(formatDayHeader("2026-07-16", today)).toBe("Tomorrow");
  });
  it("uses weekday names within a week", () => {
    expect(formatDayHeader("2026-07-18", today)).toContain("Jul 18");
  });
  it("uses a short absolute format beyond a week", () => {
    expect(formatDayHeader("2026-08-03", today)).toBe("Mon, Aug 3");
  });
});

describe("priorityBarClass", () => {
  it("maps high/medium/low", () => {
    expect(priorityBarClass("high")).toContain("rose");
    expect(priorityBarClass("medium")).toContain("amber");
    expect(priorityBarClass("low")).toBe("bg-transparent");
  });
});

describe("nextPostpone", () => {
  const today = "2026-07-15";

  it("pushes the due date one day and bumps the count", () => {
    const r = nextPostpone(
      { due_date: "2026-07-15", original_due_date: null, postponed_count: 0 },
      today,
    );
    expect(r.due_date).toBe("2026-07-16");
    expect(r.postponed_count).toBe(1);
  });

  it("sets original_due_date once, then never changes it", () => {
    const first = nextPostpone(
      { due_date: "2026-07-15", original_due_date: null, postponed_count: 0 },
      today,
    );
    expect(first.original_due_date).toBe("2026-07-15");

    const second = nextPostpone(first, today);
    expect(second.original_due_date).toBe("2026-07-15"); // unchanged
    expect(second.due_date).toBe("2026-07-17");
    expect(second.postponed_count).toBe(2);
  });

  it("defaults due date to today when the task had none", () => {
    const r = nextPostpone(
      { due_date: null, original_due_date: null, postponed_count: 0 },
      today,
    );
    expect(r.due_date).toBe("2026-07-16");
    expect(r.original_due_date).toBe("2026-07-15");
  });
});
