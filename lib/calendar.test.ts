import { describe, it, expect } from "vitest";
import { loadTint, buildMonthGrid } from "@/lib/calendar";

describe("loadTint", () => {
  it("maps count buckets to opacity classes", () => {
    expect(loadTint(0)).toBe("");
    expect(loadTint(1)).toBe("bg-primary/5");
    expect(loadTint(2)).toBe("bg-primary/10");
    expect(loadTint(3)).toBe("bg-primary/[0.13]");
    expect(loadTint(4)).toBe("bg-primary/[0.13]");
    expect(loadTint(6)).toBe("bg-primary/[0.16]");
  });
});

describe("buildMonthGrid", () => {
  it("returns a whole number of weeks", () => {
    const grid = buildMonthGrid("2026-07");
    expect(grid.length % 7).toBe(0);
  });

  it("is Monday-first and includes leading days from the previous month", () => {
    // July 2026 starts on a Wednesday, so the grid leads with Mon Jun 29.
    const grid = buildMonthGrid("2026-07");
    expect(grid[0]).toBe("2026-06-29");
    expect(grid).toContain("2026-07-01");
    expect(grid).toContain("2026-07-31");
  });

  it("handles a month that needs six rows without overflowing", () => {
    // A 31-day month starting on a Sunday spans 6 weeks = 42 cells.
    const grid = buildMonthGrid("2026-03"); // March 2026 starts Sunday
    expect(grid.length).toBe(42);
    expect(grid).toContain("2026-03-31");
  });
});
