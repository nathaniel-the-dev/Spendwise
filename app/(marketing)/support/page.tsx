import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticlePage } from "@/components/marketing/article";
import { FeedbackForm } from "@/components/shared/feedback-form";
import { Eyebrow, SUPPORT_EMAIL } from "@/components/marketing/visuals";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with SpendWise: browse the FAQ, work through common questions, or send the team a message.",
};

const channels = [
  {
    icon: BookOpen,
    title: "Check the FAQ first",
    body: "Most questions — privacy, manual entry, undo, budget math, how the numbers work — already have a written answer there.",
    action: { href: "/faq", label: "Browse the FAQ" },
  },
  {
    icon: MessageSquare,
    title: "Send us a message",
    body: "Not in the FAQ? Tell us what you expected and what happened — it lands directly with the people who build SpendWise.",
    action: { href: "#contact", label: "Jump to the form" },
  },
  ...(SUPPORT_EMAIL
    ? [
        {
          icon: ShieldCheck,
          title: "Report a security issue",
          body: "Found something that puts accounts or data at risk? Email us privately, and give us time to fix it before going public.",
          action: { href: `mailto:${SUPPORT_EMAIL}`, label: "Disclose privately" },
        },
      ]
    : []),
];

const troubleshooting = [
  {
    q: "A total doesn't match what I think I spent",
    a: "Check the filters: the dashboard counts this calendar month, a budget counts only its category inside its own period (this week/month/year), and uncategorized spending is invisible to budgets. The arithmetic itself is a plain sum of what you logged — nothing is estimated.",
  },
  {
    q: "My budget percentage doesn't match what I think I spent",
    a: "A budget only counts expenses in its category inside its current period (this week/month/year). Check the budget's period and start date on the Budgets page.",
  },
  {
    q: "I deleted a transaction more than 5 seconds ago",
    a: "Once the Undo window closes, the entry is gone from your ledger. If it was important, you can re-add it in a couple of seconds — nothing else was affected.",
  },
  {
    q: "The dashboard says 'Couldn't load…'",
    a: "That's a network or sign-in hiccup, not data loss. Hit Try again. If it persists, sign out and back in; if it's still stuck, email us with what you saw.",
  },
];

export default function SupportPage() {
  return (
    <ArticlePage
      eyebrow={<Eyebrow><BookOpen className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Support</Eyebrow>}
      title="Getting help"
      lede="SpendWise is a small, focused product, not a call center. Here's where answers actually live — and a few problems you can solve in a minute."
      aside={
        <div>
          <h2 className="label-mono text-muted-foreground mb-3">Expectations</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Replies come from the people who build SpendWise, not a ticket queue. There&apos;s no phone line, but
            clear messages with a bit of context get the fastest, most useful answer.
          </p>
          {SUPPORT_EMAIL ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Security issues: email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline underline-offset-4">{SUPPORT_EMAIL}</a>{" "}
              privately rather than posting them publicly.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Security issues: use the form below and mark it sensitive — we&apos;ll handle it privately.
            </p>
          )}
        </div>
      }
    >
<div className={`grid gap-3 ${channels.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""} mb-12`}>
          {channels.map((c) => (
            <div key={c.title} className="flex flex-col rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <c.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold mb-1.5">{c.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{c.body}</p>
              <Link href={c.action.href} className="mt-4">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  {c.action.label}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <section id="contact" className="scroll-mt-20 mb-12">
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em] mb-2">
          Send us a message
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xl">
          Questions, bug reports, and ideas all land in the same place: with the people who build SpendWise.
          If you leave an email, you&apos;ll get a reply.
        </p>
        <div className="rounded-xl border bg-card p-5 sm:p-6">
          <FeedbackForm />
        </div>
      </section>

      <section aria-labelledby="troubleshooting">
        <h2 id="troubleshooting" className="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em] mb-4">
          Quick troubleshooting
        </h2>
        <div className="rounded-xl border bg-card divide-y">
          {troubleshooting.map((t) => (
            <div key={t.q} className="p-5">
              <h3 className="text-sm font-semibold mb-1">{t.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-[-0.01em] mb-3">
          Before you write
        </h2>
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p className="flex gap-2.5">
            <Mail className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Tell us what you expected vs. what happened.</strong> Which
              page, roughly when, and what you were doing — that&apos;s usually enough to find it.
            </span>
          </p>
          <p className="flex gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Never share real financial data</strong> in a message —
              redact amounts and descriptions in screenshots. Synthetic values reproduce issues just as well.
            </span>
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Looking for the rules, not help? See the{" "}
        <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link> and{" "}
        <Link href="/terms" className="text-primary underline underline-offset-4">Terms of Service</Link>.
      </p>
    </ArticlePage>
  );
}
