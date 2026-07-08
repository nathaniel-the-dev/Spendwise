import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

async function fetchBudgets(): Promise<Budget[]> {
  const res = await fetch("/api/budgets");
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return res.json();
}

async function createBudget(data: BudgetInput): Promise<Budget> {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create budget");
  }
  return res.json();
}

async function updateBudget(id: string, data: Partial<BudgetInput>): Promise<Budget> {
  const res = await fetch(`/api/budgets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update budget");
  }
  return res.json();
}

async function deleteBudget(id: string): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete budget");
  }
}

export function useBudgets() {
  return useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets });
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

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
