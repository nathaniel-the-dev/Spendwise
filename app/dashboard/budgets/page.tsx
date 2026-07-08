"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  type Budget,
} from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import {
  BudgetFormDialog,
  type BudgetFormValues,
} from "@/components/shared/budget-form-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories } = useCategories();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Set spending limits for each category.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !budgets?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No budgets set</p>
          <p className="text-sm">Create a budget to track your spending limits.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const cat = budget.categoryId ? categoryMap.get(budget.categoryId) : null;
            return (
              <Card key={budget.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{cat?.name ?? "Uncategorized"}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{budget.period}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditing(budget); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => setDeleting(budget.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(budget.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {budget.startDate ? `From ${formatDate(new Date(budget.startDate))}` : ""}
                    {budget.endDate ? ` to ${formatDate(new Date(budget.endDate))}` : ""}
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
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteBudget.isPending}
            >
              {deleteBudget.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
