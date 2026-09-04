"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Filter, Loader2, Trash2, Circle } from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  type TransactionFilters,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import {
  TransactionFormDialog,
  type TransactionFormValues,
} from "@/components/shared/transaction-form-dialog";

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: transactions, isLoading } = useTransactions(filters);
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  function applyFilters() {
    const f: TransactionFilters = {};
    if (search) f.search = search;
    if (categoryFilter !== "all") f.categoryId = categoryFilter;
    if (typeFilter !== "all") f.type = typeFilter;
    setFilters(f);
  }

  function handleCreate(data: TransactionFormValues) {
    createTransaction.mutate(
      {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        date: new Date(data.date).toISOString(),
        type: data.type,
        categoryId: data.categoryId || null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        notes: data.notes || null,
      },
      { onSuccess: () => setDialogOpen(false) }
    );
  }

  function handleDelete(id: string) {
    deleteTransaction.mutate(id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">View and manage all your transactions.</p>
        </div>
        <Button className="gap-1.5 w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={categoryFilter}
                onValueChange={(v) => { setCategoryFilter(v); setTimeout(applyFilters, 0); }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => { setTypeFilter(v); setTimeout(applyFilters, 0); }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" aria-label="Apply transaction filters" onClick={applyFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !transactions?.length ? (
            <div className="text-center py-10 text-muted-foreground px-4">
              <p className="text-sm mb-1">No transactions found</p>
              <p className="text-sm">Add your first transaction to get started.</p>
            </div>
          ) : (
            <div>
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                <div className="col-span-5">Description</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {transactions.map((tx) => {
            const IconComponent = tx.category?.icon
              ? categoryIconMap[tx.category.icon] ?? Circle
              : Circle;
                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 px-4 py-3 text-sm border-b last:border-0 hover:bg-muted/30 transition-colors group items-center"
                  >
                    <div className="sm:col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {tx.category?.name ?? "Uncategorized"} &middot; {formatDate(new Date(tx.date))}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block col-span-3">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        <IconComponent className="h-3.5 w-3.5" /> {tx.category?.name ?? "Uncategorized"}
                      </span>
                    </div>
                    <div className="hidden sm:block col-span-2 text-muted-foreground text-xs">
                      {formatDate(new Date(tx.date))}
                    </div>
                    <div className="col-span-2 flex items-center justify-between sm:justify-end">
                      <span className={`text-sm font-medium tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        aria-label={`Delete ${tx.description}`}
                        onClick={() => setDeleting(tx.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
