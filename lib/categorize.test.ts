import { describe, it, expect } from "vitest";
import { categorizeTask } from "@/lib/categorize";

const CATS = [
  { id: "house", name: "Household" },
  { id: "job", name: "Job Search" },
  { id: "bills", name: "Bills" },
  { id: "projects", name: "Projects" },
  { id: "personal", name: "Personal" },
];

describe("categorizeTask", () => {
  it("routes job-hunt tasks to Job Search", () => {
    expect(categorizeTask("apply 20 jobs", CATS)).toBe("job");
    expect(categorizeTask("complete coding assessment for system one", CATS)).toBe(
      "job",
    );
  });

  it("routes chores to Household", () => {
    expect(categorizeTask("do the laundry", CATS)).toBe("house");
  });

  it("routes payments to Bills", () => {
    expect(categorizeTask("pay the electric bill", CATS)).toBe("bills");
  });

  it("routes build work to Projects", () => {
    expect(categorizeTask("refactor the calendar feature", CATS)).toBe("projects");
  });

  it("returns null when nothing matches", () => {
    expect(categorizeTask("xyzzy blorp", CATS)).toBeNull();
  });

  it("matches a custom category by its own name", () => {
    const cats = [{ id: "fit", name: "Fitness" }];
    expect(categorizeTask("Fitness plan for March", cats)).toBe("fit");
  });
});
