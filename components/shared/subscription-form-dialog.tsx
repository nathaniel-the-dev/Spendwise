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
import { isForeignCurrency } from "@/lib/fx";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const subscriptionSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    provider: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().length(3).optional(),
    fxRate: z.number().positive().optional(),
    fxSource: z.enum(["auto", "manual"]).optional(),
    billingCycle: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
    billingInterval: z.coerce.number().int().positive().optional(),
    categoryId: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    nextBillingDate: z.string().min(1, "Next billing date is required"),
    endDate: z.string().optional(),
    status: z.enum(["active", "paused", "cancelled"]).optional(),
    notes: z.string().optional(),
  })
  .refine((d) => !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubscriptionFormValues) => void;
  defaultValues?: Partial<SubscriptionFormValues>;
  title?: string;
  /** True while the parent's create/update mutation is in flight. */
  pending?: boolean;
};

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Subscription",
  pending = false,
}: Props) {
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const isEdit = Boolean(defaultValues?.name);
  const [showMore, setShowMore] = useState(false);
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      provider: "",
      amount: 0,
      currency: preferredCurrency,
      billingCycle: "monthly",
      billingInterval: 1,
      categoryId: "",
      startDate: new Date().toISOString().split("T")[0],
      nextBillingDate: "",
      endDate: "",
      status: "active",
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
    if (open) form.reset({
      name: "", provider: "", amount: 0, currency: preferredCurrency,
      billingCycle: "monthly", billingInterval: 1, categoryId: "",
      startDate: new Date().toISOString().split("T")[0], nextBillingDate: "", endDate: "", status: "active", notes: "",
      ...defaultValues,
    });
  }, [open, defaultValues, preferredCurrency, form]);

  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Track a recurring subscription.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Netflix" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider (optional)</Label>
              <Input id="provider" placeholder="e.g. Netflix Inc." {...form.register("provider")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription-currency">Currency</Label>
              <CurrencySelect
                id="subscription-currency"
                value={watchedCurrency}
                onValueChange={(v) => form.setValue("currency", v, { shouldDirty: true })}
              />
            </div>
          </div>

          <FxRateField
            id="subscription-fx-rate"
            amount={Number(watchedAmount) || 0}
            currency={watchedCurrency}
            preferredCurrency={preferredCurrency}
            rate={watchedRate}
            source={watchedSource}
            onRateChange={handleRateChange}
          />

          <div className="space-y-2">
            <Label htmlFor="subscription-billing-cycle">Billing Cycle</Label>
            <Select
              value={form.watch("billingCycle")}
              onValueChange={(v) => form.setValue("billingCycle", v as "weekly" | "monthly" | "quarterly" | "yearly" | "custom")}
            >
              <SelectTrigger id="subscription-billing-cycle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.watch("billingCycle") === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="billingInterval">Days</Label>
                <Input id="billingInterval" type="number" min="1" {...form.register("billingInterval")} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="subscription-category">Category</Label>
              <CategorySelect
                id="subscription-category"
                categories={expenseCategories}
                value={form.watch("categoryId") || "none"}
                onValueChange={(v) => form.setValue("categoryId", v === "none" ? "" : v)}
                noneLabel="No category"
                placeholder="No category"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...form.register("startDate")} />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Next Billing Date</Label>
              <Input id="nextBillingDate" type="date" {...form.register("nextBillingDate")} />
              {form.formState.errors.nextBillingDate && (
                <p className="text-sm text-destructive">{form.formState.errors.nextBillingDate.message}</p>
              )}
            </div>
          </div>

          {!showMore && (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              More options (status, end date, notes)
            </button>
          )}
          {(showMore || isEdit) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription-status">Status</Label>
                  <Select
                    value={form.watch("status") || "active"}
                    onValueChange={(v) => form.setValue("status", v as "active" | "paused" | "cancelled")}
                  >
                    <SelectTrigger id="subscription-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused — not counted in commitments</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (optional)</Label>
                  <Input id="endDate" type="date" {...form.register("endDate")} />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" placeholder="Add notes..." {...form.register("notes")} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
