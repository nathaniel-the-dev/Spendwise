"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { accountIcons, categoryColors, formatCurrency } from "@/lib/utils";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/accounts";
import { CategoryIcon } from "@/components/category-icon";
import { useSettings } from "@/hooks/use-settings";
import type { Account } from "@/hooks/use-accounts";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ACCOUNT_TYPES),
  openingBalance: z.coerce.number(),
  icon: z.string().optional(),
  color: z.string().optional(),
  includeInNetWorth: z.boolean(),
  // Always the user's preferred currency in v1 — no control for it, only
  // carried through so the submit payload matches `AccountInput`.
  currency: z.string().length(3).optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AccountFormValues) => void;
  defaultValues?: Partial<AccountFormValues>;
  /** Present when editing — used to show what the balance will become. */
  account?: Account | null;
  title?: string;
  /** True while the parent's create/update mutation is in flight. */
  pending?: boolean;
};

export function AccountFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  account,
  title = "Add Account",
  pending = false,
}: Props) {
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const isEdit = Boolean(account);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      openingBalance: 0,
      icon: "wallet",
      color: "#6b7280",
      includeInNetWorth: true,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        type: "checking",
        openingBalance: 0,
        icon: "wallet",
        color: "#6b7280",
        includeInNetWorth: true,
        ...defaultValues,
      });
    }
  }, [open, defaultValues, form]);

  const openingBalance = Number(form.watch("openingBalance")) || 0;
  // Only meaningful on edit — a new account's balance is whatever it starts at.
  const resultingBalance = isEdit
    ? account!.balance - account!.openingBalance + openingBalance
    : openingBalance;

  function handleSubmit(values: AccountFormValues) {
    onSubmit({ ...values, currency: preferredCurrency });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this account. Its balance is recalculated from its transactions."
              : "Track a place your money lives — a bank account, a card, or cash."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Name</Label>
            <Input id="account-name" placeholder="e.g. Main checking" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-type">Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as AccountFormValues["type"])}
              >
                <SelectTrigger id="account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-opening-balance">Opening balance</Label>
              <Input
                id="account-opening-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("openingBalance")}
              />
              <p className="text-xs text-muted-foreground">
                What was in the account before you started tracking. Negative for a card you owe.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div
              className="grid max-h-24 grid-cols-8 gap-2 overflow-y-auto pr-1"
              role="radiogroup"
              aria-label="Account icon"
            >
              {accountIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={form.watch("icon") === icon}
                  data-active={form.watch("icon") === icon}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-xs hover:bg-accent data-[active=true]:border-primary data-[active=true]:bg-primary/10"
                  onClick={() => form.setValue("icon", icon)}
                  title={icon}
                  aria-label={icon}
                >
                  <CategoryIcon icon={icon} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Account color">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={form.watch("color") === color}
                  aria-label={`Color ${color}`}
                  title={color}
                  data-active={form.watch("color") === color}
                  className="h-7 w-7 rounded-full border-2 transition-all data-[active=true]:scale-110 data-[active=true]:border-foreground"
                  style={{ backgroundColor: color }}
                  onClick={() => form.setValue("color", color)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="account-net-worth" className="text-sm">
                Include in net worth
              </Label>
              <p className="text-xs text-muted-foreground">
                Turn this off to leave an account out of your total without deleting it.
              </p>
            </div>
            <Switch
              id="account-net-worth"
              checked={form.watch("includeInNetWorth")}
              onCheckedChange={(v) => form.setValue("includeInNetWorth", v)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Balance after saving:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(resultingBalance, preferredCurrency)}
            </span>
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}