"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useSettings } from "@/hooks/use-settings";
import {
  TransactionFormDialog,
  type TransactionFormValues,
} from "@/components/shared/transaction-form-dialog";

/**
 * Floating quick-entry: record a transaction from any dashboard page without
 * a trip to the transactions list. Hidden on /dashboard/transactions, which
 * already owns its own add button and dialog state.
 *
 * Mounted once in the dashboard layout (inside <RestoreGate>), so it never
 * races query-cache hydration, and sits below the mobile sidebar backdrop
 * (z-40) so opening the menu correctly dims it.
 */
export function QuickAddFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const createTransaction = useCreateTransaction();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";

  if (pathname === "/dashboard/transactions") return null;

  function handleSubmit(values: TransactionFormValues, addAnother: boolean) {
    createTransaction.mutate(
      {
        amount: values.amount,
        currency: preferredCurrency,
        description: values.description,
        date: new Date(values.date).toISOString(),
        type: values.type,
        categoryId: values.categoryId || null,
        tags: values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        notes: values.notes || null,
      },
      { onSuccess: () => { if (!addAnother) setOpen(false); } }
    );
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label="Add transaction"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-30 h-14 w-14 rounded-full shadow-lg transition-[transform,shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </Button>

      <TransactionFormDialog
        open={open}
        onOpenChange={setOpen}
        pending={createTransaction.isPending}
        onSubmit={handleSubmit}
      />
    </>
  );
}
