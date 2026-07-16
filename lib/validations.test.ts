import { describe, it, expect } from "vitest";
import { createTaskSchema } from "@/lib/validations";

describe("createTaskSchema", () => {
  it("rejects an empty title", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a whitespace-only title", () => {
    expect(createTaskSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("accepts a 500-char title", () => {
    const title = "a".repeat(500);
    expect(createTaskSchema.safeParse({ title }).success).toBe(true);
  });

  it("rejects a 501-char title", () => {
    const title = "a".repeat(501);
    expect(createTaskSchema.safeParse({ title }).success).toBe(false);
  });

  it("defaults priority to medium and is_important to false", () => {
    const parsed = createTaskSchema.parse({ title: "hi" });
    expect(parsed.priority).toBe("medium");
    expect(parsed.is_important).toBe(false);
  });

  it("rejects an invalid priority", () => {
    expect(
      createTaskSchema.safeParse({ title: "hi", priority: "urgent" }).success,
    ).toBe(false);
  });
});
