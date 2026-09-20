import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";

export type Budget = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  currency: string;
  period: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string | null;
  category?: { id: string; name: string; color: string; icon: string } | null;
};

export type BudgetInput = {
  categoryId?: string | null;
  amount: number;
  currency?: string;
  period: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string | null;
};

type RawBudget = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  period: "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; color: string; icon: string } | null;
};

function mapBudget(raw: RawBudget): Budget {
  return {
    id: raw.id,
    userId: raw.user_id,
    categoryId: raw.category_id,
    amount: raw.amount,
    currency: raw.currency,
    period: raw.period,
    startDate: raw.start_date,
    endDate: raw.end_date,
    category: raw.category ?? null,
  };
}

async function fetchBudgets(): Promise<Budget[]> {
  const res = await fetch("/api/budgets");
  if (!res.ok) throw new Error("Failed to fetch budgets");
  const data: RawBudget[] = await res.json();
  return data.map(mapBudget);
}

async function createBudget(data: BudgetInput): Promise<Budget> {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't save the budget. Check the amount and dates, then try again."));
  }
  return mapBudget(await res.json());
}

async function updateBudget(id: string, data: Partial<BudgetInput>): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't update the budget. Check the amount and dates, then try again."));
  }
  return mapBudget(await res.json());
}

async function deleteBudget(id: string): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't delete the budget."));
  }
}

/** Re-creates a deleted budget with its original settings (used by Undo); no toast. */
async function restoreBudget(b: Budget): Promise<void> {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categoryId: b.categoryId,
      amount: b.amount,
      currency: b.currency,
      period: b.period,
      startDate: b.startDate,
      endDate: b.endDate ?? null,
    }),
  });
  if (!res.ok) throw new Error("Undo failed");
}

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets, staleTime: 30_000 });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetInput> }) => updateBudget(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Deletes with a 5s Undo, mirroring the transaction delete flow. */
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (budget: Budget) => deleteBudget(budget.id),
    onSuccess: (_data, budget) => {
      const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["budgets"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
      };
      toast.success(`Budget for ${budget.category?.name ?? "category"} deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreBudget(budget);
              invalidate();
              toast.success("Budget restored");
            } catch {
              toast.error("Couldn't undo — the budget was not restored.");
            }
          },
        },
        duration: 5000,
      });
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
