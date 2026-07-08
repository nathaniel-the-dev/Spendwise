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

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3).optional(),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues) => void;
  defaultValues?: Partial<TransactionFormValues>;
  title?: string;
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Add Transaction",
}: Props) {
  const { data: categories } = useCategories();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      currency: "USD",
      description: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      categoryId: "",
      notes: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) form.reset({
      amount: 0, currency: "USD", description: "", date: new Date().toISOString().split("T")[0],
      type: "expense", categoryId: "", notes: "", ...defaultValues,
    });
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Record a new transaction.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                defaultValue={form.watch("currency") || "USD"}
                onValueChange={(v) => form.setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g. Grocery store" {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                defaultValue={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as "expense" | "income")}
              >
                <SelectTrigger>
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
            <Label>Category</Label>
            <Select
              defaultValue={form.watch("categoryId")}
              onValueChange={(v) => form.setValue("categoryId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="Add notes..." {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{defaultValues?.description ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
