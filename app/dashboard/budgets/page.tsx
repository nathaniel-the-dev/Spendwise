"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Circle, PiggyBank } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  type Budget,
} from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { useSettings } from "@/hooks/use-settings";
import {
  BudgetFormDialog,
  type BudgetFormValues,
} from "@/components/shared/budget-form-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { formatCurrency, formatDate, computeBudgetSpend, budgetPct, budgetTone } from "@/lib/utils";

export default function BudgetsPage() {
  const { data: budgets, isLoading, isError, refetch } = useBudgets();
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions({ limit: 500 });
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  function handleCreate(data: BudgetFormValues) {
    createBudget.mutate(
      {
        categoryId: data.categoryId,
        amount: data.amount,
        currency: preferredCurrency,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate || null,
      },
      { onSuccess: () => setDialogOpen(false) }
    );
  }

  function handleUpdate(data: BudgetFormValues) {
    if (!editing) return;
    updateBudget.mutate(
      {
        id: editing.id,
        data: {
          categoryId: data.categoryId,
          amount: data.amount,
          currency: preferredCurrency,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate || null,
        },
      },
      { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
    );
  }

  function handleDelete(budget: Budget) {
    deleteBudget.mutate(budget, { onSuccess: () => setDeleting(null) });
  }

  const categoryMap = new Map(categories?.map((c) => [c.id, c]));

  const spentFor = (budget: Budget) => computeBudgetSpend(budget, transactions ?? []);
  const deletingSpent = deleting ? spentFor(deleting) : 0;
  const deletingTxCount = deleting
    ? (transactions ?? []).filter((tx) => tx.type === "expense" && (!deleting.categoryId || tx.categoryId === deleting.categoryId)).length
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Budgets</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">Give each category a limit</h1>
          <p className="text-sm text-muted-foreground">Set spending limits for each category.</p>
        </div>
        <Button
          className="gap-1.5 w-full sm:w-auto"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading budgets" />
        </div>
      ) : isError && !budgets ? (
        <ErrorState
          title="Couldn't load your budgets"
          description="We couldn't reach your data. Nothing was lost — try again."
          onRetry={refetch}
        />
      ) : !budgets?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <PiggyBank className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold mb-1">No budgets yet</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Budgets set a spending limit per category and flag you the moment you cross it.
            </p>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const cat = budget.categoryId ? categoryMap.get(budget.categoryId) : null;
            const IconComponent = cat?.icon ? categoryIconMap[cat.icon] ?? Circle : Circle;
            const spent = spentFor(budget);
            const pct = budgetPct(spent, budget.amount);
            const over = spent > budget.amount;
            const progressTone = budgetTone(spent, budget.amount);
            return (
              <Card key={budget.id}>
                <CardHeader className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${cat?.color ?? "#6b7280"}1a`, color: cat?.color ?? "var(--muted-foreground)" }}
                        aria-hidden="true"
                      >
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <div>
                        <CardTitle className="text-sm">{cat?.name ?? "All expenses"}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${cat?.name ?? "all-expenses"} budget`}
                        onClick={() => { setEditing(budget); setDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" aria-label={`Delete ${cat?.name ?? "all-expenses"} budget`}
                        onClick={() => setDeleting(budget)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(budget.amount)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={Math.min(pct, 100)} tone={progressTone} className="flex-1" />
                    <span className={`text-xs font-medium tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                    {over ? (
                      <span className="text-destructive font-medium">{formatCurrency(spent - budget.amount)} over · {formatCurrency(spent)} spent</span>
                    ) : (
                      <>{formatCurrency(spent)} spent · {formatCurrency(budget.amount - spent)} left</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {budget.startDate ? `${formatDate(new Date(budget.startDate))}` : ""}
                    {budget.endDate ? ` — ${formatDate(new Date(budget.endDate))}` : ""}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editing ? handleUpdate : handleCreate}
        defaultValues={editing ? {
          categoryId: editing.categoryId || "",
          amount: editing.amount,
          period: editing.period,
          startDate: editing.startDate ? new Date(editing.startDate).toISOString().split("T")[0] : "",
          endDate: editing.endDate ? new Date(editing.endDate).toISOString().split("T")[0] : "",
        } : undefined}
        title={editing ? "Edit Budget" : "Create Budget"}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting ? `${categoryMap.get(deleting.categoryId ?? "")?.name ?? "Uncategorized"} budget` : "Budget"}</DialogTitle>
            <DialogDescription>
              {deleting && deletingSpent > 0
                ? `${formatCurrency(deletingSpent)} has been tracked against this budget so far, across ${deletingTxCount} transaction${deletingTxCount === 1 ? "" : "s"}. The transactions stay — only the limit is removed. You can undo this for 5 seconds after deleting.`
                : "This budget has no spend recorded against it yet. You can undo this for 5 seconds after deleting."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
