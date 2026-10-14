// "Today" means the shop's calendar day in India (IST, UTC+5:30, no DST),
// regardless of the server's timezone.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC instants for the start (inclusive) and end (exclusive) of the IST day containing `now`. */
export function istDayRange(now: Date = new Date()): { start: Date; end: Date } {
  const istNow = now.getTime() + IST_OFFSET_MS;
  const istMidnight = istNow - (((istNow % DAY_MS) + DAY_MS) % DAY_MS);
  const start = new Date(istMidnight - IST_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** e.g. "14 Oct 2026, 5:01 pm" (IST). */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

/** e.g. "Wednesday, 14 October 2026" (IST). */
export function formatLongDate(date: Date): string {
  return dateFormatter.format(date);
}
