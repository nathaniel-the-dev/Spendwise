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

const categoryEmoji: Record<string, string> = {
  "shopping-cart": "🛒", utensils: "🍽", car: "🚗", home: "🏠",
  "gamepad-2": "🎮", shirt: "👕", "heart-pulse": "❤", "graduation-cap": "🎓",
  plane: "✈", smartphone: "📱", tv: "📺", dumbbell: "💪", "book-open": "📖",
  music: "🎵", dog: "🐕", gift: "🎁", coins: "💰", "piggy-bank": "🐷",
  "credit-card": "💳", "building-2": "🏢", wifi: "📶", droplets: "💧",
  zap: "⚡", fire: "🔥", circle: "○",
};

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

    const expenses = transactions.filter((t) => t.amount < 0 || t.type === "expense");
    const income = transactions.filter((t) => t.amount > 0 || t.type === "income");
    const totalExp = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalInc = income.reduce((s, t) => s + t.amount, 0);

    const catMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

    const byCategory = new Map<string, number>();
    for (const tx of expenses) {
      const catId = tx.categoryId ?? "uncategorized";
      byCategory.set(catId, (byCategory.get(catId) ?? 0) + Math.abs(tx.amount));
    }

    const catData = Array.from(byCategory.entries())
      .map(([id, amount]) => ({
        name: id === "uncategorized" ? "Uncategorized" : (catMap.get(id)?.name ?? "Unknown"),
        icon: id !== "uncategorized" ? (catMap.get(id)?.icon ? categoryEmoji[catMap.get(id)!.icon] ?? "○" : "○") : "○",
        color: id !== "uncategorized" ? (catMap.get(id)?.color ?? "#6b7280") : "#6b7280",
        value: amount,
      }))
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
          ? `You're saving ${rate.toFixed(0)}% of your income. Keep it up! 🎉`
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Understand your spending at a glance.
        </p>
      </div>

      {totalExpenses > 0 && (
        <Card className="animate-fade-in-up stagger-1 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📊</span>
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

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Spent", value: formatCurrency(totalExpenses), emoji: "💸" },
              { label: "Average Daily", value: formatCurrency(avgDaily), emoji: "📆" },
              { label: "Top Category", value: topCategory, emoji: "🏆" },
              { label: "Largest Expense", value: formatCurrency(largestExpense.amount), emoji: "⚠️" },
            ].map((item, i) => (
              <Card key={item.label} className={`animate-fade-in-up stagger-${i + 2}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span>{item.emoji}</span>
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg md:text-2xl font-bold truncate">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="animate-fade-in-up stagger-4">
              <CardHeader>
                <CardTitle className="text-base">🏷️ Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
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
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: "13px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <p className="text-lg mb-1">📭</p>
                      <p>No data yet.</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.icon} {cat.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up stagger-5">
              <CardHeader>
                <CardTitle className="text-base">📈 Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          fontSize: "13px",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🏷️ Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span>{cat.icon} {cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(cat.value)}</span>
                          <span className="text-muted-foreground text-xs ml-2">
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
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-lg mb-1">📭</p>
                  <p className="text-sm">No categories with expenses yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📈 Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 13 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 13 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {monthlyData.length > 1 && (() => {
                  const last = monthlyData[monthlyData.length - 1].value;
                  const prev = monthlyData[monthlyData.length - 2].value;
                  if (prev === 0) return null;
                  const diff = (((last - prev) / prev) * 100).toFixed(1);
                  return (
                    <p>
                      {Number(diff) >= 0
                        ? `📈 Spending increased by ${diff}% compared to last month.`
                        : `📉 Spending decreased by ${Math.abs(Number(diff))}% compared to last month.`}
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
