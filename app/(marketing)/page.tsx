import Link from "next/link";
import {
  ArrowRight, BarChart3, CreditCard, Download, FileText, Lock,
  PiggyBank, RefreshCcw, ShieldCheck, Sparkles, Target, Unlink, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  ContourField, DoodleArrow, HankoSeal, InkArc, InkUnderline,
  LedgerRules, PaperGrain, PaperTexture, ReceiptCard, WatermarkGlyph,
} from "@/components/marketing/graphics";
import {
  DashboardMockup, DotGrid, Eyebrow, GradientOrb,
} from "@/components/marketing/visuals";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";

type Tone = "primary" | "spend" | "success" | "warning";

/* One color, one meaning (DESIGN.md's semantic roles, read off the product):
   primary = the product's word · spend (slate) = money leaving ·
   success (moss) = money you keep · warning (amber) = honest limits. */
const toneStyles: Record<Tone, { tile: string; wash: string }> = {
  primary: { tile: "bg-primary/10 text-primary group-hover:bg-primary/20", wash: "from-primary/10" },
  spend: { tile: "bg-spend/10 text-spend group-hover:bg-spend/20", wash: "from-spend/10" },
  success: { tile: "bg-success/10 text-success group-hover:bg-success/20", wash: "from-success/10" },
  warning: { tile: "bg-warning/15 text-warning group-hover:bg-warning/25", wash: "from-warning/10" },
};

const features: { icon: typeof Unlink; tone: Tone; title: string; description: string }[] = [
  {
    icon: Unlink,
    tone: "primary",
    title: "No bank connections. Ever.",
    description:
      "You log what you spend — nothing else touches your accounts. No bank connections, no credentials, no data to monetize. Manual entry isn't a limitation; it's the privacy model.",
  },
  {
    icon: CreditCard,
    tone: "spend",
    title: "Fast expense tracking",
    description:
      "Log an expense in seconds. Descriptions autocomplete from your history, categories carry color, and 'keep adding' makes receipts a batch job.",
  },
  {
    icon: Wallet,
    tone: "success",
    title: "The one number",
    description:
      "The dashboard opens with what you can actually spend this month — income minus what's gone and what's committed — not a wall of vanity stats.",
  },
  {
    icon: PiggyBank,
    tone: "warning",
    title: "Budgets that tell the truth",
    description:
      "Weekly, monthly, or yearly limits per category. Over budget, the bar says 128% — not a flat, polite 100%.",
  },
  {
    icon: RefreshCcw,
    tone: "spend",
    title: "Subscription radar",
    description:
      "Track recurring payments with per-month and per-year normalization, pause what's dormant, and get flagged before renewals hit.",
  },
  {
    icon: BarChart3,
    tone: "primary",
    title: "Reports & PDF export",
    description:
      "Slice spending by month or any date range, see where it concentrates, and export a clean PDF report for your own records.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your space",
    body: "Sign up with email (or Google). No bank to link, no card to hand over — the workspace is yours from the first second.",
  },
  {
    n: "02",
    title: "Log what you spend",
    body: "Record transactions, set your budgets, and list the subscriptions quietly billing you every month.",
  },
  {
    n: "03",
    title: "Check, don't calculate",
    body: "Your 'Available this month' number is waiting on the dashboard, with alerts only when something needs you.",
  },
];

const faqPreview = [
  {
    q: "Is my financial data private?",
    a: "Yes. Your ledger lives in your own private account, isolated from every other account. SpendWise runs no analytics, no trackers, and never sells or shares what you enter.",
  },
  {
    q: "Do I have to link my bank?",
    a: "No — and you can't. SpendWise has no bank sync, no card linking, and no account credentials of any kind. You enter transactions yourself, which is exactly why there's nothing here to leak or sell.",
  },
  {
    q: "What happens if I delete something by mistake?",
    a: "Deletes of transactions, budgets, and subscriptions offer a 5-second Undo right in the toast. No confirm dialogs standing between you and a reversible action.",
  },
];

export default async function MarketingPage() {
  const session = await auth();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader session={session} />

      <main className="flex-1">
        {/* ── Hero: the open ledger ───────────────────────────
            Two columns on ruled paper. The headline is the entry,
            the receipt is the proof — the product's answer printed
            and torn like a real one. The brush underline drawing
            itself under the promise is the page's one motion moment. */}
        <section className="relative overflow-hidden">
          <LedgerRules />
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <ContourField className="absolute -right-44 -top-32 h-136 w-136 text-primary/15" />
            <div className="absolute -top-40 right-1/3 w-96 h-96">
              <GradientOrb color="#1f9d63" />
            </div>
          </div>
          <PaperTexture />
          <PaperGrain className="opacity-[0.12] dark:opacity-[0.08]" />
          <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 relative">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-10 items-center">
              <div>
                <Eyebrow>A calmer way to manage everyday money</Eyebrow>
                <h1 className="font-display text-4xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-[-0.02em] leading-[1.02] mb-5 mt-6">
                  Know where your money goes.{" "}
                  <span className="relative inline-block text-primary">
                    Plan what comes next.
                    <InkUnderline className="text-primary/50" />
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
                  SpendWise brings spending, recurring payments, budgets, and useful context into one clear view —
                  so the question &ldquo;can I afford this?&rdquo; has an instant answer.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {session ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-1.5 text-sm font-medium shadow-sm">
                        Go to Dashboard <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/register">
                        <Button size="lg" className="gap-1.5 text-sm font-medium shadow-sm">
                          Start Free <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button size="lg" variant="outline" className="text-sm font-medium">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  No bank logins &middot; no trackers &middot; no data sale &middot; your ledger stays yours
                </p>
              </div>
              <div className="relative mx-auto lg:mx-0 justify-self-center">
                <div className="absolute -inset-8" aria-hidden="true">
                  <DotGrid className="w-full h-full text-primary/40" />
                </div>
                <ReceiptCard className="relative animate-fade-in-up" />
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works: three entries, one margin rule ──── */}
        <section id="how" className="border-t scroll-mt-16 relative">
          <WatermarkGlyph char="S" className="absolute -top-10 right-6 text-[11rem] leading-none hidden md:block" />
          <div className="mx-auto max-w-5xl px-4 py-16 relative">
            <div className="max-w-xl mb-10">
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em] mt-4 mb-2">
                Three minutes to set up. Seconds per check after that.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SpendWise is built for the person who doesn&apos;t want a second job managing money — just a
                trustworthy answer when they need one.
              </p>
            </div>
            <ol className="grid md:grid-cols-3 gap-4 list-none relative">
              {steps.map((s, i) => (
                <li key={s.n} className="relative rounded-xl border bg-card p-5">
                  <span className="label-mono text-primary">{s.n}</span>
                  <h3 className="text-sm font-semibold mt-2 mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  {i < steps.length - 1 && (
                    <DoodleArrow className="absolute -right-7 top-1/2 -translate-y-1/2 z-10 hidden md:block h-7 w-12 text-primary/45" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── The one number spotlight ─────────────────────── */}
        <section className="border-t relative overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            <ContourField className="absolute -left-56 top-1/2 -translate-y-1/2 h-120 w-120 text-primary/10" />
          </div>
          <div className="mx-auto max-w-5xl px-4 py-16 relative">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <Eyebrow>
                  <Target className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Answer-first design
                </Eyebrow>
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em] mt-4 mb-2">
                  Everything at a glance
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Most finance apps hand you four stat cards and leave you to do the arithmetic. SpendWise does
                  the arithmetic: one honest number — what&apos;s left to spend — with income, spending, and
                  recurring commitments drawn to scale beneath it. Alerts appear only when something is actually
                  actionable: a budget crossed, a renewal two days out.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-muted-foreground">
                    <span className="flex shrink-0" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span className="-ml-0.5 h-1.5 w-1.5 rounded-full bg-spend" />
                    </span>
                    Income &amp; expenses
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                    Budgets &amp; goals
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-spend" aria-hidden="true" />
                    Recurring payments
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl" aria-hidden="true" />
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="border-t relative overflow-hidden scroll-mt-16">
          <PaperGrain />
          <div className="mx-auto max-w-5xl px-4 py-16 relative">
            <div className="max-w-xl mb-10">
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                What&apos;s inside
              </Eyebrow>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em] mt-4 mb-2">
                Small tool, sharp edges
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every feature exists because a spreadsheet made someone do math they shouldn&apos;t have to.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                const tone = toneStyles[feature.tone];
                return (
                  <div
                    key={feature.title}
                    className="group relative rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${tone.wash} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} aria-hidden="true" />
                    <div className="relative">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-3 group-hover:scale-110 transition-all duration-300 ${tone.tile}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Privacy: the stamped page ──────────────────────
            The hanko seal is the receipt for this promise — a ledger
            page is only trusted once it's stamped. */}
        <section id="privacy" className="border-t bg-wash-moss relative overflow-hidden scroll-mt-16">
          <PaperGrain />
          <div className="mx-auto max-w-5xl px-4 py-16 relative">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
              <div className="relative">
                <HankoSeal className="absolute -top-4 -right-10 h-20 w-20 text-primary/25 hidden lg:block" />
                <Eyebrow>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Your data
                </Eyebrow>
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em] mt-4 mb-2">
                  A private ledger, not a data product
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  SpendWise is personal finance software, not a fintech funnel. There&apos;s no ad network,
                  no analytics script, and no third party reading your transactions. Your spending is the
                  product&apos;s only input — and nobody else&apos;s output.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/privacy">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      Read the Privacy Policy
                    </Button>
                  </Link>
                  <Link href="/faq">
                    <Button variant="ghost" size="sm" className="text-xs">
                      More questions →
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border bg-card divide-y">
                {[
                  { icon: Lock, tone: "bg-primary/10 text-primary", t: "Stored", d: "Your name, email, currency preference, theme, and the transactions, budgets, categories, and subscriptions you create — in your own private account, isolated from every other account." },
                  { icon: Download, tone: "bg-muted text-muted-foreground", t: "Fetched", d: "Nothing about you. SpendWise never reaches into your bank, reads your statements, or pulls your data from anywhere. You type it in; that's the whole input." },
                  { icon: ShieldCheck, tone: "bg-destructive/10 text-destructive", t: "Never", d: "Bank connections, card numbers, account credentials, behavioral analytics, or tracking pixels. SpendWise works without ever seeing them." },
                ].map((row) => (
                  <div key={row.t} className="flex gap-3.5 p-5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.tone}`}>
                      <row.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{row.t}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{row.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ preview ──────────────────────────────────── */}
        <section className="border-t relative">
          <LedgerRules className="opacity-60" />
          <div className="mx-auto max-w-5xl px-4 py-16 relative">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <Eyebrow>Answers</Eyebrow>
                <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em] mt-4">
                  Questions people ask first
                </h2>
              </div>
              <Link href="/faq" className="hidden sm:inline-flex text-sm text-primary hover:underline shrink-0 pb-1">
                All questions →
              </Link>
            </div>
            <div className="grid gap-3">
              {faqPreview.map((item) => (
                <div key={item.q} className="rounded-xl border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-1">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm sm:hidden">
              <Link href="/faq" className="text-primary hover:underline">All questions →</Link>
            </p>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────
            The one committed green region: the whole surface IS the brand, so
            the closing ask reads as the page's loudest moment. Inverted
            controls keep the primary action the brightest thing on screen.
            A single sumi-e sweep carries across it — the brushstroke that
            closes the ledger. */}
        <section className="relative overflow-hidden bg-band text-band-foreground">
          <InkArc className="absolute inset-0 h-full w-full text-band-foreground" />
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <DotGrid className="w-full h-full text-band-foreground/50" />
            <div className="absolute -top-24 -right-24 w-72 h-72">
              <GradientOrb color="#7fe3b3" />
            </div>
            <div className="absolute -bottom-24 -left-24 w-60 h-60">
              <GradientOrb color="#4ecf94" />
            </div>
          </div>
          <PaperGrain className="opacity-30 dark:opacity-20" />
          <div className="mx-auto max-w-5xl px-4 py-16 md:py-20 text-center relative">
            <HankoSeal className="mx-auto mb-5 h-14 w-14 text-band-foreground/70" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-3">
              Ready to take control?
            </h2>
            <p className="text-sm mb-7 max-w-md mx-auto leading-relaxed text-band-foreground/80">
              Start with a clear view of your spending and build better habits one decision at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={session ? "/dashboard" : "/register"}>
                <Button size="lg" className="gap-1.5 text-sm font-medium bg-band-foreground text-band hover:bg-band-foreground/90 active:scale-[0.98] shadow-sm">
                  {session ? "Open Dashboard" : "Get Started Free"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/support">
                <Button size="lg" variant="outline" className="text-sm font-medium border-band-foreground/40 bg-transparent text-band-foreground hover:bg-band-foreground/10 hover:text-band-foreground">
                  Talk to support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
