/**
 * Calendar grid and date-window math for the dashboard calendar page.
 * Pure, dependency-free helpers so the page component stays about rendering
 * and the day-bucketing rules live in one place.
 */

export type CalendarView = "day" | "week" | "month";

/** Midnight local time — the anchor for every day comparison on the calendar. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Month shift that clamps the day-of-month (31 Jan + 1 month lands on 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const shifted = new Date(date.getFullYear(), date.getMonth() + months, 1);
  shifted.setDate(Math.min(date.getDate(), daysInMonth(shifted)));
  shifted.setHours(0, 0, 0, 0);
  return shifted;
}

/**
 * Local `YYYY-MM-DD` key. Deliberately NOT `toISOString().slice(0, 10)` — that
 * converts to UTC and shifts the day for users behind/ahead of UTC.
 */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Weekday column labels (Sunday-first, matching the app's week convention). */
export function weekdayLabels(locale?: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // 2024-01-07 is a Sunday — a stable reference week.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 7 + i)));
}

/** Sunday-anchored 42-day grid (6 weeks) covering `cursor`'s month. */
export function monthGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(startOfDay(first), -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Sunday-anchored 7 days covering `cursor`'s week. */
export function weekGrid(cursor: Date): Date[] {
  const anchor = startOfDay(cursor);
  const start = addDays(anchor, -anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function viewDays(view: CalendarView, cursor: Date): Date[] {
  if (view === "day") return [startOfDay(cursor)];
  if (view === "week") return weekGrid(cursor);
  return monthGrid(cursor);
}

/** Inclusive query window covering everything the current view can display. */
export function viewRange(view: CalendarView, cursor: Date): { start: Date; end: Date } {
  const days = viewDays(view, cursor);
  return { start: startOfDay(days[0]), end: endOfDay(days[days.length - 1]) };
}

export function shiftCursor(view: CalendarView, cursor: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(cursor, direction);
  if (view === "week") return addDays(cursor, 7 * direction);
  return addMonths(cursor, direction);
}

export function monthLabel(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

/** Human title for the grid header, e.g. "September 2026" or "21 – 27 Sep, 2026". */
export function viewTitle(view: CalendarView, cursor: Date, locale?: string): string {
  if (view === "month") return monthLabel(cursor, locale);
  if (view === "week") {
    const days = weekGrid(cursor);
    const [first, last] = [days[0], days[6]];
    const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format;
    const monthDay = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format;
    const sameMonth = first.getMonth() === last.getMonth();
    const left = sameMonth
      ? `${new Intl.DateTimeFormat(locale, { month: "short" }).format(first)} ${day(first)}`
      : monthDay(first);
    return `${left} – ${monthDay(last)}, ${last.getFullYear()}`;
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(cursor);
}

/** Full weekday + date for the selected-day panel. */
export function dayLabel(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * `#rrggbb` + alpha → `#rrggbbaa`, so a category color can tint a chip without
 * a second palette. Non-hex inputs pass through untouched (renders opaque).
 */
export function withAlpha(hex: string, alpha: number): string {
  if (!HEX.test(hex)) return hex;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}
