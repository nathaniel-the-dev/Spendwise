import Link from "next/link";
import { ArrowLeft, CircleHelp, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";
import {
  ContourField,
  HankoSeal,
  InkUnderline,
  LedgerRules,
  PaperGrain,
  PaperTexture,
} from "@/components/marketing/graphics";
import { GradientOrb } from "@/components/marketing/visuals";

/**
 * Global 404 — the whole app's "page not found", rendered as a voided entry
 * in the Kanso Ledger: ruled paper, an oversized display-face 404 with the
 * landing's brush underline drawing itself once beneath it, the exact
 * requested path struck through like a cancelled line, and honest recovery.
 * Self-contained (its own header/footer) so it stands alone for any
 * unmatched URL across the site.
 */
export default async function NotFound() {
  // Read the session for a smarter CTA, but never let a failed auth lookup
  // break the error page itself.
  let session: Awaited<ReturnType<typeof auth>> = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader session={session} />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* the paper ground — same materials as the landing hero */}
        <LedgerRules />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <ContourField className="absolute -left-40 -top-28 h-136 w-136 text-primary/10" />
          <div className="absolute -bottom-24 right-1/4 h-96 w-96">
            <GradientOrb color="#1f9d63" />
          </div>
        </div>
        <PaperTexture />
        <PaperGrain className="opacity-[0.12] dark:opacity-[0.08]" />

        {/* the printer's mark, quietly turning in the margin */}
        <HankoSeal className="pointer-events-none absolute right-6 top-10 hidden h-16 w-16 text-primary/30 sm:block md:right-12" />

        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center md:py-28">
          {/* Oversized 404 as a decorative display mark; the real heading is
              the sentence below, so screen readers get the message, not the
              number. The brush underline is the page's one motion moment. */}
          <span
            aria-hidden="true"
            className="relative inline-block font-display text-[6rem] font-semibold leading-[0.82] tracking-[-0.03em] text-foreground sm:text-[9rem]"
          >
            404
            <InkUnderline className="text-primary/50" />
          </span>

          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.01em] text-foreground md:text-3xl">
            This page isn&apos;t in the ledger.
          </h1>

          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            We couldn&apos;t find an entry at this address. Nothing was lost and nothing was
            charged &mdash; the page simply isn&apos;t here.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/">
              <Button size="lg" className="w-full gap-1.5 sm:w-auto">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to home
              </Button>
            </Link>
          </div>

          <nav
            aria-label="Help"
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              Read the FAQ
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Contact support
            </Link>
          </nav>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
