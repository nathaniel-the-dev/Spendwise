"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCategories } from "@/hooks/use-categories";
import { useSettings } from "@/hooks/use-settings";
import { CategorySelect } from "@/components/shared/category-select";
import { CurrencySelect } from "@/components/shared/currency-select";
import { FxRateField } from "@/components/shared/fx-rate-field";
import { AutocompleteInput } from "@/components/shared/autocomplete-input";
import { isForeignCurrency, missingRateMessage } from "@/lib/fx";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3).optional(),
  fxRate: z.number().positive().optional(),
  fxSource: z.enum(["auto", "manual"]).optional(),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues, addAnother: boolean) => void;
  defaultValues?: Partial<TransactionFormValues>;
  title?: string;
  /** True while the parent's create/update mutation is in flight. */
  pending?: boolean;
  /** Past descriptions offered as autocomplete while typing. */
  descriptionSuggestions?: string[];
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Transaction",
  pending = false,
  descriptionSuggestions = [],
}: Props) {
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const isEdit = Boolean(defaultValues?.description);
  const [showMore, setShowMore] = useState(false);
  const [addAnother, setAddAnother] = useState(false);
  const wasPending = useRef(false);
  const keepOpenForAnother = useRef(false);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      currency: preferredCurrency,
      description: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      categoryId: "",
      notes: "",
      ...defaultValues,
    },
  });

  const watchedCurrency = form.watch("currency") || preferredCurrency;
  const watchedAmount = form.watch("amount");
  const watchedRate = form.watch("fxRate");
  const watchedSource = form.watch("fxSource") ?? "auto";

  const handleRateChange = useCallback(
    (rate: number | undefined, source: "auto" | "manual") => {
      form.setValue("fxRate", rate, { shouldDirty: true });
      form.setValue("fxSource", source, { shouldDirty: true });
      // Supplying a usable rate satisfies the submit guard, so retire its message.
      if (rate != null && rate > 0) form.clearErrors("fxRate");
    },
    [form]
  );

  // Switching back to the preferred currency must not leave a stale rate behind.
  useEffect(() => {
    if (!isForeignCurrency(watchedCurrency, preferredCurrency)) {
      form.setValue("fxRate", undefined);
      form.setValue("fxSource", "auto");
    }
  }, [watchedCurrency, preferredCurrency, form]);

  useEffect(() => {
    if (open) {
      setShowMore(Boolean(defaultValues?.tags || defaultValues?.notes));
      form.reset({
        amount: 0, currency: preferredCurrency, description: "", date: new Date().toISOString().split("T")[0],
        type: "expense", categoryId: "", tags: "", notes: "", ...defaultValues,
      });
    }
  }, [open, defaultValues, preferredCurrency, form]);

  // After a "save & add another" mutation lands, the parent keeps the dialog
  // open; clear the per-entry fields but keep type/date/category so
  // batch entry (10 receipts) costs one keystroke per row, not one form.
  useEffect(() => {
    if (wasPending.current && !pending && open && keepOpenForAnother.current) {
      keepOpenForAnother.current = false;
      const v = form.getValues();
      form.reset({ ...v, amount: 0, description: "", tags: "", notes: "" });
    }
    wasPending.current = pending;
  }, [pending, open, form]);

  function handleSubmit(data: TransactionFormValues) {
    // A foreign amount with no rate would be stored without a snapshot and
    // silently totalled as if it were already in the preferred currency.
    const rateError = missingRateMessage(data.currency, preferredCurrency, data.fxRate);
    if (rateError) {
      form.setError("fxRate", { type: "manual", message: rateError });
      return;
    }
    keepOpenForAnother.current = addAnother && !isEdit;
    onSubmit(data, addAnother && !isEdit);
    if (!addAnother) setAddAnother(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{isEdit ? "Update this transaction." : "Record a new transaction."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" autoFocus {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-currency">Currency</Label>
              <CurrencySelect
                id="transaction-currency"
                value={watchedCurrency}
                onValueChange={(v) => form.setValue("currency", v, { shouldDirty: true })}
              />
            </div>
          </div>

          <FxRateField
            id="transaction-fx-rate"
            amount={Number(watchedAmount) || 0}
            currency={watchedCurrency}
            preferredCurrency={preferredCurrency}
            rate={watchedRate}
            source={watchedSource}
            onRateChange={handleRateChange}
            error={form.formState.errors.fxRate?.message}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <AutocompleteInput
              id="description"
              placeholder="e.g. Grocery store"
              value={form.watch("description")}
              onChange={(v) => form.setValue("description", v, { shouldDirty: true, shouldValidate: true })}
              suggestions={descriptionSuggestions}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as "expense" | "income")}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-category">Category</Label>
            <CategorySelect
              id="transaction-category"
              categories={categories}
              value={form.watch("categoryId") || "none"}
              onValueChange={(v) => form.setValue("categoryId", v === "none" ? "" : v)}
              noneLabel="No category"
              placeholder="No category"
            />
            <p className="text-xs text-muted-foreground">
              Categorizing is what powers budgets and reports — uncategorized spending is invisible to both.
            </p>
          </div>

          {!showMore && !isEdit && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Add tags or notes
            </button>
          )}
          {(showMore || isEdit) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated, optional)</Label>
                <Input id="tags" placeholder="e.g. food, groceries" {...form.register("tags")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" placeholder="Add notes..." {...form.register("notes")} />
              </div>
            </>
          )}

          <DialogFooter className="items-center gap-2 sm:justify-between">
            {!isEdit && (
              <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={addAnother}
                  onChange={(e) => setAddAnother(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input accent-primary"
                />
                Keep adding
              </label>
            )}
            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isEdit ? "Save" : addAnother ? "Add & New" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
