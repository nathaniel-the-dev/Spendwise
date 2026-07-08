import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date,
  locale: string = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function normalizeBillingAmount(
  amount: number,
  cycle: string,
  interval: number = 1,
  toCycle: "monthly" | "yearly" = "monthly"
): number {
  const monthlyMap: Record<string, number> = {
    weekly: 4.33,
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
