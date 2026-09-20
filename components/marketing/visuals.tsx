import Image from "next/image";
import Link from "next/link";
import { Coins, Music, ShoppingCart, Zap, DollarSign } from "lucide-react";

/**
 * Support contact shown on the marketing pages. Empty until the operator sets
 * NEXT_PUBLIC_SUPPORT_EMAIL — the Support page hides its email CTA when unset,
 * so we never publish an address that doesn't exist.
 */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

export function Logo({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <Link href="/" className="flex items-center gap-2 font-display font-semibold tracking-tight">
      <Image src="/icon.png" alt="SpendWise logo" width={28} height={28} className={`${dim} shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/5`} />
      <span className={size === "sm" ? "text-sm" : "text-base"}>SpendWise</span>
    </Link>
  );
}

export function DotGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

export function GradientOrb({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`orb-${color.replace(/\W/g, "")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill={`url(#orb-${color.replace(/\W/g, "")})`} />
    </svg>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
      {children}
    </span>
  );
}

export function DashboardMockup() {
  // Tile colors mirror the product's category-color palette so the demo shows
  // what "categories carry color" (feature copy) actually looks like in-app.
  const rows = [
    { icon: ShoppingCart, name: "Grocery Store", cat: "Food", date: "Today", amount: "-$84.50", expense: true, color: "#f97316" },
    { icon: Zap, name: "Electric Bill", cat: "Utilities", date: "Yesterday", amount: "-$145.00", expense: true, color: "#f59e0b" },
    { icon: Music, name: "Spotify", cat: "Subscription", date: "Jun 12", amount: "-$9.99", expense: true, color: "#8b5cf6" },
    { icon: Coins, name: "Freelance Pay", cat: "Income", date: "Jun 10", amount: "+$1,200", expense: false, color: "#22c55e" },
  ];
  return (
    <div className="rounded-2xl border bg-card shadow-dialog overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
            <DollarSign className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium">Overview</span>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 border-b">
        {[
          { label: "Income", value: "$4,280", color: "text-success" },
          { label: "Expenses", value: "$2,150", color: "text-spend" },
          { label: "Savings", value: "$2,130", color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-xs font-semibold mt-0.5 tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${r.color} 14%, transparent)`, color: r.color }}
                aria-hidden="true"
              >
                <r.icon className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.cat} &middot; {r.date}</p>
              </div>
            </div>
            <span className={`text-xs font-medium shrink-0 ml-2 tabular-nums ${r.expense ? "" : "text-success"}`}>{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
