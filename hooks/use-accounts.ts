import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";
import type { AccountType } from "@/lib/accounts";

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  icon: string;
  color: string;
  includeInNetWorth: boolean;
  isArchived: boolean;
  /** Running balance, served by the `account_balance` SQL view — never summed client-side. */
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type AccountInput = {
  name: string;
  type?: AccountType;
  currency?: string;
  openingBalance?: number;
  icon?: string;
  color?: string;
  includeInNetWorth?: boolean;
  sortOrder?: number;
};

type RawAccount = {
  account_id?: string;
  user_id?: string;
  name?: string;
  type?: string;
  currency?: string;
  opening_balance?: string | number;
  icon?: string;
  color?: string;
  include_in_net_worth?: boolean;
  is_archived?: boolean;
  balance?: string | number;
};

/** Postgres `numeric` arrives as a string over PostgREST; coerce defensively. */
function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapAccount(raw: RawAccount): Account {
  return {
    id: raw.account_id ?? "",
    userId: raw.user_id ?? "",
    name: raw.name ?? "",
    type: (raw.type as AccountType) ?? "checking",
    currency: raw.currency ?? "USD",
    openingBalance: num(raw.opening_balance),
    icon: raw.icon ?? "wallet",
    color: raw.color ?? "gray",
    includeInNetWorth: raw.include_in_net_worth ?? true,
    isArchived: raw.is_archived ?? false,
    balance: num(raw.balance),
    // The view doesn't project timestamps; leave them blank rather than invent them.
    createdAt: "",
    updatedAt: "",
  };
}

async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch("/api/accounts");
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't load your accounts. Try again in a moment.")
    );
  }
  const data: RawAccount[] = await res.json();
  return data.map(mapAccount);
}

async function createAccount(data: AccountInput): Promise<Account> {
  const res = await fetch("/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't save the account. Check the name and balance, then try again.")
    );
  }
  return mapAccount(await res.json());
}

async function updateAccount(id: string, data: Partial<AccountInput> & { isArchived?: boolean }): Promise<Account> {
  const res = await fetch(`/api/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readableError(res, "Couldn't update the account. Check the name and balance, then try again.")
    );
  }
  return mapAccount(await res.json());
}

async function archiveAccount(id: string): Promise<void> {
  const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't archive the account."));
  }
}

/** Un-archives an account (used by Undo); no toast of its own. */
async function restoreAccount(a: Account): Promise<void> {
  const res = await fetch(`/api/accounts/${a.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isArchived: false }),
  });
  if (!res.ok) throw new Error("Undo failed");
}

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts, staleTime: 30_000 });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      invalidateAccounts(qc);
      toast.success("Account created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountInput> & { isArchived?: boolean } }) =>
      updateAccount(id, data),
    onSuccess: () => {
      invalidateAccounts(qc);
      toast.success("Account updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Archiving is the delete action, so it offers the same 5s Undo the ledger has:
 * the account leaves the active list without its balance or transfers ever being
 * destroyed, and Undo simply flips `isArchived` back.
 */
export function useArchiveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account: Account) => archiveAccount(account.id),
    onSuccess: (_data, account) => {
      const invalidate = () => invalidateAccounts(qc);
      toast.success(`${account.name} archived`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreAccount(account);
              invalidate();
              toast.success("Account restored");
            } catch {
              toast.error("Couldn't undo — the account is still archived.");
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
 * A balance change ripples into every total, and the transaction form's account
 * picker reads the same list — so one invalidation set covers all mutations.
 */
function invalidateAccounts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["accounts"] });
  qc.invalidateQueries({ queryKey: ["transfers"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["transactions-page"] });
}