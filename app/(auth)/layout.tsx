import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { DotGrid } from "@/components/marketing/visuals";
import {
  ContourField, InkArc, LedgerRules, PaperGrain, PaperTexture, ReceiptCard,
} from "@/components/marketing/graphics";

/**
 * Auth shell — the ledger world, quietly. Left: the one committed green band
 * with the promise and a floating receipt (xl+). Right: the form on ruled,
 * grained paper. On mobile the band recedes and only the paper remains.
 */

const promises = [
  "Manual entry in seconds — nothing ever touches your bank",
  "One honest number: what's left to spend this month",
  "Undo on every delete; your ledger exports when you ask",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand band (desktop) ─────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-band text-band-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <InkArc className="absolute inset-0 h-full w-full text-band-foreground" />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <DotGrid className="h-full w-full text-band-foreground/50" />
        </div>
        <PaperGrain className="opacity-25 dark:opacity-15" />

        <Link
          href="/"
          className="relative inline-flex w-fit items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <Image
            src="/icon.png"
            alt="SpendWise logo"
            width={30}
            height={30}
            className="h-8 w-8 shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/5"
          />
          <span>SpendWise</span>
        </Link>

        {/* The receipt, pinned like a note left on the desk (only when the
            band is wide enough to keep it clear of the heading). */}
        <div className="pointer-events-none absolute right-10 top-28 hidden w-60 rotate-2 2xl:block">
          <ReceiptCard />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-[1.08] tracking-[-0.02em] xl:text-4xl">
            Your ledger stays yours.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-band-foreground/80">
            No bank logins, no trackers, no data sale — just a clear answer about what you can spend,
            kept in an account only you can read.
          </p>
          <ul className="mt-8 space-y-2.5">
            {promises.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-band-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-band-foreground/60" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-band-foreground/60">
          &copy; {new Date().getFullYear()} SpendWise &middot; Know where your money goes.
        </p>
      </aside>

      {/* ── Form panel on paper ───────────────────────────── */}
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto px-4 py-10 sm:py-14">
        <LedgerRules className="opacity-70" />
        <PaperTexture />
        <ContourField className="pointer-events-none absolute -bottom-36 -right-40 h-120 w-120 text-primary/10" />
        <div className="relative flex w-full justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
