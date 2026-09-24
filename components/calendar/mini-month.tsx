"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dayKey, isSameDay, monthGrid, monthLabel } from "@/lib/calendar";

type Props = {
  cursor: Date;
  selected: Date;
  today: Date;
  /** Days in the visible window carrying at least one transaction. */
  daysWithTransactions: Set<string>;
  /** Days carrying at least one transaction from the selected categories. */
  matchingDays: Set<string>;
  dimming: boolean;
  weekdayLabels: string[];
  locale?: string;
  onSelectDay: (date: Date) => void;
  onShiftMonth: (direction: 1 | -1) => void;
  className?: string;
};

/** Compact month navigator — jump months and days without leaving the grid. */
export function MiniMonth({
  cursor,
  selected,
  today,
  daysWithTransactions,
  matchingDays,
  dimming,
  weekdayLabels,
  locale,
  onSelectDay,
  onShiftMonth,
  className,
}: Props) {
  return (
    <div className={cn("rounded-xl border bg-card p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-1">
        <p className="text-xs font-semibold">{monthLabel(cursor, locale)}</p>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onShiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onShiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 justify-items-center">
        {weekdayLabels.map((label) => (
          <span key={label} className="py-1 text-[10px] font-medium text-muted-foreground">
            {label.charAt(0)}
          </span>
        ))}
        {monthGrid(cursor).map((day) => {
          const key = dayKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const hasTx = daysWithTransactions.has(key);
          const matches = dimming && matchingDays.has(key);
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-md text-[11px] tabular-nums transition-colors duration-150",
                "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : cn(
                      matches && "bg-primary/10 font-medium text-foreground",
                      isToday && "font-semibold text-primary ring-1 ring-primary/40",
                      "hover:bg-accent/60"
                    ),
                !inMonth && !isSelected && "text-muted-foreground/40",
                dimming && !matchingDays.has(key) && hasTx && !isSelected && "opacity-40"
              )}
            >
              {day.getDate()}
              {hasTx && (
                <span
                  className={cn(
                    "absolute bottom-[2px] h-1 w-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : matches ? "bg-primary" : "bg-muted-foreground/50"
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
