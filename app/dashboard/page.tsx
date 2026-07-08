"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, TrendingUp, TrendingDown, RefreshCcw, Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useBudgets } from "@/hooks/use-budgets";

function getGreeting(hour: number, name: string) {
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function getSubtitle(hour: number) {
  if (hour < 12) return "Ready to take on the day? Here's your financial snapshot.";
  if (hour < 17) return "Here's how your finances are looking this afternoon.";
  return "Winding down? Let's review today's activity.";
}

function getMonthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

const categoryEmoji: Record<string, string> = {
  "shopping-cart": "🛒", utensils: "🍽", car: "🚗", home: "🏠",
  "gamepad-2": "🎮", shirt: "👕", "heart-pulse": "❤", "graduation-cap": "🎓",
  plane: "✈", smartphone: "📱", tv: "📺", dumbbell: "💪", "book-open": "📖",
  music: "🎵", dog: "🐕", gift: "🎁", coins: "💰", "piggy-bank": "🐷",
  "credit-card": "💳", "building-2": "🏢", wifi: "📶", droplets: "💧",
  zap: "⚡", fire: "🔥", circle: "○",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: transactions } = useTransactions({ limit: 20 });
  const { data: subscriptions } = useSubscriptions();
  const { data: budgets } = useBudgets();

  const now = new Date();
  const hour = now.getHours();
  const name = session?.user?.name?.split(" ")[0] ?? "there";

  const thisMonth = useMemo(() => {
    if (!transactions) return { expenses: 0, income: 0, count: 0 };
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return transactions.reduce(
      (acc, tx) => {
        const d = new Date(tx.date);
        if (d >= start && d <= now) {
          if (tx.amount < 0) acc.expenses += Math.abs(tx.amount);
          else acc.income += tx.amount;
          acc.count++;
        }
        return acc;
      },
      { expenses: 0, income: 0, count: 0 }
    );
  }, [transactions, now]);

  const thisWeek = useMemo(() => {
    if (!transactions) return { expenses: 0, count: 0 };
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return transactions.reduce(
      (acc, tx) => {
        const d = new Date(tx.date);
        if (d >= start && d <= now && tx.amount < 0) {
          acc.expenses += Math.abs(tx.amount);
          acc.count++;
        }
        return acc;
      },
      { expenses: 0, count: 0 }
    );
  }, [transactions, now]);

  const lastMonth = useMemo(() => {
    if (!transactions) return { expenses: 0 };
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return transactions.reduce(
      (acc, tx) => {
        const d = new Date(tx.date);
        if (d >= start && d <= end && tx.amount < 0) {
          acc.expenses += Math.abs(tx.amount);
        }
        return acc;
      },
      { expenses: 0 }
    );
  }, [transactions, now]);

  const insightMessages = useMemo(() => {
    const msgs: string[] = [];
    if (thisMonth.count === 0) {
      msgs.push("Your financial story starts today. Add your first transaction ✨");
    } else {
      msgs.push(`You've recorded ${thisMonth.count} transactions this month totaling ${formatCurrency(thisMonth.expenses)} in expenses.`);

      if (lastMonth.expenses > 0) {
        const diff = ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100;
        if (Math.abs(diff) < 5) msgs.push("Spending is steady compared to last month.");
        else if (diff < 0) msgs.push(`You're spending ${Math.abs(diff).toFixed(0)}% less than last month — nice work! 🎉`);
        else msgs.push(`Spending is up ${diff.toFixed(0)}% from last month. Keep an eye on it.`);
      }

      if (thisMonth.income > 0) {
        const savingsRate = ((thisMonth.income - thisMonth.expenses) / thisMonth.income) * 100;
        if (savingsRate > 20) msgs.push(`You're saving ${savingsRate.toFixed(0)}% of your income. That's impressive! 💪`);
        else if (savingsRate > 0) msgs.push(`You're saving ${savingsRate.toFixed(0)}% of your income this month.`);
      }
    }
    return msgs;
  }, [thisMonth, lastMonth]);

  const upcomingSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return subscriptions
      .filter((s) => s.status === "active" && new Date(s.nextBillingDate) <= nextWeek)
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(0, 5);
  }, [transactions]);

  const budgetHealth = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;
    const total = budgets.length;
    const overspent = budgets.filter((b) => b.amount === 0).length; // placeholder
    return { total, healthy: total - overspent };
  }, [budgets]);

  const monthSubTotal = useMemo(() => {
    if (!subscriptions) return 0;
    return subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        if (s.billingCycle === "monthly") return sum + s.amount;
        if (s.billingCycle === "yearly") return sum + s.amount / 12;
        return sum;
      }, 0);
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {getGreeting(hour, name)}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {getSubtitle(hour)}
        </p>
      </div>

      {thisMonth.count === 0 ? (
        <Card className="animate-fade-in-up stagger-1">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-xl font-semibold mb-2">Welcome to SpendWise!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your financial journey starts here. Track expenses, set budgets, and watch your savings grow.
            </p>
            <Link href="/dashboard/transactions">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="animate-fade-in-up stagger-1 border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  Monthly Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(thisMonth.income)}</p>
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up stagger-2 border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                  Monthly Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(thisMonth.expenses)}</p>
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up stagger-3 border-l-4 border-l-violet-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  💰 Week Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(thisWeek.expenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">{thisWeek.count} transactions</p>
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up stagger-4 border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />
                  Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(monthSubTotal)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mt-1">{subscriptions?.filter((s) => s.status === "active").length ?? 0} active</p>
              </CardContent>
            </Card>
          </div>

          {insightMessages.length > 0 && (
            <Card className="animate-fade-in-up stagger-3 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">💡</span>
                  <div className="space-y-1">
                    {insightMessages.map((msg, i) => (
                      <p key={i} className="text-sm">{msg}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 animate-fade-in-up stagger-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <Link href="/dashboard/transactions">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                    View All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentTransactions.map((tx) => {
                    const emoji = tx.category?.icon ? categoryEmoji[tx.category.icon] ?? "○" : "○";
                    const isExpense = tx.amount < 0 || tx.type === "expense";
                    const absAmount = Math.abs(tx.amount);
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-sm flex-shrink-0">
                            {emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.category?.name ?? "Uncategorized"} &middot; {formatDate(new Date(tx.date))}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium flex-shrink-0 ml-4 ${
                            !isExpense ? "text-emerald-600 dark:text-emerald-400" : ""
                          }`}
                        >
                          {isExpense ? "-" : "+"}{formatCurrency(absAmount, tx.currency)}
                        </span>
                      </div>
                    );
                  })}
                  {recentTransactions.length === 0 && (
                    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="animate-fade-in-up stagger-5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📋 Budgets</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgets && budgets.length > 0 ? (
                    <div className="space-y-3">
                      {budgets.slice(0, 3).map((budget) => {
                        const cat = budget.category;
                        return (
                          <div key={budget.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate">{cat?.name ?? "Uncategorized"}</span>
                              <span className="text-muted-foreground text-xs">{formatCurrency(budget.amount)}</span>
                            </div>
                            <Progress value={45} className="h-1.5" />
                          </div>
                        );
                      })}
                      {budgets.length > 3 && (
                        <Link href="/dashboard/budgets" className="block text-center text-xs text-primary mt-2 hover:underline">
                          View all {budgets.length} budgets
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <p>No budgets set yet.</p>
                      <Link href="/dashboard/budgets">
                        <Button variant="link" size="sm" className="mt-1">Create one →</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up stagger-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">⏰ Upcoming Renewals</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSubscriptions.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSubscriptions.map((sub) => {
                        const daysUntil = Math.ceil(
                          (new Date(sub.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div key={sub.id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{sub.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysUntil <= 0 ? "Due today" : `In ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-sm font-medium">{formatCurrency(sub.amount, sub.currency)}</span>
                              {daysUntil <= 2 && daysUntil >= 0 && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">Soon</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <p>No upcoming renewals.</p>
                      <Link href="/dashboard/subscriptions">
                        <Button variant="link" size="sm" className="mt-1">Manage subscriptions →</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
