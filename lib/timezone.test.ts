import { describe, it, expect } from "vitest";
import { APP_TIME_ZONE, dayIn, hourIn } from "@/lib/timezone";

describe("dayIn", () => {
  it("formats as yyyy-MM-dd", () => {
    expect(dayIn(new Date("2026-07-30T19:00:00Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("resolves an instant to the calendar day of the given zone", () => {
    // 2026-07-30T01:00:00Z is still Jul 29 in Pacific (PDT = UTC-7).
    const instant = new Date("2026-07-30T01:00:00Z");
    expect(dayIn(instant, "UTC")).toBe("2026-07-30");
    expect(dayIn(instant, "America/Los_Angeles")).toBe("2026-07-29");
    expect(dayIn(instant, "Asia/Kolkata")).toBe("2026-07-30");
  });

  it("is stable across the zone the runtime happens to be in", () => {
    // The regression this guards: a task completed 6pm Pacific must not be
    // credited to the next day just because the server clock is UTC.
    const sixPmPacific = new Date("2026-07-30T01:00:00Z");
    expect(dayIn(sixPmPacific, APP_TIME_ZONE)).toBe("2026-07-29");
  });

  it("tracks daylight saving from the IANA zone name", () => {
    // 03:30Z → Jan is PST (UTC-8) so still the 14th; Jul is PDT (UTC-7),
    // also the 14th — but the winter instant one hour later flips the day.
    expect(dayIn(new Date("2026-01-15T07:30:00Z"), APP_TIME_ZONE)).toBe(
      "2026-01-14",
    );
    expect(dayIn(new Date("2026-07-15T07:30:00Z"), APP_TIME_ZONE)).toBe(
      "2026-07-15",
    );
  });
});

describe("hourIn", () => {
  it("reads the hour in the given zone, not the runtime's", () => {
    const instant = new Date("2026-07-30T01:00:00Z");
    expect(hourIn(instant, "UTC")).toBe(1);
    expect(hourIn(instant, "America/Los_Angeles")).toBe(18);
  });

  it("reports midnight as 0, never 24", () => {
    expect(hourIn(new Date("2026-07-30T07:00:00Z"), APP_TIME_ZONE)).toBe(0);
  });
});
