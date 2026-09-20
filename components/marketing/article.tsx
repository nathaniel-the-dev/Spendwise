import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { DotGrid, Eyebrow } from "@/components/marketing/visuals";
import { SiteFooter, SiteHeader } from "@/components/marketing/chrome";

/**
 * Shared shell for the long-form marketing pages (about, faq, support,
 * privacy, terms): header/footer chrome, a quiet editorial hero, and a
 * readable measure for prose.
 */
export async function ArticlePage({
  title,
  lede,
  eyebrow,
  children,
  aside,
}: {
  title: string;
  lede: string;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const session = await auth();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader session={session} />
      <main className="flex-1">
        <div className="relative border-b">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <DotGrid className="w-full h-full text-primary/60 opacity-60" />
          </div>
          <div className="mx-auto max-w-3xl px-4 py-14 md:py-18 relative">
            {eyebrow ?? <Eyebrow>SpendWise</Eyebrow>}
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-[1.05] mt-4 mb-3">
              {title}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{lede}</p>
          </div>
        </div>
        <div className={`mx-auto px-4 py-12 md:py-16 ${aside ? "max-w-5xl grid lg:grid-cols-[minmax(0,1fr)_15rem] gap-12 items-start" : "max-w-3xl"}`}>
          <article className="prose-spendwise min-w-0">{children}</article>
          {aside && (
            <aside className="lg:sticky lg:top-20 rounded-xl border bg-card p-5 text-sm">
              {aside}
            </aside>
          )}
        </div>
        <div className="border-t bg-muted/30">
          <div className="mx-auto max-w-3xl px-4 py-8 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <Link href="/register" className="text-sm font-medium text-primary hover:underline">
              Create your account →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Section heading inside article prose. */
export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 mb-10">
      <h2 className="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em] mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-foreground">{children}</div>
    </section>
  );
}

export function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
