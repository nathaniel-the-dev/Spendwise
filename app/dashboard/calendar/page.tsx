"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, getDefaultLocale, txValue } from "@/lib/utils";
import {
  dayKey,
  dayLabel,
  daysInMonth,
  shiftCursor,
  startOfDay,
  viewDays,
  viewRange,
  viewTitle,
  weekdayLabels,
  withAlpha,
  type CalendarView,
} from "@/lib/calendar";
import { MonthPicker } from "@/components/calendar/month-picker";
import { CategoryPills, type CategoryOption } from "@/components/calendar/category-pills";
import { MiniMonth } from "@/components/calendar/mini-month";
import { CalendarGrid, CalendarGridSkeleton } from "@/components/calendar/calendar-grid";
import type { CalendarCategory } from "@/components/calendar/calendar-day-cell";
import { ErrorState } from "@/components/shared/error-state";
import { categoryIconMap } from "@/components/category-icon";
import {
  TransactionFormDialog,
  type TransactionFormValues,
} from "@/components/shared/transaction-form-dialog";
import {
  useCreateTransaction,
  useTransactions,
  useUpdateTransaction,
  type Transaction,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useSettings } from "@/hooks/use-settings";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const UNCATEGORIZED = "#6b7280";

export default function CalendarPage() {
  const locale = getDefaultLocale();
  const currency = useSettings().data?.preferredCurrency ?? "USD";
  const { data: categories } = useCategories();

  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [draftDate, setDraftDate] = useState(() => dayKey(new Date()));

  // Only the days the current view can paint are fetched — the grid's leading
  // and trailing days included.
  const range = useMemo(() => viewRange(view, cursor), [view, cursor]);
  const filters = useMemo(
    () => ({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
      limit: 200,
      sort: "date" as const,
      dir: "asc" as const,
    }),
    [range]
  );
  const { data: transactions, isLoading, isError, refetch } = useTransactions(filters);

  // One row is enough to learn the earliest year the user has data for, which
  // bounds the year list instead of guessing a decade.
  const { data: oldest } = useTransactions({ sort: "date", dir: "asc", limit: 1 });

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => viewDays(view, cursor), [view, cursor]);
  const labels = useMemo(() => weekdayLabels(locale), [locale]);
  const active = useMemo(() => new Set(activeIds), [activeIds]);
  const dimming = active.size > 0;

  const categoryById = useMemo(() => {
    const map = new Map<string, CalendarCategory>();
    for (const c of categories ?? []) map.set(c.id, { name: c.name, color: c.color, icon: c.icon });
    return map;
  }, [categories]);

  const { byDay, matchCountByDay, matchColorByDay, options, daysWithTx, matchingDays, summary } =
    useMemo(() => {
      const byDay = new Map<string, Transaction[]>();
      const matchCountByDay = new Map<string, number>();
      const matchColorByDay = new Map<string, string>();
      const daysWithTx = new Set<string>();
      const matchingDays = new Set<string>();
      const countsByCat = new Map<string, { count: number; total: number }>();

      for (const tx of transactions ?? []) {
        const key = dayKey(new Date(tx.date));
        const bucket = byDay.get(key);
        if (bucket) bucket.push(tx);
        else byDay.set(key, [tx]);
        daysWithTx.add(key);

        const catId = tx.categoryId ?? "none";
        const entry = countsByCat.get(catId) ?? { count: 0, total: 0 };
        entry.count += 1;
        entry.total += txValue(tx);
        countsByCat.set(catId, entry);

        if (active.has(catId)) {
          matchCountByDay.set(key, (matchCountByDay.get(key) ?? 0) + 1);
          matchingDays.add(key);
          if (!matchColorByDay.has(key)) {
            matchColorByDay.set(key, categoryById.get(catId)?.color ?? UNCATEGORIZED);
          }
        }
      }

      const options: CategoryOption[] = Array.from(countsByCat.entries()).map(([id, value]) => {
        const category = categoryById.get(id);
        return {
          id,
          name: id === "none" ? "Uncategorized" : (category?.name ?? "Unknown"),
          color: category?.color ?? UNCATEGORIZED,
          icon: category?.icon ?? "circle",
          count: value.count,
          total: value.total,
        };
      });
      options.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      // The summary answers "how much" — scoped to the selected categories when
      // a filter is on, so the totals match the highlighted days exactly.
      const scope = dimming
        ? (transactions ?? []).filter((tx) => active.has(tx.categoryId ?? "none"))
        : (transactions ?? []);
      let out = 0;
      let income = 0;
      for (const tx of scope) {
        if (tx.type === "expense") out += txValue(tx);
        else income += txValue(tx);
      }

      return {
        byDay,
        matchCountByDay,
        matchColorByDay,
        options,
        daysWithTx,
        matchingDays,
        summary: { out, income, net: income - out, count: scope.length },
      };
    }, [transactions, active, dimming, categoryById]);

  const selectedDayTx = byDay.get(dayKey(selected)) ?? [];
  const selectedOut = selectedDayTx.reduce(
    (sum, tx) => (tx.type === "expense" ? sum + txValue(tx) : sum),
    0
  );
  const selectedIn = selectedDayTx.reduce(
    (sum, tx) => (tx.type === "income" ? sum + txValue(tx) : sum),
    0
  );

  const dialogDefaults = useMemo<Partial<TransactionFormValues>>(
    () =>
      editing
        ? {
            amount: Math.abs(editing.amount),
            currency: editing.currency,
            fxRate: editing.fxRate ?? undefined,
            fxSource: editing.fxSource ?? "auto",
            description: editing.description,
            date: dayKey(new Date(editing.date)),
            type: editing.type,
            categoryId: editing.categoryId || "",
            tags: editing.tags?.join(", ") || "",
            notes: editing.notes || "",
          }
        : { date: draftDate },
    [editing, draftDate]
  );

  function selectDay(day: Date) {
    const next = startOfDay(day);
    setSelected(next);
    if (
      view === "month" &&
      (next.getMonth() !== cursor.getMonth() || next.getFullYear() !== cursor.getFullYear())
    ) {
      setCursor(next);
    }
  }

  function shift(direction: 1 | -1) {
    setCursor((current) => shiftCursor(view, current, direction));
  }

  /** Jump to a period without walking the timeline one arrow-click at a time. */
  function jumpToDate(date: Date) {
    const next = startOfDay(date);
    setCursor(next);
    setSelected(next);
  }

  /** Keep the same day-of-month where the target month allows it. */
  function jumpToMonth(year: number, monthIndex: number) {
    const target = new Date(year, monthIndex, 1);
    jumpToDate(new Date(year, monthIndex, Math.min(selected.getDate(), daysInMonth(target))));
  }

  function goToToday() {
    jumpToDate(new Date());
  }

  function openAdd(day: Date) {
    setEditing(null);
    setDraftDate(dayKey(day));
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setDialogOpen(true);
  }

  function handleSubmit(values: TransactionFormValues, addAnother: boolean) {
    const payload = {
      amount: values.amount,
      currency: values.currency || currency,
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
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditing(null);
          },
        }
      );
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => {
          if (!addAnother) setDialogOpen(false);
        },
      });
    }
  }

  const activeColor = activeIds[0] ? (categoryById.get(activeIds[0])?.color ?? UNCATEGORIZED) : null;

  // The year list spans the user's earliest data through next year, widened to
  // include wherever the cursor currently sits.
  const oldestYear = oldest?.[0] ? new Date(oldest[0].date).getFullYear() : null;
  const minYear = Math.min(oldestYear ?? today.getFullYear() - 5, cursor.getFullYear());
  const maxYear = Math.max(today.getFullYear() + 1, cursor.getFullYear());

  const periodPhrase =
    view === "month"
      ? `in ${viewTitle(view, cursor, locale)}`
      : view === "week"
        ? `in the week of ${viewTitle(view, cursor, locale)}`
        : `on ${dayLabel(cursor, locale)}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Calendar</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
            Your money, day by day
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {summary.count} transaction{summary.count === 1 ? "" : "s"}
            {dimming ? " for the highlighted categories" : ""} {periodPhrase}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Calendar view"
            className="inline-flex rounded-lg border bg-card p-0.5"
          >
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                  "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                  view === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button className="gap-1.5" onClick={() => openAdd(selected)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1 space-y-4">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="label-mono text-muted-foreground">Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <CategoryPills
                options={options}
                selected={activeIds}
                onToggle={(id) =>
                  setActiveIds((ids) =>
                    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
                  )
                }
                onClear={() => setActiveIds([])}
                currency={currency}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {dimming
                  ? "Highlighted days carry the selected categories; everything else is dimmed."
                  : "Select a category to highlight the days it was used — and how many times."}
              </p>
            </CardContent>
          </Card>

          <MiniMonth
            className="hidden lg:block"
            cursor={cursor}
            selected={selected}
            today={today}
            daysWithTransactions={daysWithTx}
            matchingDays={matchingDays}
            dimming={dimming}
            weekdayLabels={labels}
            locale={locale}
            onSelectDay={selectDay}
            onShiftMonth={(direction) => setCursor((current) => shiftCursor("month", current, direction))}
          />
        </aside>

        <section className="order-1 lg:order-2 min-w-0 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3 space-y-0">
              <div className="flex min-w-0 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => shift(-1)}
                  aria-label={`Previous ${view}`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <MonthPicker
                  label={viewTitle(view, cursor, locale)}
                  year={cursor.getFullYear()}
                  month={cursor.getMonth()}
                  minYear={minYear}
                  maxYear={maxYear}
                  date={selected}
                  today={today}
                  locale={locale}
                  onSelectMonth={jumpToMonth}
                  onSelectDate={jumpToDate}
                  className="min-w-0 flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => shift(1)}
                  aria-label={`Next ${view}`}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={goToToday}>
                Today
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {isError && !transactions ? (
                <div className="p-5">
                  <ErrorState
                    title="Couldn't load your calendar"
                    description="We couldn't reach your transactions. Nothing was lost — try again."
                    onRetry={refetch}
                  />
                </div>
              ) : isLoading && !transactions ? (
                <CalendarGridSkeleton view={view} />
              ) : (
                <CalendarGrid
                  view={view}
                  cursor={cursor}
                  days={days}
                  byDay={byDay}
                  matchCountByDay={matchCountByDay}
                  matchColorByDay={matchColorByDay}
                  categoryById={categoryById}
                  activeIds={active}
                  selected={selected}
                  today={today}
                  currency={currency}
                  weekdayLabels={labels}
                  onSelectDay={selectDay}
                />
              )}
            </CardContent>

            <CardFooter className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Out{" "}
                <span className="font-medium tabular-nums text-spend">
                  −{formatCurrency(summary.out, currency)}
                </span>
              </span>
              <span>
                In{" "}
                <span className="font-medium tabular-nums text-success">
                  +{formatCurrency(summary.income, currency)}
                </span>
              </span>
              <span>
                Net{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {summary.net < 0 ? "−" : "+"}
                  {formatCurrency(Math.abs(summary.net), currency)}
                </span>
              </span>
              {dimming && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activeColor ?? UNCATEGORIZED }}
                    aria-hidden="true"
                  />
                  Highlighting {activeIds.length} categor{activeIds.length === 1 ? "y" : "ies"}
                </span>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 space-y-0">
              <div className="min-w-0">
                <CardTitle className="label-mono text-muted-foreground">Selected day</CardTitle>
                <p className="mt-1.5 truncate text-sm font-semibold">
                  {dayLabel(selected, locale)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => openAdd(selected)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {selectedDayTx.length === 0 ? (
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p>
                    No transactions on this day. Pick another day on the grid, or add one here to
                    start the record.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {selectedDayTx.length} transaction{selectedDayTx.length === 1 ? "" : "s"}
                    </span>
                    {selectedOut > 0 && (
                      <span>
                        Out{" "}
                        <span className="font-medium tabular-nums text-spend">
                          −{formatCurrency(selectedOut, currency)}
                        </span>
                      </span>
                    )}
                    {selectedIn > 0 && (
                      <span>
                        In{" "}
                        <span className="font-medium tabular-nums text-success">
                          +{formatCurrency(selectedIn, currency)}
                        </span>
                      </span>
                    )}
                  </div>
                  <ul className="divide-y divide-border">
                    {selectedDayTx.map((tx) => {
                      const category = tx.categoryId ? categoryById.get(tx.categoryId) : undefined;
                      const color = category?.color ?? UNCATEGORIZED;
                      const Icon = category ? (categoryIconMap[category.icon] ?? Circle) : Circle;
                      const isMatch = active.has(tx.categoryId ?? "none");
                      return (
                        <li key={tx.id}>
                          <button
                            type="button"
                            onClick={() => openEdit(tx)}
                            className={cn(
                              "-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-150",
                              "hover:bg-accent/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                              dimming && !isMatch && "opacity-40"
                            )}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: withAlpha(color, 0.15) }}
                            >
                              <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">{tx.description}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {category?.name ?? "Uncategorized"}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 text-sm font-medium tabular-nums",
                                tx.type === "income" ? "text-success" : "text-foreground"
                              )}
                            >
                              {tx.type === "income" ? "+" : "−"}
                              {formatCurrency(txValue(tx), currency)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pending={createTransaction.isPending || updateTransaction.isPending}
        title={editing ? "Edit Transaction" : "Add Transaction"}
        defaultValues={dialogDefaults}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
