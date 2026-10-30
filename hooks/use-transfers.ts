import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";

/** The account fields the transfer list needs for its two name columns. */
type AccountRef = {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
};

export type Transfer = {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  /** `YYYY-MM-DD`, kept as a string — parsing it would shift the day in negative-offset timezones. */
  date: string;
  description: string | null;
  notes: string | null;
  amountInPreferred: number | null;
  fxRate: number | null;
  fxRateAt: string | null;
  fxSource: "auto" | "manual" | null;
  fromAccount?: AccountRef | null;
  toAccount?: AccountRef | null;
  createdAt: string;
  updatedAt: string;
};

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  date?: string;
  description?: string | null;
  notes?: string | null;
  fxRate?: number | null;
  fxSource?: "auto" | "manual" | null;
};

export type TransferFilters = {
  fromAccountId?: string;
  toAccountId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

type RawTransfer = {
  id?: string;
  user_id?: string;
  from_account_id?: string;
  to_account_id?: string;
  amount?: string | number;
  currency?: string;
  date?: string;
  description?: string | null;
  notes?: string | null;
  amount_in_preferred?: string | number | null;
  fx_rate?: string | number | null;
  fx_rate_at?: string | null;
  fx_source?: string | null;
  created_at?: string;
  updated_at?: string;
  from_account?: AccountRef | null;
  to_account?: AccountRef | null;
};

/** Postgres `numeric` arrives as a string over PostgREST; coerce defensively. */
function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nullableNum(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapTransfer(raw: RawTransfer): Transfer {
  return {
    id: raw.id ?? "",
    userId: raw.user_id ?? "",
    fromAccountId: raw.from_account_id ?? "",
    toAccountId: raw.to_account_id ?? "",
    amount: num(raw.amount),
    currency: raw.currency ?? "USD",
    date: raw.date ?? "",
    description: raw.description ?? null,
    notes: raw.notes ?? null,
    amountInPreferred: nullableNum(raw.amount_in_preferred),
    fxRate: nullableNum(raw.fx_rate),
    fxRateAt: raw.fx_rate_at ?? null,
    fxSource: (raw.fx_source as Transfer["fxSource"]) ?? null,
    fromAccount: raw.from_account ?? null,
    toAccount: raw.to_account ?? null,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
  };
}

async function fetchTransfers(filters?: TransferFilters): Promise<Transfer[]> {
  const params = new URLSearchParams();
  if (filters?.fromAccountId) params.set("fromAccountId", filters.fromAccountId);
  if (filters?.toAccountId) params.set("toAccountId", filters.toAccountId);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const res = await fetch(`/api/transfers${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't load your transfers. Try again in a moment.")
    );
  }
  const data: RawTransfer[] = await res.json();
  return data.map(mapTransfer);
}

async function createTransfer(data: TransferInput): Promise<Transfer> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't save the transfer. Check both accounts and the amount, then try again.")
    );
  }
  return mapTransfer(await res.json());
}

async function updateTransfer(id: string, data: Partial<TransferInput>): Promise<Transfer> {
  const res = await fetch(`/api/transfers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't update the transfer. Check both accounts and the amount, then try again.")
    );
  }
  return mapTransfer(await res.json());
}

async function deleteTransfer(id: string): Promise<void> {
  const res = await fetch(`/api/transfers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't delete the transfer."));
  }
}

/** Re-creates a deleted transfer exactly as stored (used by Undo); no toast. */
async function restoreTransfer(t: Transfer): Promise<void> {
  const res = await fetch("/api/transfers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      amount: t.amount,
      currency: t.currency,
      date: t.date,
      description: t.description,
      notes: t.notes,
    }),
  });
  if (!res.ok) throw new Error("Undo failed");
}

export function useTransfers(filters?: TransferFilters) {
  return useQuery({
    queryKey: ["transfers", filters],
    queryFn: () => fetchTransfers(filters),
    staleTime: 30_000,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      invalidateTransfers(qc);
      toast.success("Transfer recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransferInput> }) =>
      updateTransfer(id, data),
    onSuccess: () => {
      invalidateTransfers(qc);
      toast.success("Transfer updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Deletes with a 5s Undo, mirroring the transaction delete flow. */
export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transfer: Transfer) => deleteTransfer(transfer.id),
    onSuccess: (_data, transfer) => {
      const invalidate = () => invalidateTransfers(qc);
      toast.success("Transfer deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreTransfer(transfer);
              invalidate();
              toast.success("Transfer restored");
            } catch {
              toast.error("Couldn't undo — the transfer was not restored.");
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

/**
 * A transfer moves value between two balances, so it invalidates the account
 * list as well as the ledger — the same set every account mutation uses.
 */
function invalidateTransfers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transfers"] });
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["transactions-page"] });
}