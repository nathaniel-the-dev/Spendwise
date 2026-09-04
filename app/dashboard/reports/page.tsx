"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Lightbulb, Inbox, Circle } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsPage() {
  const { data: transactions } = useTransactions({ limit: 200 });
  const { data: categories } = useCategories();

  const {
    categoryData,
    monthlyData,
    topCategory,
    topCategoryAmount,
    totalExpenses,
    avgDaily,
    largestExpense,
    narrative,
  } = useMemo(() => {
    if (!transactions) return {
      categoryData: [], monthlyData: [], topCategory: "N/A",
      topCategoryAmount: 0, totalExpenses: 0, avgDaily: 0,
      largestExpense: { description: "N/A", amount: 0 },
      narrative: [],
    };

    const expenses = transactions.filter((t) => t.type === "expense");
    const income = transactions.filter((t) => t.type === "income");
    const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalInc = income.reduce((s, t) => s + t.amount, 0);

    const catMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

    const byCategory = new Map<string, number>();
    for (const tx of expenses) {
      const catId = tx.categoryId ?? "uncategorized";
      byCategory.set(catId, (byCategory.get(catId) ?? 0) + Math.abs(tx.amount));
    }

    const catData = Array.from(byCategory.entries())
      .map(([id, amount]) => {
        const ico = id !== "uncategorized" && catMap.get(id)?.icon
          ? (categoryIconMap[catMap.get(id)!.icon] ?? Circle)
          : Circle;
        return {
          name: id === "uncategorized" ? "Uncategorized" : (catMap.get(id)?.name ?? "Unknown"),
          icon: ico,
          color: id !== "uncategorized" ? (catMap.get(id)?.color ?? "#6b7280") : "#6b7280",
          value: amount,
        };
      })
      .sort((a, b) => b.value - a.value);

    const topC = catData[0];

    const byMonth = new Map<string, number>();
    for (const tx of expenses) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(tx.amount));
    }

    const now = new Date();
    const monthData = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${m.getMonth()}`;
      monthData.push({
        month: MONTHS[m.getMonth()],
        value: byMonth.get(key) ?? 0,
      });
    }

    const largest = expenses.reduce(
      (max, tx) => (Math.abs(tx.amount) > (max.amount ?? 0) ? tx : max),
      expenses[0]
    );

    const days = expenses.length > 0
      ? Math.max(1, Math.ceil((new Date().getTime() - new Date(expenses[expenses.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    const avg = totalExp / days;

    const narr: string[] = [];

    if (totalExp > 0 && catData.length > 0) {
      narr.push(`You spent a total of ${formatCurrency(totalExp)} across ${catData.length} categories.`);
      if (topC) narr.push(`Your biggest expense category was "${topC.name}" at ${formatCurrency(topC.value)} — that's ${((topC.value / totalExp) * 100).toFixed(0)}% of all spending.`);
      if (totalInc > 0) {
        const rate = ((totalInc - totalExp) / totalInc) * 100;
        narr.push(rate >= 0
          ? `You're saving ${rate.toFixed(0)}% of your income. Keep it up!`
          : `You're spending ${Math.abs(rate).toFixed(0)}% more than you earn. Time to review.`);
      }
      if (largest) narr.push(`Your single largest expense was ${formatCurrency(Math.abs(largest.amount))} — "${largest.description}".`);
      narr.push(`Daily average spending: ${formatCurrency(avg)}.`);
    } else {
      narr.push("No expense data yet. Start tracking to see your reports!");
    }

    return {
      categoryData: catData,
      monthlyData: monthData,
      topCategory: topC?.name ?? "N/A",
      topCategoryAmount: topC?.value ?? 0,
      totalExpenses: totalExp,
      avgDaily: avg,
      largestExpense: { description: largest?.description ?? "N/A", amount: Math.abs(largest?.amount ?? 0) },
      narrative: narr,
    };
  }, [transactions, categories]);

  const insightCards = [
    { label: "Total Spent", value: formatCurrency(totalExpenses), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Average Daily", value: formatCurrency(avgDaily), icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Top Category", value: topCategory, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Largest Expense", value: formatCurrency(largestExpense.amount), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Understand your spending at a glance.</p>
      </div>

      {totalExpenses > 0 && (
        <Card className="animate-fade-in-up stagger-1 border-primary/20 border-l-2 border-l-primary bg-primary/[0.03] dark:bg-primary/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Your Spending Report</p>
                {narrative.map((line, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{line}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {insightCards.map((item, i) => (
              <Card key={item.label} className={`animate-fade-in-up stagger-${i + 2}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
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
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "calc(var(--radius) + 2px)",
                            boxShadow: "0 12px 40px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.04)",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <Inbox className="mx-auto h-8 w-8 mb-1 text-muted-foreground" aria-hidden="true" />
                      <p>No data yet.</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span><cat.icon className="h-3 w-3" /> {cat.name}</span>
                    </div>
                  ))}
                </div>
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
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "calc(var(--radius) + 2px)",
                          boxShadow: "0 12px 40px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.04)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 animate-fade-in">
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
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span><cat.icon className="h-3.5 w-3.5" /> {cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
                          <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                            {((cat.value / totalExpenses) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${((cat.value / totalExpenses) * 100).toFixed(1)}%`,
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
                  <p className="text-sm">No categories with expenses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4 animate-fade-in">
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
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "calc(var(--radius) + 2px)",
                        boxShadow: "0 12px 40px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.04)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--chart-1)" />
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
                    <p>
                      {Number(diff) >= 0
                        ? `Spending increased by ${diff}% compared to last month.`
                        : `Spending decreased by ${Math.abs(Number(diff))}% compared to last month.`}
                    </p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
