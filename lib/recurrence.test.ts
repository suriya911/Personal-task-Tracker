import { describe, it, expect } from "vitest";
import { parseISO } from "date-fns";
import {
  getNextOccurrence,
  getOccurrencesBetween,
  buildRuleFields,
  type RecurrenceRule,
} from "@/lib/recurrence";

const rule = (over: Partial<RecurrenceRule>): RecurrenceRule => ({
  frequency: "daily",
  interval: 1,
  days_of_week: null,
  day_of_month: null,
  anchor_date: "2026-01-01",
  ends_at: null,
  ...over,
});

describe("getNextOccurrence", () => {
  it("daily returns the same day when from is an occurrence", () => {
    expect(getNextOccurrence(rule({}), "2026-01-05")).toBe("2026-01-05");
  });

  it("daily with interval > 1 lands on the phase", () => {
    const r = rule({ interval: 3, anchor_date: "2026-01-01" });
    // occurrences: Jan 1, 4, 7, 10 …
    expect(getNextOccurrence(r, "2026-01-05")).toBe("2026-01-07");
  });

  it("weekly picks the next matching weekday", () => {
    // 2026-01-01 is a Thursday(4). Rule on Mondays(1).
    const r = rule({ frequency: "weekly", days_of_week: [1] });
    expect(getNextOccurrence(r, "2026-01-01")).toBe("2026-01-05");
  });

  it("weekly with interval 2 skips a week", () => {
    // anchor Thursday 2026-01-01, Thursdays every 2 weeks → Jan 1, 15, 29
    const r = rule({ frequency: "weekly", interval: 2, days_of_week: [4] });
    expect(getNextOccurrence(r, "2026-01-02")).toBe("2026-01-15");
  });

  it("monthly repeats on the day-of-month", () => {
    const r = rule({
      frequency: "monthly",
      day_of_month: 15,
      anchor_date: "2026-01-15",
    });
    expect(getNextOccurrence(r, "2026-02-01")).toBe("2026-02-15");
  });

  it("monthly on the 31st clamps to February's last day", () => {
    const r = rule({
      frequency: "monthly",
      day_of_month: 31,
      anchor_date: "2026-01-31",
    });
    expect(getNextOccurrence(r, "2026-02-01")).toBe("2026-02-28");
  });

  it("yearly repeats on the anchor month/day", () => {
    const r = rule({ frequency: "yearly", anchor_date: "2026-03-10" });
    expect(getNextOccurrence(r, "2026-04-01")).toBe("2027-03-10");
  });

  it("returns null once ends_at has passed", () => {
    const r = rule({ ends_at: "2026-01-03" });
    expect(getNextOccurrence(r, "2026-01-04")).toBeNull();
  });
});

describe("getOccurrencesBetween", () => {
  it("lists daily occurrences in range", () => {
    const r = rule({});
    expect(getOccurrencesBetween(r, "2026-01-01", "2026-01-04")).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("respects ends_at inside the range", () => {
    const r = rule({ ends_at: "2026-01-02" });
    expect(getOccurrencesBetween(r, "2026-01-01", "2026-01-10")).toEqual([
      "2026-01-01",
      "2026-01-02",
    ]);
  });
});

describe("buildRuleFields", () => {
  const anchor = parseISO("2026-07-15"); // a Wednesday, day 15

  it("daily has no weekly/monthly anchoring", () => {
    expect(buildRuleFields("daily", 2, anchor)).toEqual({
      interval: 2,
      days_of_week: null,
      day_of_month: null,
    });
  });

  it("weekly captures the anchor's weekday", () => {
    // 2026-07-15 is a Wednesday → getDay = 3
    expect(buildRuleFields("weekly", 1, anchor).days_of_week).toEqual([3]);
  });

  it("monthly captures the anchor's day-of-month", () => {
    expect(buildRuleFields("monthly", 1, anchor).day_of_month).toBe(15);
  });

  it("clamps interval to at least 1", () => {
    expect(buildRuleFields("daily", 0, anchor).interval).toBe(1);
    expect(buildRuleFields("daily", -5, anchor).interval).toBe(1);
  });
});
