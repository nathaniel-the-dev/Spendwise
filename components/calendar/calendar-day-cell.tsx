"use client";

import { Circle } from "lucide-react";
import { cn, formatCurrency, txValue } from "@/lib/utils";
import { categoryIconMap } from "@/components/category-icon";
import { withAlpha } from "@/lib/calendar";
import type { Transaction } from "@/hooks/use-transactions";

type Size = "compact" | "comfortable" | "full";

export type CalendarCategory = { name: string; color: string; icon: string };

type Props = {
  date: Date;
  /** Transactions recorded on this day (already scoped to the visible window). */
  transactions: Transaction[];
  categoryById: Map<string, CalendarCategory>;
  /** Selected category ids (`"none"` is the uncategorized sentinel); empty = no filter. */
  activeIds: Set<string>;
  /** How many of this day's transactions match the selected categories. */
  matchCount: number;
  /** Color of the first matching category; tints the whole day when filtering. */
  matchColor: string | null;
  /** False for the leading/trailing days of a month grid. */
  inPeriod: boolean;
  isToday: boolean;
  isSelected: boolean;
  size: Size;
  currency: string;
  onSelect: (date: Date) => void;
};

const MAX_CHIPS: Record<Size, number> = {
  compact: 2,
  comfortable: 5,
  full: Number.POSITIVE_INFINITY,
};

const UNCATEGORIZED = "#6b7280";

/** A single day: its number, a count badge, its transactions, and the day's totals. */
export function CalendarDayCell({
  date,
  transactions,
  categoryById,
  activeIds,
  matchCount,
  matchColor,
  inPeriod,
  isToday,
  isSelected,
  size,
  currency,
  onSelect,
}: Props) {
  const dimming = activeIds.size > 0;
  const wide = size !== "compact";
  const isMatch = (tx: Transaction) => activeIds.has(tx.categoryId ?? "none");

  const visible = [...transactions]
    .sort((a, b) => {
      // While filtering, matching entries must survive the chip cap.
      if (dimming) {
        const am = isMatch(a) ? 1 : 0;
        const bm = isMatch(b) ? 1 : 0;
        if (am !== bm) return bm - am;
      }
      return txValue(b) - txValue(a);
    })
    .slice(0, MAX_CHIPS[size]);
  const hidden = transactions.length - visible.length;

  // While filtering, a day's figures describe the matching transactions only —
  // the same scope as the count badge — so a day total never contradicts the
  // chips beside it.
  const scoped = dimming ? transactions.filter(isMatch) : transactions;
  const out = scoped.reduce((sum, tx) => (tx.type === "expense" ? sum + txValue(tx) : sum), 0);
  const income = scoped.reduce((sum, tx) => (tx.type === "income" ? sum + txValue(tx) : sum), 0);

  const highlighted = dimming && matchCount > 0;
  const displayCount = dimming ? matchCount : transactions.length;

  const label = [
    new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(date),
  ];
  if (transactions.length === 0) {
    label.push("no transactions");
  } else if (dimming) {
    label.push(
      `${matchCount} of ${transactions.length} transaction${transactions.length === 1 ? "" : "s"} match the selected categories`
    );
  } else {
    label.push(`${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`);
  }
  if (out > 0) label.push(`out ${formatCurrency(out, currency)}`);
  if (income > 0) label.push(`in ${formatCurrency(income, currency)}`);

  // Chips and totals are hidden on the narrowest screens in grid views — the
  // day number and count still read, and the day panel below carries detail.
  const detailClass = size === "full" ? "flex" : "hidden sm:flex";

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={isSelected}
      aria-label={label.join(". ")}
      title={label.join(". ")}
      className={cn(
        "group relative flex h-full w-full flex-col gap-1 overflow-hidden p-1.5 text-left transition-colors duration-150 sm:p-2",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        size === "full" && "min-h-[220px]",
        !inPeriod && !highlighted && "bg-muted/30",
        // The tonal step is a per-cell cue; at day-panel scale it would become a
        // full-width wash, so the single-day view keeps a neutral surface and
        // lets the chips and count carry the filter.
        highlighted && size !== "full" && "bg-accent",
        isSelected && "shadow-[inset_0_0_0_2px_var(--primary)]",
        "hover:bg-accent/50"
      )}
      style={
        // A category-colored hairline carries the identity; the fill stays a
        // neutral tonal step so it reads the same in both themes. Selection's
        // 2px ring wins when a day is both highlighted and selected.
        highlighted && !isSelected && matchColor
          ? { boxShadow: `inset 0 0 0 1px ${matchColor}` }
          : undefined
      }
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums",
            isToday
              ? "bg-primary text-primary-foreground"
              : inPeriod
                ? "text-foreground"
                : "text-muted-foreground"
          )}
        >
          {date.getDate()}
        </span>
        {displayCount > 0 && (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums",
              highlighted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <span aria-hidden="true">{displayCount}×</span>
            <span className="sr-only">{displayCount} times</span>
          </span>
        )}
      </span>

      {transactions.length > 0 && (
        <span className={cn(detailClass, "min-w-0 flex-col gap-1")}>
          {visible.map((tx) => {
            const category = tx.categoryId ? categoryById.get(tx.categoryId) : undefined;
            const color = category?.color ?? UNCATEGORIZED;
            const Icon = category ? (categoryIconMap[category.icon] ?? Circle) : Circle;
            const dimmed = dimming && !isMatch(tx);
            return (
              <span
                key={tx.id}
                className={cn(
                  "flex items-center gap-1 overflow-hidden rounded-md px-1 py-0.5 transition-opacity duration-150",
                  dimmed && "opacity-50"
                )}
                style={{ backgroundColor: withAlpha(color, 0.12) }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {wide && <Icon className="h-3 w-3 shrink-0" style={{ color }} aria-hidden="true" />}
                {size === "full" && (
                  <span className="truncate text-[11px] text-muted-foreground">{tx.description}</span>
                )}
                <span
                  className={cn(
                    "ml-auto shrink-0 text-[10px] font-medium tabular-nums",
                    tx.type === "income" ? "text-success" : "text-foreground"
                  )}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {formatCurrency(txValue(tx), currency)}
                </span>
              </span>
            );
          })}
          {hidden > 0 && (
            <span className="pl-1 text-[10px] font-medium text-muted-foreground">+{hidden} more</span>
          )}
        </span>
      )}

      {scoped.length > 1 && (
        <span className={cn(detailClass, "mt-auto items-baseline justify-between gap-1 pt-0.5")}>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-spend">
            {out > 0 ? `−${formatCurrency(out, currency)}` : ""}
          </span>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-success">
            {income > 0 ? `+${formatCurrency(income, currency)}` : ""}
          </span>
        </span>
      )}
    </button>
  );
}
