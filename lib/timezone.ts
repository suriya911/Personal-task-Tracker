/**
 * The single calendar-day boundary the whole app agrees on.
 *
 * Why this exists: Vercel runs server functions in UTC while the browser runs
 * in the visitor's own zone, so a bare `new Date()` gives two different answers
 * to "what day is it" for 7–8 hours of every day (5pm–midnight Pacific). That
 * put tomorrow's tasks in Today, aged real tasks into "overdue", and credited
 * evening completions to the wrong day in the stats.
 *
 * So every day/hour question routes through here with an *explicit* zone, which
 * behaves identically on the server and in the browser.
 *
 * An IANA zone name — not a fixed offset — so PST↔PDT follows daylight saving
 * on its own. To go per-user later, thread a stored zone through the optional
 * `timeZone` argument; nothing else has to change.
 */
export const APP_TIME_ZONE = "America/Los_Angeles";

// Intl.DateTimeFormat construction is the slow part, so keep them per zone.
const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const hourFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = dayFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dayFormatters.set(timeZone, f);
  }
  return f;
}

function hourFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = hourFormatters.get(timeZone);
  if (!f) {
    // h23 keeps midnight at "00" — hour12:false reports "24" on some ICU builds.
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    });
    hourFormatters.set(timeZone, f);
  }
  return f;
}

/**
 * The calendar day an instant falls on, as `yyyy-MM-dd`.
 * Assembled from parts rather than a locale pattern so the shape is guaranteed.
 */
export function dayIn(instant: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = dayFormatter(timeZone).formatToParts(instant);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** Hour of day (0–23) for an instant in `timeZone`. */
export function hourIn(
  instant: Date = new Date(),
  timeZone: string = APP_TIME_ZONE,
): number {
  return Number(hourFormatter(timeZone).format(instant));
}
