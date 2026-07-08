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
import { currencies } from "@/lib/utils";
import { useEffect } from "react";

const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3).optional(),
  billingCycle: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
  billingInterval: z.coerce.number().int().positive().optional(),
  categoryId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  nextBillingDate: z.string().min(1, "Next billing date is required"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubscriptionFormValues) => void;
  defaultValues?: Partial<SubscriptionFormValues>;
  title?: string;
};

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Subscription",
}: Props) {
  const { data: categories } = useCategories();
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      provider: "",
      amount: 0,
      currency: "USD",
      billingCycle: "monthly",
      billingInterval: 1,
      categoryId: "",
      startDate: new Date().toISOString().split("T")[0],
      nextBillingDate: "",
      endDate: "",
      notes: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) form.reset({
      name: "", provider: "", amount: 0, currency: "USD",
      billingCycle: "monthly", billingInterval: 1, categoryId: "",
      startDate: new Date().toISOString().split("T")[0], nextBillingDate: "", endDate: "", notes: "",
      ...defaultValues,
    });
  }, [open, defaultValues, form]);

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
              <Label>Currency</Label>
              <Select
                value={form.watch("currency") || "USD"}
                onValueChange={(v) => form.setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} - {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                value={form.watch("billingCycle")}
                onValueChange={(v) => form.setValue("billingCycle", v as "weekly" | "monthly" | "quarterly" | "yearly" | "custom")}
              >
                <SelectTrigger>
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
            {form.watch("billingCycle") === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="billingInterval">Days</Label>
                <Input id="billingInterval" type="number" min="1" {...form.register("billingInterval")} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.watch("categoryId")}
                onValueChange={(v) => form.setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="Add notes..." {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{defaultValues?.name ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
