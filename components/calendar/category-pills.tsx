"use client";

import { Circle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { categoryIconMap } from "@/components/category-icon";

export type CategoryOption = {
  /** Category id, or the sentinel `"none"` for uncategorized transactions. */
  id: string;
  name: string;
  color: string;
  icon: string;
  /** Transactions in the visible window for this category. */
  count: number;
  /** Sum of `txValue` over those transactions. */
  total: number;
};

type Props = {
  options: CategoryOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  currency: string;
  className?: string;
};

/**
 * Category toggles as pill buttons. Selecting one or more highlights the days
 * that carry them and dims everything else — the pill's badge is the
 * "how many times" answer for the visible window.
 */
export function CategoryPills({ options, selected, onToggle, onClear, currency, className }: Props) {
  const active = new Set(selected);

  if (options.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        No categorized transactions in this period.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5 lg:flex-col lg:items-stretch", className)}>
      {options.map((option) => {
        const isOn = active.has(option.id);
        const Icon = categoryIconMap[option.icon] ?? Circle;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(option.id)}
            title={`${option.count} transaction${option.count === 1 ? "" : "s"} · ${formatCurrency(option.total, currency)}`}
            className={cn(
              "flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
              "lg:w-full",
              isOn
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: option.color }}
              aria-hidden="true"
            />
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: option.color }} aria-hidden="true" />
            <span className="max-w-[8.5rem] truncate">{option.name}</span>
            <span
              className={cn(
                "ml-auto shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums",
                isOn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150",
            "hover:bg-accent/60 hover:text-foreground",
            "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            "lg:w-full lg:justify-center"
          )}
        >
          Clear {active.size}
        </button>
      )}
    </div>
  );
}
