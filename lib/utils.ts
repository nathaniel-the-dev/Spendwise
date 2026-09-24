import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let defaultLocale = "en";
let defaultCurrency = "USD";

/** Set the app-wide formatting locale once from the user's saved settings. */
export function setDefaultLocale(locale: string) {
  if (locale) defaultLocale = locale;
}

export function getDefaultLocale(): string {
  return defaultLocale;
}

/** Set the app-wide display currency once from the user's saved settings. The app is single-currency, so every amount renders in this. */
export function setDefaultCurrency(currency: string) {
  if (currency) defaultCurrency = currency;
}

export function getDefaultCurrency(): string {
  return defaultCurrency;
}

export function formatCurrency(
  amount: number,
  currency: string = defaultCurrency,
  locale?: string
): string {
  return new Intl.NumberFormat(locale ?? defaultLocale, {
    style: "currency",
    currency,
    // "JMD 5,000.00" -> "$5,000.00": dollar-variant currencies render with their
    // narrow symbol instead of the ISO code (the default for shared symbols).
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export function formatDate(
  date: Date,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale ?? defaultLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * A row's value for aggregation, expressed in the user's preferred currency.
 *
 * Amounts are stored positive. Rows entered in a foreign currency carry a
 * frozen `amountInPreferred` snapshot (see lib/fx.ts); rows in the preferred
 * currency carry none and fall back to `amount`. Either way the result is a
 * plain number, so every total in the app stays a plain sum — this is the one
 * accessor all aggregation goes through.
 */
export function txValue(tx: { amount: number; amountInPreferred?: number | null }): number {
  return Math.abs(tx.amountInPreferred ?? tx.amount);
}

/** ISO weeks per month (52/12 ≈ 4.345) — the single source of truth for weekly normalization. */
export const WEEKS_PER_MONTH = 52 / 12;

/** Start of the calendar window a budget of the given period covers "now" (Sunday-anchored weeks). */
export function periodWindowStart(
  period: "weekly" | "monthly" | "yearly",
  now: Date = new Date()
): Date {
  const start = new Date(now);
  if (period === "weekly") start.setDate(now.getDate() - now.getDay());
  else if (period === "monthly") start.setDate(1);
  else start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

type BudgetLike = {
  categoryId: string | null;
  period: "weekly" | "monthly" | "yearly";
  startDate?: string | null;
  endDate?: string | null;
};

type TxnLike = {
  type: string;
  date: string;
  categoryId: string | null;
  amount: number;
  /** Frozen preferred-currency snapshot for foreign-currency rows (lib/fx.ts). */
  amountInPreferred?: number | null;
};

/**
 * The ONE definition of "spent on this budget so far", shared by the
 * dashboard and the budgets page so both always agree. A budget without a
 * category counts all expenses.
 */
export function computeBudgetSpend(
  budget: BudgetLike,
  transactions: TxnLike[],
  now: Date = new Date()
): number {
  const periodStart = periodWindowStart(budget.period, now);
  const start = budget.startDate
    ? new Date(Math.max(periodStart.getTime(), new Date(budget.startDate).getTime()))
    : periodStart;
  const end = budget.endDate ? new Date(budget.endDate) : null;
  return transactions.reduce((sum, tx) => {
    if (tx.type !== "expense") return sum;
    if (budget.categoryId && tx.categoryId !== budget.categoryId) return sum;
    const d = new Date(tx.date);
    if (d < start) return sum;
    if (end && d > end) return sum;
    return sum + txValue(tx);
  }, 0);
}

/** Budget consumption as a real percentage — NOT capped at 100, so overage is visible. */
export function budgetPct(spent: number, amount: number): number {
  return amount > 0 ? Math.round((spent / amount) * 100) : 0;
}

export function budgetTone(spent: number, amount: number): "success" | "warning" | "danger" {
  if (spent > amount) return "danger";
  if (amount > 0 && spent / amount > 0.75) return "warning";
  return "success";
}

export function normalizeBillingAmount(
  amount: number,
  cycle: string,
  interval: number = 1,
  toCycle: "monthly" | "yearly" = "monthly"
): number {
  const monthlyMap: Record<string, number> = {
    weekly: WEEKS_PER_MONTH,
    monthly: 1,
    quarterly: 1 / 3,
    yearly: 1 / 12,
    custom: 1 / interval,
  };

  const multiplier = monthlyMap[cycle] || 1;
  const monthlyAmount = amount * multiplier;

  return toCycle === "yearly" ? monthlyAmount * 12 : monthlyAmount;
}

export const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$" },
  { code: "ARS", name: "Argentine Peso", symbol: "ARS$" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
] as const;

export const categoryIcons = [
  "shopping-cart", "utensils", "car", "home", "gamepad-2",
  "shirt", "heart-pulse", "graduation-cap", "plane", "smartphone",
  "tv", "dumbbell", "book-open", "music", "dog",
  "gift", "coins", "piggy-bank", "credit-card", "building-2",
  "wifi", "droplets", "zap", "fire", "circle",
] as const;

export const categoryColors = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#78716c", "#6b7280", "#64748b",
] as const;
