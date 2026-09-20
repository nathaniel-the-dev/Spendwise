"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, txValue } from "@/lib/utils";
import type { Transaction } from "@/hooks/use-transactions";

/**
 * SpendingChart — a compact 6-month expenses area chart.
 *
 * Design adapted from the 21st.dev community component
 * "Finance Chart" by @airbnb (https://21st.dev/@airbnb/components/finance-chart),
 * reworked to derive its series from Spendwise transactions and use the
 * app's theme tokens.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SpendingChart({
  transactions,
  className = "",
  currency = "USD",
}: {
  transactions: Transaction[] | undefined;
  className?: string;
  currency?: string;
}) {
  const data = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: MONTHS[d.getMonth()], total: 0 });
    }
    if (!transactions) return buckets;
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      if (d < start) continue;
      const idx =
        (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth();
      if (idx >= 0 && idx < buckets.length) {
        buckets[idx].total += txValue(tx);
      }
    }
    return buckets;
  }, [transactions]);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className={`w-full rounded-2xl border bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Spending</h2>
        <span className="text-xs text-muted-foreground">Last 6 months</span>
      </div>
      {hasData ? (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spend)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--spend)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => formatCurrency(v, currency)}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrency(Number(value), currency), "Spent"]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--spend)"
                strokeWidth={2}
                fill="url(#spendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Add a few expenses and your spending trend will appear here.
        </p>
      )}
    </div>
  );
}
