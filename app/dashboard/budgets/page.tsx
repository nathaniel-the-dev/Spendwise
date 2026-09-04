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
import { Plus, Pencil, Trash2, Loader2, Circle } from "lucide-react";
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
import {
  BudgetFormDialog,
  type BudgetFormValues,
} from "@/components/shared/budget-form-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions({ limit: 500 });
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleCreate(data: BudgetFormValues) {
    createBudget.mutate(
      {
        categoryId: data.categoryId,
        amount: data.amount,
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
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate || null,
        },
      },
      { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
    );
  }

  function handleDelete(id: string) {
    deleteBudget.mutate(id, { onSuccess: () => setDeleting(null) });
  }

  const categoryMap = new Map(categories?.map((c) => [c.id, c]));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Budgets</h1>
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
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !budgets?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm mb-1">No budgets set</p>
          <p className="text-xs">Create a budget to track your spending limits.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const cat = budget.categoryId ? categoryMap.get(budget.categoryId) : null;
            const IconComponent = cat?.icon ? categoryIconMap[cat.icon] ?? Circle : Circle;
            const now = new Date();
            const periodStart = new Date(now);
            if (budget.period === "weekly") {
              periodStart.setDate(now.getDate() - now.getDay());
            } else if (budget.period === "monthly") {
              periodStart.setDate(1);
            } else {
              periodStart.setMonth(0, 1);
            }
            periodStart.setHours(0, 0, 0, 0);
            const startDate = budget.startDate ? new Date(budget.startDate) : periodStart;
            const endDate = budget.endDate ? new Date(budget.endDate) : null;
            const spent = (transactions ?? [])
              .filter((tx) => {
                const txDate = new Date(tx.date);
                return tx.type === "expense"
                  && (!budget.categoryId || tx.categoryId === budget.categoryId)
                  && txDate >= periodStart
                  && txDate >= startDate
                  && (!endDate || txDate <= endDate);
              })
              .reduce((sum, tx) => sum + Math.abs(tx.amountInPreferred ?? tx.amount), 0);
            const pct = budget.amount > 0 ? Math.min(Math.round((spent / budget.amount) * 100), 100) : 0;
            const progressTone: "success" | "warning" | "danger" =
              spent > budget.amount ? "danger" : pct > 75 ? "warning" : "success";
            return (
              <Card key={budget.id}>
                <CardHeader className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <CardTitle className="text-sm">{cat?.name ?? "Uncategorized"}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${cat?.name ?? "uncategorized"} budget`}
                        onClick={() => { setEditing(budget); setDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" aria-label={`Delete ${cat?.name ?? "uncategorized"} budget`}
                        onClick={() => setDeleting(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(budget.amount)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={pct} tone={progressTone} className="flex-1" />
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
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
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
