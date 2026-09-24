"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dayKey } from "@/lib/calendar";

type Props = {
  /** Text on the trigger, e.g. "September 2026". */
  label: string;
  /** The period currently in view. */
  year: number;
  /** 0-based month of the period currently in view. */
  month: number;
  minYear: number;
  maxYear: number;
  /** The currently selected day — what the date field shows. */
  date: Date;
  today: Date;
  locale?: string;
  onSelectMonth: (year: number, month: number) => void;
  onSelectDate: (date: Date) => void;
  className?: string;
};

/**
 * Jump-to-period control for the calendar header: pick a year, click a month —
 * no arrow-clicking back through the timeline. A date field handles the
 * day-precise jump that the week and day views need.
 */
export function MonthPicker({
  label,
  year,
  month,
  minYear,
  maxYear,
  date,
  today,
  locale,
  onSelectMonth,
  onSelectDate,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  // The year being browsed inside the panel, which is not committed until a
  // month is chosen.
  const [panelYear, setPanelYear] = useState(year);

  const years = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, i, 1))
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPanelYear(year);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Change period — currently ${label}`}
          className={cn(
            "inline-flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-sm font-semibold transition-colors duration-150",
            "hover:bg-accent/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-[17.5rem]">
        <Select value={String(panelYear)} onValueChange={(value) => setPanelYear(Number(value))}>
          <SelectTrigger
            className="h-9 w-full rounded-lg text-sm font-semibold"
            aria-label="Select year"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-3 grid grid-cols-3 gap-1">
          {monthNames.map((name, index) => {
            const isCurrent = panelYear === year && index === month;
            const isToday = panelYear === today.getFullYear() && index === today.getMonth();
            return (
              <button
                key={name}
                type="button"
                aria-pressed={isCurrent}
                aria-label={`${name} ${panelYear}`}
                onClick={() => {
                  onSelectMonth(panelYear, index);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-medium transition-colors duration-150",
                  "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : cn("text-foreground hover:bg-accent/70", isToday && "ring-1 ring-primary/40")
                )}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <Label htmlFor="calendar-jump-date" className="text-xs text-muted-foreground">
            Jump to a date
          </Label>
          <Input
            id="calendar-jump-date"
            type="date"
            value={dayKey(date)}
            onChange={(event) => {
              const value = event.target.value;
              if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
              const [y, m, d] = value.split("-").map(Number);
              onSelectDate(new Date(y, m - 1, d));
              setOpen(false);
            }}
            className="mt-1.5 h-9 rounded-lg text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
