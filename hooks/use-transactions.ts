import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
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
  minAmount?: number;
  maxAmount?: number;
  uncategorized?: boolean;
  tag?: string;
  sort?: "date" | "amount";
  dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

type RawTransaction = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  type: "expense" | "income";
  category_id: string | null;
  user_id: string;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; color: string; icon: string } | null;
};

function mapTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    amount: raw.amount,
    currency: raw.currency,
    description: raw.description,
    date: raw.date,
    type: raw.type,
    categoryId: raw.category_id,
    userId: raw.user_id,
    tags: raw.tags,
    notes: raw.notes,
    category: raw.category ?? null,
  };
}

async function fetchTransactionsWithCount(
  filters?: TransactionFilters
): Promise<{ items: Transaction[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.minAmount != null) params.set("minAmount", String(filters.minAmount));
  if (filters?.maxAmount != null) params.set("maxAmount", String(filters.maxAmount));
  if (filters?.uncategorized) params.set("uncategorized", "true");
  if (filters?.tag) params.set("tag", filters.tag);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.dir) params.set("dir", filters.dir);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();
  const res = await fetch(`/api/transactions${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const total = Number(res.headers.get("X-Total-Count")) || 0;
  const data: RawTransaction[] = await res.json();
  return { items: data.map(mapTransaction), total };
}

async function fetchTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const { items } = await fetchTransactionsWithCount(filters);
  return items;
}

async function createTransaction(data: TransactionInput): Promise<Transaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't save the transaction. Check the amount and date, then try again."));
  }
  return mapTransaction(await res.json());
}

async function updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't update the transaction. Check the amount and date, then try again."));
  }
  return mapTransaction(await res.json());
}

async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't delete the transaction."));
  }
}

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 30_000,
  });
}

export const TRANSACTIONS_PAGE_SIZE = 25;

/**
 * One page of the ledger, addressed by page number (true pagination, not
 * infinite scroll). Returns the rows plus the server-side total so the
 * pager can compute page counts.
 */
export function useTransactionsPage(
  filters: Omit<TransactionFilters, "limit" | "offset">,
  page: number,
  pageSize: number = TRANSACTIONS_PAGE_SIZE
) {
  return useQuery({
    queryKey: ["transactions-page", filters, page, pageSize],
    queryFn: () =>
      fetchTransactionsWithCount({ ...filters, limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/** Re-creates a deleted transaction exactly as stored (used by Undo); no toast. */
async function restoreTransaction(tx: Transaction): Promise<void> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      date: tx.date,
      type: tx.type,
      categoryId: tx.categoryId,
      tags: tx.tags ?? undefined,
      notes: tx.notes,
    }),
  });
  if (!res.ok) throw new Error("Undo failed");
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions-page"] });
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
      qc.invalidateQueries({ queryKey: ["transactions-page"] });
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Deletes a transaction and offers Undo for 5s. Undo re-creates the exact
 * stored row (amount, currency, and all fields included), so a
 * mistap never costs data. The dialog is gone from the hot path: destructive
 * but reversible beats a wall of "cannot be undone".
 */
export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tx: Transaction) => deleteTransaction(tx.id),
    onSuccess: (_data, tx) => {
      const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["transactions-page"] });
      };
      toast.success("Transaction deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreTransaction(tx);
              invalidate();
              toast.success("Transaction restored");
            } catch {
              toast.error("Couldn't undo — the transaction was not restored.");
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
