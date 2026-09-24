/**
 * Currency-conversion helpers.
 *
 * SpendWise records each amount twice:
 *   - the ORIGINAL charge: `amount` + `currency` (e.g. 9.99 USD)
 *   - a RESOLVED SNAPSHOT in the user's preferred currency:
 *     `amountInPreferred` + `fxRate` + `fxRateAt` + `fxSource`
 *
 * The snapshot is frozen at write time, so history never drifts when the
 * market moves and totals stay plain sums (see `txValue` in lib/utils.ts).
 * Rows already in the preferred currency carry no snapshot and fall back
 * to `amount`.
 */

export type FxSource = "auto" | "manual";

/** PostgREST (snake_case) fx columns, as stored on `transaction` / `subscription`. */
export type FxColumns = {
  amount_in_preferred: number;
  fx_rate: number;
  fx_rate_at: string;
  fx_source: FxSource;
};

/** Money renders to 2dp; round once, at write time, so sums stay stable. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** True when `currency` differs from the preferred currency (case-insensitive). */
export function isForeignCurrency(
  currency: string | null | undefined,
  preferredCurrency: string | null | undefined
): boolean {
  if (!currency || !preferredCurrency) return false;
  return currency.toUpperCase() !== preferredCurrency.toUpperCase();
}

/** Amount in the preferred currency for a given rate. Amounts are stored positive. */
export function convertAmount(amount: number, rate: number): number {
  return roundMoney(Math.abs(amount) * rate);
}

/**
 * PostgREST fields for a foreign-currency row, or `{}` when no usable rate was
 * supplied. Returning an empty object for the common case is deliberate:
 * single-currency rows never send fx columns, so their writes keep working
 * even before the migration has been applied.
 */
export function buildFxColumns(input: {
  currency?: string | null;
  amount: number;
  fxRate?: number | null;
  fxSource?: FxSource | null;
  now?: Date;
}): Partial<FxColumns> {
  const { currency, amount, fxRate, fxSource, now } = input;
  if (!currency) return {};
  if (fxRate == null || !Number.isFinite(fxRate) || fxRate <= 0) return {};
  return {
    amount_in_preferred: convertAmount(amount, fxRate),
    fx_rate: fxRate,
    fx_rate_at: (now ?? new Date()).toISOString(),
    fx_source: fxSource ?? "auto",
  };
}

/**
 * PostgREST reports an unknown column as PGRST204 ("Could not find the
 * 'amount_in_preferred' column ..."). We surface that as an actionable
 * message instead of a bare 500, because it means the SQL in
 * docs/currency-conversion.md hasn't been applied yet.
 */
export function isMissingFxColumnError(
  error: { code?: string | null; message?: string | null } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  return /amount_in_preferred|fx_rate|fx_source/i.test(error.message ?? "");
}

/**
 * A foreign amount cannot be totalled without a rate: saving one without it
 * stores `amount` with no snapshot, so `txValue()` silently reads it as if it
 * were already in the preferred currency (5.55 USD counted as 5.55 JMD — off by
 * a factor of the rate). Returns a message to show the user, or null when the
 * row is safe to save.
 */
export function missingRateMessage(
  currency: string | null | undefined,
  preferredCurrency: string | null | undefined,
  fxRate: number | null | undefined
): string | null {
  if (!isForeignCurrency(currency, preferredCurrency)) return null;
  if (fxRate != null && Number.isFinite(fxRate) && fxRate > 0) return null;
  return "Enter the exchange rate so this amount is totalled correctly.";
}

export const FX_MIGRATION_REQUIRED =
  "This workspace still needs the currency-conversion database columns. Run the SQL in docs/currency-conversion.md (Supabase SQL editor), then try again.";

/**
 * Decides which fx columns a PATCH should write, so both update routes agree.
 *
 * The client always sends `currency` together with `fxRate` (or `null`) when it
 * touches an amount, which makes the three cases unambiguous:
 *
 *   - a positive rate      -> write/replace the snapshot
 *   - currency, no rate    -> the row moved back to the preferred currency, so
 *                             clear the stale snapshot
 *   - amount only          -> keep the frozen rate and restate the converted
 *                             value (editing "9.99" to "12.99" must not silently
 *                             adopt today's rate)
 */
export function resolveFxUpdate(input: {
  existing: { amount: number; currency?: string | null; fx_rate?: number | null; fx_source?: string | null };
  patch: { amount?: number; currency?: string; fxRate?: number | null; fxSource?: FxSource | null };
  now?: Date;
}): Record<string, unknown> {
  const { existing, patch, now } = input;

  if (patch.fxRate != null && patch.fxRate > 0) {
    return buildFxColumns({
      currency: patch.currency ?? existing.currency,
      amount: patch.amount ?? existing.amount,
      fxRate: patch.fxRate,
      fxSource: patch.fxSource,
      now,
    });
  }

  if (patch.currency !== undefined) {
    return { amount_in_preferred: null, fx_rate: null, fx_rate_at: null, fx_source: null };
  }

  if (patch.amount !== undefined && existing.fx_rate != null) {
    return buildFxColumns({
      currency: existing.currency,
      amount: patch.amount,
      fxRate: existing.fx_rate,
      fxSource: (existing.fx_source as FxSource | null) ?? "auto",
      now,
    });
  }

  return {};
}
