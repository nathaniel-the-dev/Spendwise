"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Tags, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets, type Budget } from "@/hooks/use-budgets";
import { useSettings } from "@/hooks/use-settings";
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from "@/components/shared/category-form-dialog";
import { ErrorState } from "@/components/shared/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, txValue, computeBudgetSpend, budgetPct } from "@/lib/utils";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { data: transactions } = useTransactions({ limit: 500 });
  const { data: budgets } = useBudgets();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Per-category usage: how many transactions, spend this month, and whether
  // a budget is set — so each card answers "what is this category doing?".
  const stats = useMemo(() => {
    const map = new Map<string, { count: number; thisMonth: number; budget: Budget | null }>();
    if (!categories) return map;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    for (const cat of categories) {
      const txns = (transactions ?? []).filter((t) => t.categoryId === cat.id);
      const thisMonth = txns
        .filter((t) => t.type === "expense" && new Date(t.date) >= monthStart)
        .reduce((s, t) => s + txValue(t), 0);
      const budget = (budgets ?? []).find((b) => b.categoryId === cat.id) ?? null;
      map.set(cat.id, { count: txns.length, thisMonth, budget });
    }
    return map;
  }, [categories, transactions, budgets]);

  const expenseCats = categories?.filter((c) => c.type === "expense") ?? [];
  const incomeCats = categories?.filter((c) => c.type === "income") ?? [];

  function handleCreate(data: CategoryFormValues) {
    createCategory.mutate(data, { onSuccess: () => setDialogOpen(false) });
  }

  function handleUpdate(data: CategoryFormValues) {
    if (!editing) return;
    updateCategory.mutate(
      { id: editing.id, data },
      { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
    );
  }

  function handleDelete(id: string) {
    deleteCategory.mutate(id, { onSuccess: () => setDeleting(null) });
  }

  const deletingCat = deleting ? categories?.find((c) => c.id === deleting) ?? null : null;
  const deletingStats = deleting ? stats.get(deleting) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Categories</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
            How you label your money
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Every transaction you categorize feeds your budgets and reports. Uncategorized spending is invisible to both.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto shrink-0"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading categories" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Couldn't load your categories"
          description="We couldn't reach your data. Nothing was lost — try again."
          onRetry={refetch}
        />
      ) : !categories?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Tags className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold mb-1">No categories yet</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Categories turn a flat list of transactions into budgets, reports and insight.
            </p>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <CategorySection
            title="Spending"
            caption="Where money goes — these can have budgets."
            icon={ArrowDownRight}
            tone="rose"
            categories={expenseCats}
            stats={stats}
            transactions={transactions}
            preferredCurrency={preferredCurrency}
            onEdit={(cat) => { setEditing(cat); setDialogOpen(true); }}
            onDelete={(cat) => setDeleting(cat.id)}
          />
          {incomeCats.length > 0 && (
            <CategorySection
              title="Income"
              caption="Where money comes from."
              icon={ArrowUpRight}
              tone="primary"
              categories={incomeCats}
              stats={stats}
              transactions={transactions}
              preferredCurrency={preferredCurrency}
              onEdit={(cat) => { setEditing(cat); setDialogOpen(true); }}
              onDelete={(cat) => setDeleting(cat.id)}
            />
          )}
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editing ? handleUpdate : handleCreate}
        defaultValues={editing ? { name: editing.name, icon: editing.icon, color: editing.color, type: editing.type } : undefined}
        title={editing ? "Edit Category" : "Create Category"}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deletingCat?.name ?? "Category"}?</DialogTitle>
            <DialogDescription>
              {deletingStats && deletingStats.count > 0
                ? `${deletingStats.count} transaction${deletingStats.count === 1 ? "" : "s"}${deletingStats.budget ? " and a budget" : ""} are linked to this category. They'll be moved to Uncategorized — the transactions themselves are kept.`
                : "This category has no transactions yet, so nothing else is affected."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategorySection({
  title,
  caption,
  icon: Icon,
  tone,
  categories,
  stats,
  transactions,
  preferredCurrency,
  onEdit,
  onDelete,
}: {
  title: string;
  caption: string;
  icon: typeof ArrowDownRight;
  tone: "rose" | "primary";
  categories: Category[];
  stats: Map<string, { count: number; thisMonth: number; budget: Budget | null }>;
  transactions: { type: string; date: string; categoryId: string | null; amount: number }[] | undefined;
  preferredCurrency: string;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const toneClasses =
    tone === "rose"
      ? "text-rose-500 bg-rose-500/10"
      : "text-primary bg-primary/10";
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClasses}`} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className="ml-auto label-mono text-muted-foreground">{categories.length}</span>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-9.5">None yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const s = stats.get(cat.id);
            const budget = s?.budget ?? null;
            const budgetSpent = budget && transactions ? computeBudgetSpend(budget, transactions) : 0;
            const budgetPctVal = budget ? budgetPct(budgetSpent, budget.amount) : 0;
            return (
              <Card key={cat.id} hoverable className="group overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)`, color: cat.color }}
                      aria-hidden="true"
                    >
                      <CategoryIcon icon={cat.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {s?.count ?? 0} transaction{(s?.count ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${cat.name} category`}
                        onClick={() => onEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete ${cat.name} category`}
                        onClick={() => onDelete(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2 border-t pt-3">
                    <div>
                      <p className="label-mono text-muted-foreground">This month</p>
                      <p className="text-sm font-semibold tabular-nums mt-0.5">
                        {formatCurrency(s?.thisMonth ?? 0, preferredCurrency)}
                      </p>
                    </div>
                    {budget ? (
                      <div className="text-right">
                        <p className="label-mono text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium tabular-nums mt-0.5">
                          {formatCurrency(budget.amount, preferredCurrency)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {budget.period === "monthly" ? "/mo" : budget.period === "weekly" ? "/wk" : "/yr"}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 italic">No budget</p>
                    )}
                  </div>
                  {budget && budgetPctVal > 0 && (
                    <p className={`mt-1 text-right text-xs tabular-nums ${budgetPctVal > 100 ? "text-destructive" : "text-muted-foreground"}`}>
                      {budgetPctVal}% used
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
