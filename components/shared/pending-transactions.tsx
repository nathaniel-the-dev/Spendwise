"use client";

import { Clock, Circle } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import { useOutbox } from "@/hooks/use-outbox";
import { useCategories } from "@/hooks/use-categories";
import { useUser } from "@/components/supabase-provider";
import { formatCurrency, formatDate } from "@/lib/utils";

/**
 * Queued offline transaction creates, rendered as muted "pending" rows so the
 * ledger reflects what the user has recorded even before it syncs. These are
 * local-only until <OutboxSync> replays them; the real row (server id) appears
 * above on the next successful fetch, and the pending copy disappears with it.
 */
export function PendingTransactions({ currency = "USD" }: { currency?: string }) {
  const { user } = useUser();
  const { items } = useOutbox(user?.id);
  const { data: categories } = useCategories();

  if (items.length === 0) return null;

  return (
    <ul aria-label="Unsynced transactions">
      {items.map((item) => {
        const cat = categories?.find((c) => c.id === item.payload.categoryId);
        const IconComponent = cat?.icon ? categoryIconMap[cat.icon] ?? Circle : Circle;
        const color = cat?.color ?? "var(--muted-foreground)";
        const isIncome = item.payload.type === "income";
        return (
          <li
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-sm opacity-60 last:border-0 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_8.5rem_2rem]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                aria-hidden="true"
              >
                <IconComponent className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{item.payload.description}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Pending sync
                </span>
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                {cat?.name ?? "Uncategorized"}
              </span>
            </div>
            <div className="hidden text-xs tabular-nums text-muted-foreground sm:block">
              {formatDate(new Date(item.payload.date))}
            </div>
            <div
              className={`col-start-2 text-right text-sm font-medium tabular-nums sm:col-start-4 ${
                isIncome ? "text-emerald-600 dark:text-emerald-400" : ""
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(item.payload.amount, item.payload.currency ?? currency)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
