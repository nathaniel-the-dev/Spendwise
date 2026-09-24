"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { convertAmount, isForeignCurrency } from "@/lib/fx";
import { formatCurrency } from "@/lib/utils";

type Props = {
  id: string;
  /** Amount as typed, in `currency`. */
  amount: number;
  currency: string;
  preferredCurrency: string;
  rate: number | undefined;
  source: "auto" | "manual";
  onRateChange: (rate: number | undefined, source: "auto" | "manual") => void;
  /** Validation message shown when a foreign amount has no usable rate. */
  error?: string;
};

/**
 * Rate input for a foreign-currency amount, shown only when the entry currency
 * differs from the user's preferred currency.
 *
 * The rate is pre-filled automatically but stays editable: the user may know
 * the exact rate their bank used, and offline entry (the PWA outbox) has no way
 * to fetch one. Whatever rate is showing when the form is saved is snapshotted
 * onto the row, so history never drifts.
 */
export function FxRateField({
  id,
  amount,
  currency,
  preferredCurrency,
  rate,
  source,
  onRateChange,
  error,
}: Props) {
  const foreign = isForeignCurrency(currency, preferredCurrency);
  const { data, isLoading, isError } = useExchangeRate(currency, preferredCurrency);
  const autoRate = data?.rate;

  // Adopt the fetched rate until the user takes over — but never clobber a
  // manual entry, and never fight the user mid-edit.
  useEffect(() => {
    if (!foreign || source !== "auto" || autoRate == null || rate === autoRate) return;
    onRateChange(autoRate, "auto");
  }, [foreign, source, autoRate, rate, onRateChange]);

  if (!foreign) return null;

  const converted = rate != null && rate > 0 ? convertAmount(amount || 0, rate) : null;
  const status = isLoading
    ? "Fetching rate…"
    : isError
      ? "Couldn't fetch — enter it manually"
      : source === "manual"
        ? "Manual rate"
        : "Auto rate";

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs">
          Exchange rate
        </Label>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="whitespace-nowrap tabular-nums">1 {currency} =</span>
        <Input
          id={id}
          type="number"
          // "any", not a fixed step: a fetched rate carries full precision
          // (e.g. 157.820808 = 6dp). A fixed step trips native constraint
          // validation, which silently blocks form submission — the submit
          // handler never runs and no error is ever shown.
          step="any"
          min="0"
          inputMode="decimal"
          value={rate ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onRateChange(undefined, "manual");
              return;
            }
            const parsed = Number(raw);
            onRateChange(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined, "manual");
          }}
          className="h-8 w-36"
          aria-label={`Exchange rate from ${currency} to ${preferredCurrency}`}
        />
        <span className="text-muted-foreground">{preferredCurrency}</span>
        {source === "manual" && autoRate != null && (
          <button
            type="button"
            onClick={() => onRateChange(autoRate, "auto")}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Use auto rate
          </button>
        )}
      </div>

      {converted != null && amount > 0 && (
        <p className="text-xs text-muted-foreground">
          {formatCurrency(amount, currency)}{" "}
          <span aria-hidden="true">≈</span>{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(converted, preferredCurrency)}
          </span>
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
