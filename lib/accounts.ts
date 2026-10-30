/**
 * Account and transfer helpers.
 *
 * Money is modelled per account rather than as one pool:
 *
 *   balance(account) = opening_balance
 *                    + Σ txValue(income  where account_id = account)
 *                    - Σ txValue(expense where account_id = account)
 *                    - Σ transfers where from_account_id = account
 *                    + Σ transfers where to_account_id   = account
 *
 * Transfers are their own table rather than a pair of `transaction` rows, so
 * income totals and `computeBudgetSpend()` stay correct by construction instead
 * of by filtering (see docs/accounts.md).
 *
 * The balance itself is served by the `account_balance` SQL view, NOT computed
 * here or anywhere else in the client: the dashboard aggregates over a capped
 * fetch (`useTransactions({ limit: 500 })`), and a balance derived from a
 * truncated read is silently wrong with no way for the user to notice. The
 * functions below are the plain, testable definition of that formula — they are
 * the specification, not the render path. Don't wire `accountBalance()` into a
 * component.
 */

import { txValue } from "@/lib/utils";

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "credit"
  | "investment"
  | "loan";

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "cash",
  "credit",
  "investment",
  "loan",
] as const satisfies readonly [AccountType, ...AccountType[]];

/** Human labels for the account-type select. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit card",
  investment: "Investment",
  loan: "Loan",
};

/**
 * A transfer's value in the user's preferred currency. Same rule as `txValue`
 * in lib/utils.ts: foreign-currency rows carry a frozen `amountInPreferred`
 * snapshot, preferred-currency rows carry none and fall back to `amount`.
 */
export function transferValue(t: {
  amount: number;
  amountInPreferred?: number | null;
}): number {
  return Math.abs(t.amountInPreferred ?? t.amount);
}

type TxnLike = {
  type: string;
  accountId: string | null;
  amount: number;
  amountInPreferred?: number | null;
};

type TransferLike = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  amountInPreferred?: number | null;
};

/**
 * The canonical balance formula, mirrored from docs/accounts.md. Kept pure and
 * dependency-free so it can be unit-tested against the `account_balance` view.
 */
export function accountBalance(
  a: { id: string; openingBalance: number },
  transactions: TxnLike[],
  transfers: TransferLike[]
): number {
  const fromTransactions = transactions.reduce((sum, tx) => {
    if (tx.accountId !== a.id) return sum;
    if (tx.type === "income") return sum + txValue(tx);
    if (tx.type === "expense") return sum - txValue(tx);
    return sum;
  }, 0);

  const fromTransfers = transfers.reduce((sum, t) => {
    const value = transferValue(t);
    if (t.fromAccountId === a.id) return sum - value;
    if (t.toAccountId === a.id) return sum + value;
    return sum;
  }, 0);

  return a.openingBalance + fromTransactions + fromTransfers;
}

/** Balance of `accounts` as reported by the `account_balance` view. */
type BalanceRow = {
  balance: number;
  includeInNetWorth?: boolean | null;
  isArchived?: boolean | null;
};

/**
 * Total across accounts counted toward net worth. Archived accounts are excluded
 * by default — archiving is how a closed account leaves the picture without
 * losing its history.
 */
export function netWorth(
  accounts: BalanceRow[],
  options: { includeArchived?: boolean } = {}
): number {
  return accounts.reduce((sum, a) => {
    if (a.includeInNetWorth === false) return sum;
    if (!options.includeArchived && a.isArchived) return sum;
    return sum + (Number.isFinite(a.balance) ? a.balance : 0);
  }, 0);
}

export const ACCOUNT_MIGRATION_REQUIRED =
  "Accounts aren't set up in this workspace yet. Run the SQL in docs/accounts.md (Supabase SQL editor), then try again.";

/**
 * PostgREST reports an unknown table/view as PGRST204, or a missing relation as
 * a Postgres 42P01. Both mean the SQL in docs/accounts.md hasn't been applied,
 * which is actionable rather than a server fault — surface it as such instead
 * of a bare 500.
 *
 * The patterns deliberately name the TABLE/VIEW rather than the `account_id`
 * column: the transactions route queries rows that may simply have no account,
 * and a bare column mention there is not evidence of a missing table.
 */
export function isMissingAccountTableError(
  error: { code?: string | null; message?: string | null } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42P01") return true;
  return /account_balance|['"]?public\.account['"]?|['"]?public\.transfer['"]?/i.test(
    error.message ?? ""
  );
}