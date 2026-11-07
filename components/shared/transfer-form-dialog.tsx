"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountSelect } from "@/components/shared/account-select";
import { useAccounts } from "@/hooks/use-accounts";
import { useSettings } from "@/hooks/use-settings";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect } from "react";

const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Pick where the money is coming from"),
    toAccountId: z.string().min(1, "Pick where it's going"),
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z.string().min(1, "Date is required"),
    description: z.string().optional(),
    notes: z.string().optional(),
  })
  // Matches the DB's transfer_distinct_accounts check, but the user finds out
  // here rather than from a 500.
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "Pick two different accounts",
    path: ["toAccountId"],
  });

export type TransferFormValues = z.infer<typeof transferSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransferFormValues) => void;
  defaultValues?: Partial<TransferFormValues>;
  title?: string;
  /** True while the parent's create mutation is in flight. */
  pending?: boolean;
};

export function TransferFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Move Money",
  pending = false,
}: Props) {
  const { data: accounts } = useAccounts();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const activeAccounts = (accounts ?? []).filter((a) => !a.isArchived);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      description: "",
      notes: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fromAccountId: "",
        toAccountId: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        notes: "",
        ...defaultValues,
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Move money between your accounts. This isn't spending — it leaves your totals alone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-from">From</Label>
            <AccountSelect
              id="transfer-from"
              accounts={activeAccounts}
              value={form.watch("fromAccountId")}
              onValueChange={(v) => form.setValue("fromAccountId", v, { shouldValidate: true })}
              placeholder="Source account"
              aria-invalid={!!form.formState.errors.fromAccountId}
              aria-describedby={form.formState.errors.fromAccountId ? "transfer-from-error" : undefined}
            />
            {form.formState.errors.fromAccountId && (
              <p id="transfer-from-error" className="text-sm text-destructive">{form.formState.errors.fromAccountId.message}</p>
            )}
          </div>

          <div className="flex justify-center -my-1" aria-hidden="true">
            <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-to">To</Label>
            <AccountSelect
              id="transfer-to"
              accounts={activeAccounts}
              value={form.watch("toAccountId")}
              onValueChange={(v) => form.setValue("toAccountId", v, { shouldValidate: true })}
              placeholder="Destination account"
              aria-invalid={!!form.formState.errors.toAccountId}
              aria-describedby={form.formState.errors.toAccountId ? "transfer-to-error" : undefined}
            />
            {form.formState.errors.toAccountId && (
              <p id="transfer-to-error" className="text-sm text-destructive">{form.formState.errors.toAccountId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-invalid={!!form.formState.errors.amount}
                aria-describedby={form.formState.errors.amount ? "transfer-amount-error" : undefined}
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p id="transfer-amount-error" className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-date">Date</Label>
              <Input id="transfer-date" type="date" aria-invalid={!!form.formState.errors.date} aria-describedby={form.formState.errors.date ? "transfer-date-error" : undefined} {...form.register("date")} />
              {form.formState.errors.date && (
                <p id="transfer-date-error" className="text-sm text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-description">Description (optional)</Label>
            <Input
              id="transfer-description"
              placeholder="e.g. Moving money to savings"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notes (optional)</Label>
            <Input id="transfer-notes" placeholder="Add notes..." {...form.register("notes")} />
          </div>

          <p className="text-xs text-muted-foreground">
            Amounts are recorded in {preferredCurrency}. Moving money between currencies isn't
            supported yet.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || activeAccounts.length < 2}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {activeAccounts.length < 2 ? "Add two accounts first" : "Move money"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
