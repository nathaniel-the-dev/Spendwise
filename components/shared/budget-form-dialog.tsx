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
import { useEffect } from "react";

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetFormValues) => void;
  defaultValues?: Partial<BudgetFormValues>;
  title?: string;
};

export function BudgetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Create Budget",
}: Props) {
  const { data: categories } = useCategories();
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) form.reset({
      categoryId: "", amount: 0, period: "monthly",
      startDate: new Date().toISOString().split("T")[0], endDate: "",
      ...defaultValues,
    });
  }, [open, defaultValues, form]);

  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Set a spending limit for a category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("categoryId")}
              onValueChange={(v) => form.setValue("categoryId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...form.register("amount")} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={form.watch("period")}
                onValueChange={(v) => form.setValue("period", v as "weekly" | "monthly" | "yearly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
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
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input id="endDate" type="date" {...form.register("endDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{defaultValues?.categoryId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
