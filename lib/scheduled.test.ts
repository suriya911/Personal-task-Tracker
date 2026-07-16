import { describe, it, expect } from "vitest";
import { groupScheduled } from "@/lib/scheduled";
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

const today = "2026-07-15";

describe("groupScheduled", () => {
  it("groups future tasks by day, ascending, skipping empty days", () => {
    const { days } = groupScheduled(
      [
        task({ due_date: "2026-07-20" }),
        task({ due_date: "2026-07-18" }),
        task({ due_date: "2026-07-18" }),
      ],
      today,
    );
    expect(days.map((d) => d.date)).toEqual(["2026-07-18", "2026-07-20"]);
    expect(days[0].tasks).toHaveLength(2);
    // no "2026-07-19" row exists — empty days are omitted, not blank
    expect(days.some((d) => d.date === "2026-07-19")).toBe(false);
  });

  it("puts undated todo tasks in the noDate bucket", () => {
    const { noDate } = groupScheduled([task({ due_date: null })], today);
    expect(noDate).toHaveLength(1);
  });

  it("excludes today, past, done, and non-todo tasks", () => {
    const { days, noDate } = groupScheduled(
      [
        task({ due_date: today }), // today, not future
        task({ due_date: "2026-07-01" }), // past
        task({ due_date: "2026-07-20", status: "done" }), // done
      ],
      today,
    );
    expect(days).toHaveLength(0);
    expect(noDate).toHaveLength(0);
  });
});
