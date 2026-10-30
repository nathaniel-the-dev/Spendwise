"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/category-icon";
import { formatCurrency } from "@/lib/utils";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/accounts";
import type { Account } from "@/hooks/use-accounts";

/**
 * Account dropdown that shows each account's icon and live balance, because
 * picking an account is a question about where the money is — a bare name
 * doesn't answer it. `noneLabel` adds the explicit "unassigned" option that
 * every existing transaction already falls into.
 *
 * Archived accounts are excluded by the caller; when they are included the type
 * label carries an "(archived)" suffix rather than hiding the fact.
 */
export function AccountSelect({
  accounts,
  value,
  onValueChange,
  placeholder = "Select account",
  noneLabel,
  id,
  className,
  showBalance = true,
}: {
  accounts: Account[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  noneLabel?: string;
  id?: string;
  className?: string;
  showBalance?: boolean;
}) {
  const list = accounts ?? [];

  return (
    <Select value={noneLabel ? value || "none" : value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {noneLabel && <SelectItem value="none">{noneLabel}</SelectItem>}
        {list.length === 0 && !noneLabel && (
          <SelectItem value="none" disabled>
            No accounts yet
          </SelectItem>
        )}
        {list.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <span className="flex w-full items-center gap-2">
              <CategoryIcon
                icon={account.icon}
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              />
              <span className="truncate">{account.name}</span>
              <span className="ml-auto pl-3 text-xs text-muted-foreground">
                {showBalance ? formatCurrency(account.balance) : typeLabel(account)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function typeLabel(account: Account): string {
  const base = ACCOUNT_TYPE_LABELS[account.type as AccountType] ?? "Account";
  return account.isArchived ? `${base} (archived)` : base;
}