import { describe, it, expect } from "vitest";
import {
  taskComparator,
  formatDayHeader,
  priorityBarClass,
  nextPostpone,
  shiftDue,
  canPrepone,
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

  it("moves an overdue task to tomorrow, not one day past its stale date", () => {
    const r = nextPostpone(
      { due_date: "2026-07-02", original_due_date: null, postponed_count: 4 },
      today,
    );
    expect(r.due_date).toBe("2026-07-16"); // tomorrow, not 2026-07-03
    expect(r.postponed_count).toBe(5);
    expect(r.original_due_date).toBe("2026-07-02");
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

describe("shiftDue", () => {
  const today = "2026-07-15";

  it("+1 is exactly nextPostpone", () => {
    const s = {
      due_date: "2026-07-20",
      original_due_date: null,
      postponed_count: 2,
    };
    expect(shiftDue(s, 1, today)).toEqual(nextPostpone(s, today));
  });

  it("-1 pulls the task one day earlier", () => {
    const r = shiftDue(
      { due_date: "2026-07-20", original_due_date: null, postponed_count: 0 },
      -1,
      today,
    );
    expect(r.due_date).toBe("2026-07-19");
  });

  it("-1 undoes a postpone: the counter comes back down", () => {
    const r = shiftDue(
      {
        due_date: "2026-07-20",
        original_due_date: "2026-07-17",
        postponed_count: 3,
      },
      -1,
      today,
    );
    expect(r.postponed_count).toBe(2);
    expect(r.original_due_date).toBe("2026-07-17"); // still postponed overall
  });

  it("clears original_due_date once the count returns to zero", () => {
    const r = shiftDue(
      {
        due_date: "2026-07-16",
        original_due_date: "2026-07-15",
        postponed_count: 1,
      },
      -1,
      today,
    );
    expect(r.postponed_count).toBe(0);
    expect(r.original_due_date).toBeNull();
  });

  it("never moves a task into the past", () => {
    const r = shiftDue(
      { due_date: "2026-07-15", original_due_date: null, postponed_count: 0 },
      -1,
      today,
    );
    expect(r.due_date).toBe(today);
  });

  it("postpone then prepone round-trips back to the start", () => {
    const start = {
      due_date: "2026-07-20",
      original_due_date: null,
      postponed_count: 0,
    };
    const there = shiftDue(start, 1, today);
    const back = shiftDue(there, -1, today);
    expect(back.due_date).toBe(start.due_date);
    expect(back.postponed_count).toBe(0);
    expect(back.original_due_date).toBeNull();
  });
});

describe("canPrepone", () => {
  const today = "2026-07-15";

  it("allows pulling forward only while the task is beyond today", () => {
    expect(canPrepone("2026-07-16", today)).toBe(true);
    expect(canPrepone("2026-07-15", today)).toBe(false); // already today
    expect(canPrepone("2026-07-10", today)).toBe(false); // overdue
    expect(canPrepone(null, today)).toBe(false); // no date
  });
});
