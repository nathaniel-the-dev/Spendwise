import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  amountInPreferred: number | null;
  description: string;
  date: string;
  type: "expense" | "income";
  categoryId: string | null;
  userId: string;
  tags: string[] | null;
  notes: string | null;
  category?: { id: string; name: string; color: string; icon: string } | null;
};

export type TransactionInput = {
  amount: number;
  currency?: string;
  amountInPreferred?: number;
  description: string;
  date: string;
  type?: "expense" | "income";
  categoryId?: string | null;
  tags?: string[];
  notes?: string | null;
};

export type TransactionFilters = {
  search?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

async function fetchTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();
  const res = await fetch(`/api/transactions${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

async function createTransaction(data: TransactionInput): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create transaction");
  }
  return res.json();
}

async function updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update transaction");
  }
  return res.json();
}

async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete transaction");
  }
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionInput> }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
