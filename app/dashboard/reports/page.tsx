"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileDown, CalendarDays, LayoutGrid, Inbox, Circle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, txValue } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useSettings } from "@/hooks/use-settings";
import { ErrorState } from "@/components/shared/error-state";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Receipt, TrendingUp, Trophy, ArrowUpRight, Lightbulb } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import type { ReportPdfData } from "@/components/shared/report-types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type RangeKey = "this-month" | "last-month" | "last-3" | "last-6" | "year" | "all" | "custom";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3", label: "Last 3 Months" },
  { value: "last-6", label: "Last 6 Months" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

function rangeBounds(key: RangeKey, from: string, to: string): { start: Date | null; end: Date | null; label: string } {
  const now = new Date();
  const monthOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  switch (key) {
    case "this-month": {
      const s = monthOf(now);
      return { start: s, end: null, label: `${MONTHS[s.getMonth()]} ${s.getFullYear()}` };
    }
    case "last-month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e, label: `${MONTHS[s.getMonth()]} ${s.getFullYear()}` };
    }
    case "last-3": {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: s, end: null, label: `${MONTHS[s.getMonth()]} ${s.getFullYear()} – ${MONTHS[now.getMonth()]} ${now.getFullYear()}` };
    }
    case "last-6": {
      const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { start: s, end: null, label: `${MONTHS[s.getMonth()]} ${s.getFullYear()} – ${MONTHS[now.getMonth()]} ${now.getFullYear()}` };
    }
    case "year": {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: s, end: null, label: `${now.getFullYear()}` };
    }
    case "all":
      return { start: null, end: null, label: "All time" };
    case "custom": {
      const s = from ? new Date(from) : null;
      const e = to ? new Date(`${to}T23:59:59`) : null;
      const fmt = (d: Date | null) => (d ? d.toLocaleDateString("en", { month: "short", year: "numeric" }) : "…");
      return { start: s, end: e, label: `${fmt(s)} – ${fmt(e)}` };
    }
  }
}

export default function ReportsPage() {
  const { data: transactions, isLoading, isError, refetch } = useTransactions({ limit: 500 });
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";

  const [range, setRange] = useState<RangeKey>("last-6");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const bounds = useMemo(() => rangeBounds(range, customFrom, customTo), [range, customFrom, customTo]);

  const {
    categoryData,
    monthlyData,
    topCategory,
    totalExpenses,
    totalIncome,
    avgDaily,
    largestExpense,
    narrative,
    txCount,
  } = useMemo(() => {
    const empty = {
      categoryData: [] as { name: string; color: string; value: number; icon: typeof Circle }[],
      monthlyData: [] as { month: string; value: number }[],
      topCategory: "N/A",
      totalExpenses: 0,
      totalIncome: 0,
      avgDaily: 0,
      largestExpense: { description: "N/A", amount: 0 },
      narrative: [] as string[],
      txCount: 0,
    };
    if (!transactions) return empty;

    const inRange = transactions.filter((t) => {
      const d = new Date(t.date);
      if (bounds.start && d < bounds.start) return false;
      if (bounds.end && d > bounds.end) return false;
      return true;
    });

    const expenses = inRange.filter((t) => t.type === "expense");
    const income = inRange.filter((t) => t.type === "income");
    const totalExp = expenses.reduce((s, t) => s + txValue(t), 0);
    const totalInc = income.reduce((s, t) => s + txValue(t), 0);

    const catMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

    const byCategory = new Map<string, number>();
    for (const tx of expenses) {
      const catId = tx.categoryId ?? "uncategorized";
      byCategory.set(catId, (byCategory.get(catId) ?? 0) + txValue(tx));
    }

    const catData = Array.from(byCategory.entries())
      .map(([id, amount]) => {
        const cat = id !== "uncategorized" ? catMap.get(id) : undefined;
        const ico = cat?.icon ? (categoryIconMap[cat.icon] ?? Circle) : Circle;
        return {
          name: id === "uncategorized" ? "Uncategorized" : (cat?.name ?? "Unknown"),
          icon: ico,
          color: cat?.color ?? "#6b7280",
          value: amount,
        };
      })
      .sort((a, b) => b.value - a.value);

    const topC = catData[0];

    // Monthly buckets span the (clamped) effective window so the trend chart
    // matches whatever period is selected.
    const now = new Date();
    const effStart = bounds.start ?? new Date(Math.min(...expenses.map((e) => new Date(e.date).getTime()), now.getTime()));
    const effEnd = bounds.end ?? now;
    const byMonth = new Map<string, number>();
    for (const tx of expenses) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + txValue(tx));
    }
    const monthData: { month: string; value: number }[] = [];
    const spanMonths = Math.min(
      18,
      Math.max(1, (effEnd.getFullYear() - effStart.getFullYear()) * 12 + effEnd.getMonth() - effStart.getMonth() + 1)
    );
    for (let i = spanMonths - 1; i >= 0; i--) {
      const m = new Date(effEnd.getFullYear(), effEnd.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${m.getMonth()}`;
      monthData.push({ month: MONTHS[m.getMonth()], value: byMonth.get(key) ?? 0 });
    }

    const largest = expenses.length > 0
      ? expenses.reduce((max, tx) => (txValue(tx) > txValue(max) ? tx : max), expenses[0])
      : null;

    const days = Math.max(
      1,
      Math.ceil((effEnd.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    const avg = expenses.length > 0 ? totalExp / days : 0;

    const narr: string[] = [];
    if (totalExp > 0 && catData.length > 0) {
      narr.push(`You spent ${formatCurrency(totalExp, preferredCurrency)} across ${catData.length} categories in ${bounds.label.toLowerCase()}.`);
      if (topC) narr.push(`Your biggest expense category was "${topC.name}" at ${formatCurrency(topC.value, preferredCurrency)} — ${((topC.value / totalExp) * 100).toFixed(0)}% of all spending.`);
      if (totalInc > 0) {
        const rate = ((totalInc - totalExp) / totalInc) * 100;
        narr.push(rate >= 0
          ? `You're saving ${rate.toFixed(0)}% of your income. Keep it up!`
          : `You're spending ${Math.abs(rate).toFixed(0)}% more than you earn. Time to review.`);
      }
      if (largest) narr.push(`Your single largest expense was ${formatCurrency(txValue(largest), preferredCurrency)} — "${largest.description}".`);
      narr.push(`Daily average spending: ${formatCurrency(avg, preferredCurrency)}.`);
    } else {
      narr.push("No expense data in this period. Try widening the date range.");
    }

    return {
      categoryData: catData,
      monthlyData: monthData,
      topCategory: topC?.name ?? "N/A",
      totalExpenses: totalExp,
      totalIncome: totalInc,
      avgDaily: avg,
      largestExpense: { description: largest?.description ?? "N/A", amount: largest ? txValue(largest) : 0 },
      narrative: narr,
      txCount: inRange.length,
    };
  }, [transactions, categories, bounds, preferredCurrency]);

  const insightCards = [
    { label: "Total Spent", value: formatCurrency(totalExpenses, preferredCurrency), icon: Receipt, color: "text-foreground", bg: "bg-muted" },
    { label: "Average Daily", value: formatCurrency(avgDaily, preferredCurrency), icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Top Category", value: topCategory, icon: Trophy, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Largest Expense", value: formatCurrency(largestExpense.amount, preferredCurrency), icon: ArrowUpRight, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  async function handleExport() {
    setExporting(true);
    try {
      const { exportReportPdf } = await import("@/lib/report-pdf");
      const data: ReportPdfData = {
        periodLabel: bounds.label,
        currency: preferredCurrency,
        totals: {
          spent: totalExpenses,
          income: totalIncome,
          avgDaily,
          largest: largestExpense,
        },
        categories: categoryData.map(({ name, color, value }) => ({ name, color, value })),
        months: monthlyData,
      };
      await exportReportPdf(data);
      toast.success("Report exported as PDF");
    } catch {
      toast.error("Couldn't generate the PDF. Try again.");
    } finally {
      setExporting(false);
    }
  }

  const tooltipContentStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "calc(var(--radius) + 2px)",
    boxShadow: "0 12px 40px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.04)",
    fontSize: "12px",
  };

  const overviewBlock = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insightCards.map((item, i) => (
          <Card key={item.label} className={`animate-fade-in-up stagger-${i + 2}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-0.5">{item.label}</p>
              <p className="text-xl md:text-2xl font-bold tabular-nums tracking-tight truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-fade-in-up stagger-4">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {categoryData.length > 0 ? (
              <>
                <div className="h-60" role="img" aria-label={`Spending by category: ${categoryData.slice(0, 6).map((c) => `${c.name} ${formatCurrency(c.value, preferredCurrency)}`).join(", ")}. Full breakdown in the By Category tab.`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart aria-hidden="true">
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, preferredCurrency)} contentStyle={tooltipContentStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                      <span className="inline-flex items-center gap-1"><cat.icon className="h-3 w-3" aria-hidden="true" /> {cat.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <Inbox className="mx-auto h-8 w-8 mb-1 text-muted-foreground" aria-hidden="true" />
                  <p>No data in this period.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up stagger-5">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip formatter={(value: number) => formatCurrency(value, preferredCurrency)} contentStyle={tooltipContentStyle} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="var(--spend)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const categoriesBlock = (
    <Card>
      <CardHeader className="px-5 py-4">
        <CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {categoryData.length > 0 ? (
          <div className="space-y-3">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                    <span className="inline-flex items-center gap-1"><cat.icon className="h-3.5 w-3.5" aria-hidden="true" /> {cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium tabular-nums">{formatCurrency(cat.value, preferredCurrency)}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                      {((cat.value / totalExpenses) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (cat.value / totalExpenses) * 100).toFixed(1)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8 mb-1 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm">No categories with expenses in this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const trendsBlock = (
    <Card>
      <CardHeader className="px-5 py-4">
        <CardTitle className="text-sm font-semibold">Monthly Spending Trend</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(value: number) => formatCurrency(value, preferredCurrency)} contentStyle={tooltipContentStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--spend)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {monthlyData.length > 1 && (() => {
            const last = monthlyData[monthlyData.length - 1].value;
            const prev = monthlyData[monthlyData.length - 2].value;
            if (prev === 0) return null;
            const diff = (((last - prev) / prev) * 100).toFixed(1);
            return (
              <p className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {Number(diff) >= 0
                  ? `Spending increased by ${diff}% compared to last month.`
                  : `Spending decreased by ${Math.abs(Number(diff))}% compared to last month.`}
              </p>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Reports</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
            Your spending story
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {txCount} transaction{txCount === 1 ? "" : "s"} in {bounds.label.toLowerCase()}.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 w-full sm:w-auto shrink-0" onClick={handleExport} disabled={exporting || txCount === 0}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileDown className="h-4 w-4" aria-hidden="true" />}
          Export PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading reports" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load your reports"
          description="We couldn't reach your data. Nothing was lost — try again."
          onRetry={refetch}
        />
      ) : (
        <>
          {/* Period filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {RANGE_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={range === opt.value ? "default" : "ghost"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setRange(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {range === "custom" && (
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <div>
                      <Label htmlFor="report-from" className="sr-only">From date</Label>
                      <Input id="report-from" type="date" className="h-8 w-38 text-xs" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
                    </div>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">–</span>
                    <div>
                      <Label htmlFor="report-to" className="sr-only">To date</Label>
                      <Input id="report-to" type="date" className="h-8 w-38 text-xs" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {totalExpenses > 0 && (
            <Card className="animate-fade-in-up stagger-1 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                    <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Your Spending Report</p>
                    {narrative.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                All
              </TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-8 animate-fade-in">
              {overviewBlock}
              {categoriesBlock}
              {trendsBlock}
            </TabsContent>
            <TabsContent value="overview" className="mt-4 animate-fade-in">
              {overviewBlock}
            </TabsContent>
            <TabsContent value="categories" className="mt-4 animate-fade-in">
              {categoriesBlock}
            </TabsContent>
            <TabsContent value="trends" className="mt-4 animate-fade-in">
              {trendsBlock}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
