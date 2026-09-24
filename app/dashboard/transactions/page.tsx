"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Pencil,
  Circle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { categoryIconMap } from "@/components/category-icon";
import { formatCurrency, formatDate, txValue } from "@/lib/utils";
import { isForeignCurrency } from "@/lib/fx";
import {
  useTransactions,
  useTransactionsPage,
  TRANSACTIONS_PAGE_SIZE,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  type Transaction,
  type TransactionFilters,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useSettings } from "@/hooks/use-settings";
import { useOutbox } from "@/hooks/use-outbox";
import { useUser } from "@/components/supabase-provider";
import { ErrorState } from "@/components/shared/error-state";
import { PendingTransactions } from "@/components/shared/pending-transactions";
import {
  TransactionFormDialog,
  type TransactionFormValues,
} from "@/components/shared/transaction-form-dialog";

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high → low" },
  { value: "amount-asc", label: "Amount: low → high" },
];

const PAGE_SIZES = [25, 50, 100];

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading transactions" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TRANSACTIONS_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Header search arrives as ?search=… — adopt it when it changes.
  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setSearch(q);
    setDebouncedSearch(q);
    setPage(1);
  }, [searchParams]);

  // Every control applies as it changes (search with a short debounce).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = useMemo(() => {
    const f: Omit<TransactionFilters, "limit" | "offset"> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (categoryFilter !== "all") f.categoryId = categoryFilter;
    if (typeFilter !== "all") f.type = typeFilter;
    if (startDate) f.startDate = new Date(startDate).toISOString();
    if (endDate) f.endDate = new Date(`${endDate}T23:59:59`).toISOString();
    if (minAmount) f.minAmount = Number(minAmount);
    if (maxAmount) f.maxAmount = Number(maxAmount);
    if (tagFilter !== "all") f.tag = tagFilter;
    if (uncategorizedOnly) f.uncategorized = true;
    f.sort = sort === "amount-desc" || sort === "amount-asc" ? "amount" : "date";
    f.dir = sort.endsWith("asc") ? "asc" : "desc";
    return f;
  }, [debouncedSearch, categoryFilter, typeFilter, startDate, endDate, minAmount, maxAmount, tagFilter, uncategorizedOnly, sort]);

  const { data, isLoading, isError, refetch, isFetching } = useTransactionsPage(filters, page, pageSize);
  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Recent history feeds description/tag suggestions for the dialog.
  const { data: recent } = useTransactions({ limit: 100 });
  const descriptionSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tx of recent ?? []) {
      const key = tx.description.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(tx.description);
      }
    }
    return out;
  }, [recent]);
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const tx of recent ?? []) for (const t of tx.tags ?? []) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recent]);

  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const { user } = useUser();
  const { items: outboxItems } = useOutbox(user?.id);
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const pageTotals = useMemo(() => {
    let spent = 0;
    let income = 0;
    for (const tx of transactions) {
      if (tx.type === "expense") spent += txValue(tx);
      else income += txValue(tx);
    }
    return { spent, income };
  }, [transactions]);

  // Any filter change resets to page 1 so you never land on an empty tail page.
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (debouncedSearch) chips.push({ key: "search", label: `“${debouncedSearch}”`, clear: () => { setSearch(""); setDebouncedSearch(""); } });
    if (categoryFilter !== "all") {
      const cat = categories?.find((c) => c.id === categoryFilter);
      chips.push({ key: "category", label: cat?.name ?? "Category", clear: () => setCategoryFilter("all") });
    }
    if (typeFilter !== "all") chips.push({ key: "type", label: typeFilter === "expense" ? "Expenses" : "Income", clear: () => setTypeFilter("all") });
    if (startDate) chips.push({ key: "start", label: `From ${formatDate(new Date(startDate))}`, clear: () => setStartDate("") });
    if (endDate) chips.push({ key: "end", label: `To ${formatDate(new Date(endDate))}`, clear: () => setEndDate("") });
    if (minAmount) chips.push({ key: "min", label: `≥ ${formatCurrency(Number(minAmount), preferredCurrency)}`, clear: () => setMinAmount("") });
    if (maxAmount) chips.push({ key: "max", label: `≤ ${formatCurrency(Number(maxAmount), preferredCurrency)}`, clear: () => setMaxAmount("") });
    if (tagFilter !== "all") chips.push({ key: "tag", label: `#${tagFilter}`, clear: () => setTagFilter("all") });
    if (uncategorizedOnly) chips.push({ key: "uncat", label: "Uncategorized", clear: () => setUncategorizedOnly(false) });
    return chips;
  }, [debouncedSearch, categoryFilter, typeFilter, startDate, endDate, minAmount, maxAmount, tagFilter, uncategorizedOnly, categories, preferredCurrency]);

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setTagFilter("all");
    setUncategorizedOnly(false);
  }

  function setPresetRange(preset: "this-month" | "last-month" | "last-90") {
    const now = new Date();
    if (preset === "this-month") {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
      setEndDate("");
    } else if (preset === "last-month") {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]);
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate("");
    }
  }

  function handleSubmit(values: TransactionFormValues, addAnother: boolean) {
    const payload = {
      amount: values.amount,
      currency: values.currency || preferredCurrency,
      fxRate: values.fxRate ?? null,
      fxSource: values.fxRate ? (values.fxSource ?? "auto") : null,
      description: values.description,
      date: new Date(values.date).toISOString(),
      type: values.type,
      categoryId: values.categoryId || null,
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      notes: values.notes || null,
    };
    if (editing) {
      updateTransaction.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
      );
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => { if (!addAnother) setDialogOpen(false); },
      });
    }
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // Compact page list: 1 … 4 [5] 6 … 20
  const pageNumbers = useMemo(() => {
    const out: (number | "…")[] = [];
    const push = (n: number | "…") => out.push(n);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
    } else {
      push(1);
      if (page > 3) push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
      if (page < totalPages - 2) push("…");
      push(totalPages);
    }
    return out;
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Transactions</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">Where every dollar shows up</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading your ledger…"
              : `${total.toLocaleString()} transaction${total === 1 ? "" : "s"}${activeFilterChips.length > 0 ? " match your filters" : " in your ledger"}.`}
          </p>
        </div>
        <Button className="gap-1.5 w-full sm:w-auto" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search description or notes…"
                aria-label="Search transactions"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Sort transactions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={filtersOpen || activeFilterChips.length > 0 ? "default" : "outline"}
                className="gap-1.5 shrink-0"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeFilterChips.length > 0 && (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-xs font-semibold tabular-nums">
                    {activeFilterChips.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="rounded-xl border bg-muted/30 p-3.5 animate-slide-down space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="label-mono text-muted-foreground mr-1">Quick dates</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetRange("this-month")}>This month</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetRange("last-month")}>Last month</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPresetRange("last-90")}>Last 90 days</Button>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-2">
                  <div className="space-y-1">
                    <label htmlFor="f-start" className="text-xs text-muted-foreground">From</label>
                    <Input id="f-start" type="date" className="h-9 text-sm" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="f-end" className="text-xs text-muted-foreground">To</label>
                    <Input id="f-end" type="date" className="h-9 text-sm" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="f-min" className="text-xs text-muted-foreground">Min amount</label>
                  <Input id="f-min" type="number" min="0" step="0.01" placeholder="0.00" className="h-9 text-sm" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="f-max" className="text-xs text-muted-foreground">Max amount</label>
                  <Input id="f-max" type="number" min="0" step="0.01" placeholder="No max" className="h-9 text-sm" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label htmlFor="f-category" className="text-xs text-muted-foreground">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger id="f-category" className="h-9 text-sm">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="f-type" className="text-xs text-muted-foreground">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="f-type" className="h-9 text-sm">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="f-tag" className="text-xs text-muted-foreground">Tag</label>
                  <Select value={tagFilter} onValueChange={setTagFilter} disabled={allTags.length === 0}>
                    <SelectTrigger id="f-tag" className="h-9 text-sm">
                      <SelectValue placeholder="Any tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any tag</SelectItem>
                      {allTags.map((t) => (
                        <SelectItem key={t} value={t}>#{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={uncategorizedOnly}
                  onChange={(e) => setUncategorizedOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input accent-primary"
                />
                Uncategorized only
              </label>
              {activeFilterChips.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading || (!data && !isError && !(page === 1 && outboxItems.length > 0)) ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading transactions" />
            </div>
          ) : isError && !data && !(page === 1 && outboxItems.length > 0) ? (
            <ErrorState
              title="Couldn't load your transactions"
              description="We couldn't reach your data. Nothing was lost — try again."
              onRetry={refetch}
            />
          ) : transactions.length === 0 && !(page === 1 && outboxItems.length > 0) ? (
            activeFilterChips.length > 0 ? (
              <div className="text-center py-12 text-muted-foreground px-4">
                <p className="text-sm mb-1 font-medium text-foreground">No transactions match these filters</p>
                <p className="text-sm mb-4">Try widening the date range or clearing the search.</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
                <p className="text-sm mb-1 font-medium text-foreground">No transactions yet</p>
                <p className="text-sm mb-4">Add your first transaction to start tracking.</p>
                <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </div>
            )
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_9rem_7rem_8.5rem_2rem] gap-3 px-4 py-2 label-mono text-muted-foreground border-b bg-muted/20">
                <div>Description</div>
                <div>Category</div>
                <div>Date</div>
                <div className="text-right">Amount</div>
                <div aria-hidden="true" />
              </div>
              <ul>
                {transactions.map((tx) => {
                  const IconComponent = tx.category?.icon
                    ? categoryIconMap[tx.category.icon] ?? Circle
                    : Circle;
                  const color = tx.category?.color ?? "var(--muted-foreground)";
                  const expanded = expandedId === tx.id;
                  return (
                    <li key={tx.id} className="border-b last:border-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : tx.id)}
                        aria-expanded={expanded}
                        className={`group grid w-full grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem_7rem_8.5rem_2rem] items-center gap-1 sm:gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/30 ${expanded ? "bg-muted/40" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                            aria-hidden="true"
                          >
                            <IconComponent className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{tx.description}</span>
                            <span className="block text-xs text-muted-foreground sm:hidden">
                              {tx.category?.name ?? "Uncategorized"} · {formatDate(new Date(tx.date))}
                            </span>
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                            {tx.category?.name ?? "Uncategorized"}
                          </span>
                        </div>
                        <div className="hidden sm:block text-muted-foreground text-xs tabular-nums">
                          {formatDate(new Date(tx.date))}
                        </div>
                        <div className={`text-sm font-medium tabular-nums sm:text-right ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount, tx.currency ?? preferredCurrency)}
                          {isForeignCurrency(tx.currency, preferredCurrency) && tx.amountInPreferred != null && (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              ≈ {formatCurrency(tx.amountInPreferred, preferredCurrency)}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`hidden sm:block h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`}
                          aria-hidden="true"
                        />
                      </button>

                      {expanded && (
                        <div className="animate-slide-down border-t bg-muted/20 px-4 py-4 sm:px-5">
                          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:max-w-lg">
                              <div>
                                <dt className="label-mono text-muted-foreground">Date</dt>
                                <dd className="mt-0.5 tabular-nums">
                                  {new Date(tx.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
                                </dd>
                              </div>
                              <div>
                                <dt className="label-mono text-muted-foreground">Type</dt>
                                <dd className="mt-0.5 capitalize">{tx.type}</dd>
                              </div>
                              <div>
                                <dt className="label-mono text-muted-foreground">Category</dt>
                                <dd className="mt-0.5">{tx.category?.name ?? "Uncategorized"}</dd>
                              </div>
                              <div>
                                <dt className="label-mono text-muted-foreground">Amount</dt>
                                <dd className="mt-0.5 tabular-nums">
                                  {formatCurrency(tx.amount, tx.currency ?? preferredCurrency)}
                                  {isForeignCurrency(tx.currency, preferredCurrency) && tx.amountInPreferred != null && (
                                    <span className="ml-1 text-muted-foreground">
                                      ≈ {formatCurrency(tx.amountInPreferred, preferredCurrency)}
                                      {tx.fxRate != null && ` @ ${tx.fxRate}`}
                                    </span>
                                  )}
                                </dd>
                              </div>
                              {tx.tags && tx.tags.length > 0 && (
                                <div className="col-span-2">
                                  <dt className="label-mono text-muted-foreground">Tags</dt>
                                  <dd className="mt-1 flex flex-wrap gap-1.5">
                                    {tx.tags.map((t) => (
                                      <Badge key={t} variant="secondary" className="font-normal">#{t}</Badge>
                                    ))}
                                  </dd>
                                </div>
                              )}
                              <div className="col-span-2">
                                <dt className="label-mono text-muted-foreground">Notes</dt>
                                <dd className="mt-0.5 text-muted-foreground">
                                  {tx.notes?.trim() || <span className="italic opacity-70">No notes</span>}
                                </dd>
                              </div>
                            </dl>
                            <div className="flex gap-2 sm:flex-col lg:flex-row">
                              <Button
                                variant="outline" size="sm" className="gap-1.5 flex-1"
                                onClick={() => { setEditing(tx); setDialogOpen(true); }}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Edit
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                className="gap-1.5 flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => { deleteTransaction.mutate(tx); setExpandedId(null); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Queued offline creates appear (muted, "Pending sync") on the
                  first page until <OutboxSync> replays them. */}
              {page === 1 && <PendingTransactions currency={preferredCurrency} />}

              {/* Pagination footer — hidden when the page shows only queued
                  offline rows (nothing server-side to paginate). */}
              {transactions.length > 0 && (
              <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground tabular-nums">
                  Showing {rangeStart}–{rangeEnd} of {total.toLocaleString()} · page spent{" "}
                  {formatCurrency(pageTotals.spent, preferredCurrency)}
                  {pageTotals.income > 0 && <> · income {formatCurrency(pageTotals.income, preferredCurrency)}</>}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="page-size" className="text-xs text-muted-foreground">Rows</label>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger id="page-size" className="h-8 w-[4.5rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <nav aria-label="Pagination" className="flex items-center gap-1">
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      aria-label="Previous page"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {pageNumbers.map((n, i) =>
                      n === "…" ? (
                        <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden="true">…</span>
                      ) : (
                        <Button
                          key={n}
                          variant={n === page ? "default" : "ghost"}
                          size="icon"
                          className="h-8 w-8 text-xs tabular-nums"
                          aria-label={`Page ${n}`}
                          aria-current={n === page ? "page" : undefined}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      aria-label="Next page"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pending={createTransaction.isPending || updateTransaction.isPending}
        title={editing ? "Edit Transaction" : "Add Transaction"}
        descriptionSuggestions={descriptionSuggestions}
        defaultValues={editing ? {
          amount: Math.abs(editing.amount),
          currency: editing.currency,
          fxRate: editing.fxRate ?? undefined,
          fxSource: editing.fxSource ?? "auto",
          description: editing.description,
          date: new Date(editing.date).toISOString().split("T")[0],
          type: editing.type,
          categoryId: editing.categoryId || "",
          tags: editing.tags?.join(", ") || "",
          notes: editing.notes || "",
        } : undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
