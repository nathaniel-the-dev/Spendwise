"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Archive,
  Loader2,
  Wallet,
  ArrowRight,
  ArrowLeftRight,
  Landmark,
} from "lucide-react";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useArchiveAccount,
  type Account,
} from "@/hooks/use-accounts";
import {
  useTransfers,
  useCreateTransfer,
  useDeleteTransfer,
  type Transfer,
} from "@/hooks/use-transfers";
import {
  AccountFormDialog,
  type AccountFormValues,
} from "@/components/shared/account-form-dialog";
import {
  TransferFormDialog,
  type TransferFormValues,
} from "@/components/shared/transfer-form-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { CategoryIcon } from "@/components/category-icon";
import { ACCOUNT_TYPE_LABELS, netWorth, type AccountType } from "@/lib/accounts";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AccountsPage() {
  const { data: accounts, isLoading, isError, refetch } = useAccounts();
  const { data: transfers } = useTransfers({ limit: 50 });
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();
  const createTransfer = useCreateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [archiving, setArchiving] = useState<Account | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(null);

  const list = accounts ?? [];
  const active = useMemo(() => list.filter((a) => !a.isArchived), [list]);
  const archived = useMemo(() => list.filter((a) => a.isArchived), [list]);
  const total = useMemo(() => netWorth(list), [list]);

  function openCreate() {
    setEditing(null);
    setAccountDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setAccountDialogOpen(true);
  }

  function handleAccountSubmit(values: AccountFormValues) {
    const data = {
      name: values.name,
      type: values.type,
      currency: values.currency,
      openingBalance: values.openingBalance,
      icon: values.icon,
      color: values.color,
      includeInNetWorth: values.includeInNetWorth,
    };
    if (editing) {
      updateAccount.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            setAccountDialogOpen(false);
            setEditing(null);
          },
        }
      );
    } else {
      createAccount.mutate(data, { onSuccess: () => setAccountDialogOpen(false) });
    }
  }

  function handleTransferSubmit(values: TransferFormValues) {
    createTransfer.mutate(
      {
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: values.amount,
        date: values.date,
        description: values.description || null,
        notes: values.notes || null,
      },
      { onSuccess: () => setTransferDialogOpen(false) }
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Accounts</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
            Where your money lives
          </h1>
          <p className="text-sm text-muted-foreground">
            Balances update from your transactions and transfers.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="gap-1.5 flex-1 sm:flex-none"
            onClick={() => setTransferDialogOpen(true)}
            disabled={active.length < 2}
            title={active.length < 2 ? "Add two accounts first" : undefined}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Move Money
          </Button>
          <Button className="gap-1.5 flex-1 sm:flex-none" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {isLoading || (!accounts && !isError) ? (
        <LoadingState label="Loading accounts" />
      ) : isError && !accounts ? (
        <ErrorState
          title="Couldn't load your accounts"
          description="We couldn't reach your data. Nothing was lost — try again."
          onRetry={refetch}
        />
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold mb-1">No accounts yet</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Add a bank account, a card, or a cash pile to see a real balance and net worth.
              Until then, everything works exactly as before.
            </p>
            <Button size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Net worth</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {formatCurrency(total)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Across {active.length} active account{active.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => openEdit(account)}
                onArchive={() => setArchiving(account)}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <details className="rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                {archived.length} archived account{archived.length === 1 ? "" : "s"}
              </summary>
              <div className="grid gap-4 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => openEdit(account)}
                    onArchive={() => setArchiving(account)}
                  />
                ))}
              </div>
            </details>
          )}

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Transfers
            </h2>
            <p className="text-sm text-muted-foreground">
              Moving money between accounts doesn't count as spending, so it never touches your
              budgets or income totals.
            </p>
            {transfers && transfers.length > 0 ? (
              <div className="rounded-lg border">
                <ul>
                  {transfers.map((transfer) => (
                    <TransferRow
                      key={transfer.id}
                      transfer={transfer}
                      onDelete={() => setDeletingTransfer(transfer)}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <Landmark
                    className="h-6 w-6 text-muted-foreground mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">
                    No transfers yet. Moving money between accounts keeps it out of your spending.
                  </p>
                  {active.length >= 2 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 mt-4"
                      onClick={() => setTransferDialogOpen(true)}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Move Money
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}

      <AccountFormDialog
        open={accountDialogOpen}
        onOpenChange={(open) => {
          setAccountDialogOpen(open);
          if (!open) setEditing(null);
        }}
        account={editing}
        pending={createAccount.isPending || updateAccount.isPending}
        onSubmit={handleAccountSubmit}
        title={editing ? "Edit Account" : "Add Account"}
        defaultValues={
          editing
            ? {
                name: editing.name,
                type: editing.type,
                openingBalance: editing.openingBalance,
                icon: editing.icon,
                color: editing.color,
                includeInNetWorth: editing.includeInNetWorth,
              }
            : undefined
        }
      />

      <TransferFormDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        pending={createTransfer.isPending}
        onSubmit={handleTransferSubmit}
      />

      <Dialog open={!!archiving} onOpenChange={() => setArchiving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {archiving?.name}</DialogTitle>
            <DialogDescription>
              Its balance and every transfer stay exactly where they are — the account just leaves
              your active list and stops counting toward net worth. You can undo this for 5 seconds
              after archiving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setArchiving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => archiving && archiveAccount.mutate(archiving, { onSuccess: () => setArchiving(null) })}
              disabled={archiveAccount.isPending}
            >
              {archiveAccount.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Archive account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTransfer} onOpenChange={() => setDeletingTransfer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this transfer</DialogTitle>
            <DialogDescription>
              The money stays where it is — only the record of the move is removed, and both
              balances go back to what they'd be without it. You can undo this for 5 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingTransfer(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                deletingTransfer &&
                deleteTransfer.mutate(deletingTransfer, { onSuccess: () => setDeletingTransfer(null) })
              }
              disabled={deleteTransfer.isPending}
            >
              {deleteTransfer.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Delete transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountCard({
  account,
  onEdit,
  onArchive,
}: {
  account: Account;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const color = account.color?.startsWith("#") ? account.color : null;
  const negative = account.balance < 0;

  return (
    <Card className={account.isArchived ? "opacity-70" : undefined}>
      <CardHeader className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={
                color
                  ? { backgroundColor: `${color}1a`, color }
                  : undefined
              }
              aria-hidden="true"
            >
              <CategoryIcon icon={account.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{account.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {ACCOUNT_TYPE_LABELS[account.type as AccountType] ?? "Account"}
              </p>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              aria-label={`Edit ${account.name}`}
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
              aria-label={`Archive ${account.name}`}
              onClick={onArchive}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <p
          className={`text-lg font-semibold tabular-nums ${
            negative ? "text-destructive" : ""
          }`}
        >
          {formatCurrency(account.balance)}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {account.isArchived && <Badge variant="secondary">Archived</Badge>}
          {!account.includeInNetWorth && <Badge variant="secondary">Not in net worth</Badge>}
        </div>
        {account.openingBalance !== 0 && (
          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
            Opened at {formatCurrency(account.openingBalance)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TransferRow({ transfer, onDelete }: { transfer: Transfer; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-3 border-b px-4 py-3 text-sm last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {transfer.fromAccount?.name ?? "Unknown"} <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" aria-hidden="true" />{" "}
          {transfer.toAccount?.name ?? "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {formatDate(new Date(transfer.date))}
          {transfer.description ? ` · ${transfer.description}` : ""}
        </p>
      </div>
      <span className="shrink-0 font-medium tabular-nums">{formatCurrency(transfer.amount)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
        aria-label={`Delete transfer from ${transfer.fromAccount?.name ?? "account"} to ${transfer.toAccount?.name ?? "account"}`}
        onClick={onDelete}
      >
        <Archive className="h-4 w-4" />
      </Button>
    </li>
  );
}
