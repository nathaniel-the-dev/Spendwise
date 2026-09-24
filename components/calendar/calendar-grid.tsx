"use client";

import { cn } from "@/lib/utils";
import { dayKey, isSameDay, type CalendarView } from "@/lib/calendar";
import { CalendarDayCell, type CalendarCategory } from "@/components/calendar/calendar-day-cell";
import type { Transaction } from "@/hooks/use-transactions";

type Props = {
  view: CalendarView;
  /** Anchor date — used to decide which leading/trailing days sit outside the month. */
  cursor: Date;
  days: Date[];
  byDay: Map<string, Transaction[]>;
  matchCountByDay: Map<string, number>;
  matchColorByDay: Map<string, string>;
  categoryById: Map<string, CalendarCategory>;
  activeIds: Set<string>;
  selected: Date;
  today: Date;
  currency: string;
  weekdayLabels: string[];
  onSelectDay: (date: Date) => void;
};

const HEIGHTS: Record<CalendarView, string> = {
  // Below `sm` the cells carry only a day number and count, so they stay short
  // — a tall empty cell would turn the selected-day ring into a hollow box.
  month: "h-12 sm:h-28",
  week: "h-24 sm:h-48",
  // Skeleton-only: the real day view sets its own height on the cell itself.
  day: "min-h-[220px]",
};

/**
 * The day grid. Month and week render as a real table (weekday columns are
 * column headers, not decoration); the single-day view is one full-height cell.
 */
export function CalendarGrid({
  view,
  cursor,
  days,
  byDay,
  matchCountByDay,
  matchColorByDay,
  categoryById,
  activeIds,
  selected,
  today,
  currency,
  weekdayLabels,
  onSelectDay,
}: Props) {
  const inPeriod = (day: Date) =>
    view !== "month" ||
    (day.getMonth() === cursor.getMonth() && day.getFullYear() === cursor.getFullYear());

  const cellFor = (day: Date) => {
    const key = dayKey(day);
    return (
      <CalendarDayCell
        date={day}
        transactions={byDay.get(key) ?? []}
        categoryById={categoryById}
        activeIds={activeIds}
        matchCount={matchCountByDay.get(key) ?? 0}
        matchColor={matchColorByDay.get(key) ?? null}
        inPeriod={inPeriod(day)}
        isToday={isSameDay(day, today)}
        isSelected={isSameDay(day, selected)}
        size={view === "month" ? "compact" : view === "week" ? "comfortable" : "full"}
        currency={currency}
        onSelect={onSelectDay}
      />
    );
  };

  if (view === "day") {
    return cellFor(days[0]);
  }

  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr>
          {weekdayLabels.map((label) => (
            <th
              key={label}
              scope="col"
              className="label-mono border-b border-border px-2 py-2 text-left text-muted-foreground"
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((day, colIndex) => (
              <td
                key={colIndex}
                className={cn(
                  "border-border p-0 align-top",
                  colIndex < row.length - 1 && "border-r",
                  rowIndex < rows.length - 1 && "border-b",
                  HEIGHTS[view]
                )}
              >
                {cellFor(day)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Keeps the grid's shape while the window's transactions load. */
export function CalendarGridSkeleton({ view }: { view: CalendarView }) {
  const cells = view === "day" ? 1 : view === "week" ? 7 : 42;
  return (
    <div
      className={cn(
        "grid gap-px bg-border",
        view === "day" ? "grid-cols-1" : "grid-cols-7"
      )}
      aria-hidden="true"
    >
      {Array.from({ length: cells }, (_, i) => (
        <div key={i} className={cn("animate-pulse bg-card p-2", HEIGHTS[view])}>
          <div className="h-4 w-4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
