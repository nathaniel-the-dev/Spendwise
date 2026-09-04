"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/components/supabase-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, AlertTriangle, RefreshCcw, Plus, Wallet, Lightbulb, Sprout, Circle } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import { formatCurrency, formatDate, normalizeBillingAmount } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useBudgets } from "@/hooks/use-budgets";

function getGreeting(hour: number, name: string) {
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function getSubtitle(hour: number) {
  if (hour < 12) return "Here's your financial snapshot for today.";
  if (hour < 17) return "Here's how your finances are looking this afternoon.";
  return "Winding down? Let's review today's activity.";
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: transactions, isLoading: txLoading } = useTransactions({ limit: 500 });
  const { data: subscriptions, isLoading: subLoading } = useSubscriptions();
  const { data: budgets, isLoading: budgetLoading } = useBudgets();

  const isLoading = txLoading || subLoading || budgetLoading;

  const now = new Date();
  const hour = now.getHours();
  const name = user?.name?.split(" ")[0] ?? "there";

  const thisMonth = useMemo(() => {
    if (!transactions) return { expenses: 0, income: 0, count: 0 };
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return transactions.reduce(
      (acc, tx) => {
        const d = new Date(tx.date);
        if (d >= start && d <= end) {
          if (tx.type === "expense") acc.expenses += tx.amount;
          else acc.income += tx.amount;
          acc.count++;
        }
        return acc;
      },
      { expenses: 0, income: 0, count: 0 }
    );
  }, [transactions]);

  const thisWeek = useMemo(() => {
    if (!transactions) return { expenses: 0, count: 0 };
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return transactions.reduce(
      (acc, tx) => {
        const d = new Date(tx.date);
        if (d >= start && d <= end && tx.type === "expense") {
          acc.expenses += tx.amount;
          acc.count++;
        }
        return acc;
      },
      { expenses: 0, count: 0 }
    );
  }, [transactions]);

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
        if (d >= start && d <= end && tx.type === "expense") {
          acc.expenses += tx.amount;
        }
        return acc;
      },
      { expenses: 0 }
    );
  }, [transactions]);

  const insightMessages = useMemo(() => {
    const msgs: string[] = [];
    if (thisMonth.count === 0) {
      msgs.push("Your financial story starts today. Add your first transaction to get going.");
    } else {
      msgs.push(`You've recorded ${thisMonth.count} transactions this month totaling ${formatCurrency(thisMonth.expenses)} in expenses.`);

      if (lastMonth.expenses > 0) {
        const diff = ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100;
        if (Math.abs(diff) < 5) msgs.push("Spending is steady compared to last month.");
        else if (diff < 0) msgs.push(`You're spending ${Math.abs(diff).toFixed(0)}% less than last month — nice work!`);
        else msgs.push(`Spending is up ${diff.toFixed(0)}% from last month. Keep an eye on it.`);
      }

      if (thisMonth.income > 0) {
        const savingsRate = ((thisMonth.income - thisMonth.expenses) / thisMonth.income) * 100;
        if (savingsRate > 20) msgs.push(`You're saving ${savingsRate.toFixed(0)}% of your income. That's impressive!`);
        else if (savingsRate > 0) msgs.push(`You're saving ${savingsRate.toFixed(0)}% of your income this month.`);
      }
    }
    return msgs;
  }, [thisMonth, lastMonth]);

  const upcomingSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return subscriptions
      .filter((s) => {
        const billingDate = new Date(s.nextBillingDate);
        return s.status === "active" && billingDate >= today && billingDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(0, 5);
  }, [transactions]);

  const monthSubTotal = useMemo(() => {
    if (!subscriptions) return 0;
    return subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        return sum + normalizeBillingAmount(
          s.amount,
          s.billingCycle,
          s.billingInterval ?? 1,
        );
      }, 0);
  }, [subscriptions]);

  const budgetsWithSpend = useMemo(() => {
    if (!budgets || !transactions) return [];
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return budgets.map((budget) => {
      const categoryTransactions = transactions.filter((tx) => {
        if (tx.categoryId !== budget.categoryId) return false;
        const txDate = new Date(tx.date);
        switch (budget.period) {
          case "weekly": {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return txDate >= weekStart;
          }
          case "monthly":
            return txDate >= currentMonthStart;
          case "yearly": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return txDate >= yearStart;
          }
          default:
            return false;
        }
      });
      const spent = categoryTransactions.reduce(
        (sum, tx) => sum + (tx.type === "expense" ? Math.abs(tx.amount) : 0),
        0
      );
      const pct = budget.amount > 0 ? Math.min(Math.round((spent / budget.amount) * 100), 100) : 0;
      return { ...budget, spent, pct };
    });
  }, [budgets, transactions]);

  // ── Cash-flow "one number" inputs ─────────────────────────
  const committed = monthSubTotal;
  const available = thisMonth.income - thisMonth.expenses - committed;

  const incomeBreakdown = [
    { key: "income", label: "Income", value: thisMonth.income, color: "text-emerald-600 dark:text-emerald-400" },
    { key: "spent", label: "Spent", value: thisMonth.expenses, color: "text-rose-500 dark:text-rose-400" },
    { key: "committed", label: "Commitments", value: committed, color: "text-amber-600 dark:text-amber-400" },
  ];

  const spendShare = thisMonth.income > 0 ? Math.min((thisMonth.expenses / thisMonth.income) * 100, 100) : 0;
  const committedShare = thisMonth.income > 0 ? Math.min((committed / thisMonth.income) * 100, 100) : 0;
  const availableShare = Math.max(0, 100 - spendShare - committedShare);

  // ── Attention items (only genuinely actionable) ──────────
  const alertItems: {
    id: string;
    tone: "danger" | "warn";
    icon: typeof AlertTriangle;
    text: string;
    href: string;
  }[] = [];

  for (const budget of budgetsWithSpend) {
    if (budget.spent > budget.amount) {
      alertItems.push({
        id: `budget-${budget.id}`,
        tone: "danger",
        icon: AlertTriangle,
        text: `Over budget in ${budget.category?.name ?? "Uncategorized"}: ${formatCurrency(budget.spent)} of ${formatCurrency(budget.amount)}`,
        href: "/dashboard/budgets",
      });
    }
  }

  for (const sub of upcomingSubscriptions) {
    const daysUntil = Math.ceil((new Date(sub.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 2 && daysUntil >= 0) {
      alertItems.push({
        id: `renewal-${sub.id}`,
        tone: "warn",
        icon: RefreshCcw,
        text: `${sub.name} renews ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}`,
        href: "/dashboard/subscriptions",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="h-3.5 w-20 rounded bg-muted" />
                  <div className="h-6 w-24 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          {getGreeting(hour, name)}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {getSubtitle(hour)}
        </p>
      </div>

      {thisMonth.count === 0 ? (
        <Card className="animate-fade-in-up stagger-1">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Sprout className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Welcome to SpendWise!</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Your financial journey starts here. Track expenses, set budgets, and watch your savings grow.
            </p>
            <Link href="/dashboard/transactions">
              <Button size="sm" className="gap-1.5 text-sm">
                <Plus className="h-4 w-4" />
                Add Your First Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── The one number: what can I spend now? ──────── */}
          <Card className="animate-fade-in-up stagger-1 overflow-hidden border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Available this month
                  </div>
                  <p className={`mt-2 text-4xl md:text-5xl font-bold tracking-tight tabular-nums ${available < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {formatCurrency(available)}
                  </p>
                  {thisMonth.income > 0 ? (
                    <>
                      <p className="mt-2 text-sm text-muted-foreground">
                        After {formatCurrency(thisMonth.expenses)} spent and {formatCurrency(committed)} in recurring commitments.
                      </p>
                      <div
                        className="mt-4 flex h-2.5 w-full max-w-md overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`Income split: ${formatCurrency(thisMonth.expenses)} spent, ${formatCurrency(committed)} commitments, ${formatCurrency(Math.max(0, available))} available`}
                      >
                        <div className="bg-rose-500" style={{ width: `${spendShare}%` }} />
                        <div className="bg-amber-500" style={{ width: `${committedShare}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${availableShare}%` }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" /> Spent
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> Commitments
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> Available
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add income this month to see what you have left to spend.
                    </p>
                  )}
                  {thisWeek.count > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatCurrency(thisWeek.expenses)} spent this week across {thisWeek.count} transaction{thisWeek.count > 1 ? "s" : ""}.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 xl:w-60 xl:grid-cols-1">
                  {incomeBreakdown.map((item) => (
                    <div key={item.key} className="rounded-lg border bg-card/60 p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${item.color}`}>{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Attention: only actionable items ────────────── */}
          {alertItems.length > 0 ? (
            <Card className="animate-fade-in-up stagger-2">
              <CardContent className="p-4">
                <div className="space-y-1">
                  {alertItems.map((alert) => (
                    <Link
                      key={alert.id}
                      href={alert.href}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${alert.tone === "danger" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}
                      >
                        <alert.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-sm">{alert.text}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            insightMessages.length > 0 && (
              <Card className="animate-fade-in-up stagger-2 border-l-2 border-l-primary bg-primary/[0.03] dark:bg-primary/[0.06]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                    </span>
                    <p className="pt-1.5 text-sm text-muted-foreground">{insightMessages[0]}</p>
                  </div>
                </CardContent>
              </Card>
            )
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 animate-fade-in-up stagger-4">
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Transactions</CardTitle>
                <Link href="/dashboard/transactions">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-8 px-2">
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {recentTransactions.map((tx) => {
                    const IconComponent = tx.category?.icon ? categoryIconMap[tx.category.icon] ?? Circle : Circle;
                    const isExpense = tx.amount < 0 || tx.type === "expense";
                    const absAmount = Math.abs(tx.amount);
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.category?.name ?? "Uncategorized"} &middot; {formatDate(new Date(tx.date))}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium tabular-nums flex-shrink-0 ml-3 ${!isExpense ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {isExpense ? "-" : "+"}{formatCurrency(absAmount, tx.currency)}
                        </span>
                      </div>
                    );
                  })}
                  {recentTransactions.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No transactions yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card className="animate-fade-in-up stagger-5">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budgets</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {budgetsWithSpend.length > 0 ? (
                    <div className="space-y-3">
                      {budgetsWithSpend.slice(0, 4).map((budget) => {
                        const cat = budget.category;
                        const progressTone: "success" | "warning" | "danger" =
                          budget.spent > budget.amount ? "danger" : budget.pct > 75 ? "warning" : "success";
                        return (
                          <div key={budget.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate">{cat?.name ?? "Uncategorized"}</span>
                              <span className="text-muted-foreground tabular-nums">{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={budget.pct} tone={progressTone} className="flex-1" />
                              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{budget.pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                      {budgetsWithSpend.length > 4 && (
                        <Link href="/dashboard/budgets" className="block text-center text-xs text-primary mt-2 hover:underline">
                          View all {budgetsWithSpend.length} budgets
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-sm text-muted-foreground">
                      <p>No budgets set yet.</p>
                      <Link href="/dashboard/budgets">
                        <Button variant="link" size="sm" className="mt-0.5 text-xs">Create one →</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up stagger-6">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Renewals</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {upcomingSubscriptions.length > 0 ? (
                    <div className="space-y-2.5">
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
                              <span className="text-sm font-medium tabular-nums">{formatCurrency(sub.amount, sub.currency)}</span>
                              {daysUntil <= 2 && daysUntil >= 0 && (
                                <Badge variant="destructive">Soon</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-5 text-sm text-muted-foreground">
                      <p>No upcoming renewals.</p>
                      <Link href="/dashboard/subscriptions">
                        <Button variant="link" size="sm" className="mt-0.5 text-xs">Manage subscriptions →</Button>
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
