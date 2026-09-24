"use client";

import Link from "next/link";
import { ArrowRight, Circle } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isForeignCurrency } from "@/lib/fx";
import type { Transaction } from "@/hooks/use-transactions";

/**
 * TransactionList — a compact, card-style list of recent transactions.
 *
 * Design adapted from the 21st.dev community component
 * "Transaction List" by @hari (https://21st.dev/@hari/components/transaction-list),
 * reworked to render Spendwise's real `Transaction` data with the app's
 * category icons, currency formatting, and theme tokens.
 */

type TransactionItem = {
  id: string;
  name: string;
  type: string;
  amount: number;
  /** The entry's own currency — foreign rows keep their original amount. */
  currency: string;
  amountInPreferred: number | null;
  date: string;
  iconKey: string | null;
  color: string | null;
};

function toItems(transactions: Transaction[]): TransactionItem[] {
  return transactions.map((tx) => ({
    id: tx.id,
    name: tx.description,
    type: tx.category?.name ?? "Uncategorized",
    amount: tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    currency: tx.currency,
    amountInPreferred: tx.amountInPreferred,
    date: tx.date,
    iconKey: tx.category?.icon ?? null,
    color: tx.category?.color ?? null,
  }));
}

export function TransactionList({
  transactions,
  currency = "USD",
  viewAllHref = "/dashboard/transactions",
  className = "",
}: {
  transactions: Transaction[];
  currency?: string;
  viewAllHref?: string;
  className?: string;
}) {
  const items = toItems(transactions);

  return (
    <div
      className={`w-full rounded-2xl border bg-card p-5 shadow-sm ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
        Transactions
      </h2>

      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.iconKey
            ? categoryIconMap[item.iconKey] ?? Circle
            : Circle;
          const isExpense = item.amount < 0;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${item.color ?? "var(--muted-foreground)"} 12%, transparent)`, color: item.color ?? "var(--muted-foreground)" }}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.type} &middot; {formatDate(new Date(item.date))}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  isExpense ? "" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isExpense ? "-" : "+"}
                {formatCurrency(Math.abs(item.amount), item.currency ?? currency)}
                {isForeignCurrency(item.currency, currency) && item.amountInPreferred != null && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ≈ {formatCurrency(item.amountInPreferred, currency)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            No transactions yet.
          </li>
        )}
      </ul>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/70"
        >
          All Transactions
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
