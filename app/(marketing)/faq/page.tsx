import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ArticlePage } from "@/components/marketing/article";
import { Eyebrow } from "@/components/marketing/visuals";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about SpendWise: privacy and data handling, manual entry, budgets, undo, cost, and what the app is not.",
};

const groups: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "Privacy & data",
    items: [
      {
        q: "Where is my financial data stored?",
        a: (
          <>
            In your own private account, isolated from every other account. SpendWise is built so no one —
            including us — can browse your ledger, and the full detail is in the{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
          </>
        ),
      },
      {
        q: "Does SpendWise connect to my bank?",
        a: "No. There is no bank sync, no card linking, and no account credentials of any kind. You enter transactions yourself. That's a feature: the app can't leak what it never received.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. Your data is yours to take and yours to remove. You can export your ledger at any time, and deleting your account removes your profile and every transaction, budget, and subscription tied to it. The Support page explains how to request it.",
      },
      {
        q: "Is there analytics or tracking?",
        a: "No. There are no analytics scripts, ad networks, or third-party trackers anywhere in the app or on these marketing pages. SpendWise makes money by being useful to you, not by watching you.",
      },
    ],
  },
  {
    title: "Money & math",
    items: [
      {
        q: "How does currency work?",
        a: "You pick one currency in Settings and everything is totalled in it. If a charge is billed in another currency — a USD subscription on a JMD budget, say — you enter the amount in USD and SpendWise converts it once, at the rate you see (auto-fetched, and editable if your bank used something different). That rate is saved with the entry, so a total is always exactly the sum of what you logged and never shifts with the market.",
      },
      {
        q: "Why does a budget show more than 100%?",
        a: "Because '128%' is more useful than a full bar. The percentage is uncapped deliberately so you can see how far over you are; the progress bar itself caps at full.",
      },
      {
        q: "What counts as a 'commitment'?",
        a: "Your active subscriptions, normalized to a monthly amount (a yearly plan counts as one-twelfth). Subscriptions already charged this month appear under Spent instead — no double-counting.",
      },
    ],
  },
  {
    title: "Using the app",
    items: [
      {
        q: "I deleted the wrong thing. Is it gone?",
        a: "Deleting a transaction, budget, or subscription shows a toast with Undo for 5 seconds — tapping it restores the item exactly as it was. Category deletes are the one exception (unlinked transactions can't be re-linked automatically), so those still ask first.",
      },
      {
        q: "Can I edit a transaction after logging it?",
        a: "Yes — open any row in the Transactions list and use Edit. The form pre-fills with everything, including tags and notes.",
      },
      {
        q: "How do I log ten receipts without going mad?",
        a: "Tick 'Keep adding' in the Add Transaction dialog. After saving, the form clears the amount and description but keeps your type, date, and category — so each receipt is one line, not a fresh form.",
      },
      {
        q: "Does it work on mobile?",
        a: "Yes. The layout is mobile-first: the sidebar collapses to a drawer, transaction rows stack, and dialogs are touch-sized. Dark mode is system-aware with a manual toggle.",
      },
    ],
  },
  {
    title: "Cost & access",
    items: [
      {
        q: "Is SpendWise free?",
        a: "You can start and use the core of it without paying, and there are no ads or upsells buried in the interface. If you want more — deeper history, exports, extra organization — we'll offer a paid plan built to stay honest about what you're paying for.",
      },
      {
        q: "Will you sell my data?",
        a: "No. That's the whole point of a privacy-first tool. SpendWise earns from people who choose it, not from their financial information. The Privacy Policy commits to this in plain language.",
      },
      {
        q: "What is the roadmap?",
        a: "SpendWise is deliberately focused. New features arrive when they earn their complexity, not on a release calendar — so you can expect it to stay calm and small rather than grow into everything for everyone.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <ArticlePage
      eyebrow={<Eyebrow><HelpCircle className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />FAQ</Eyebrow>}
      title="Frequently asked questions"
      lede="Straight answers about privacy, money math, and how the app behaves. If yours isn't here, the Support page has the routes that are."
    >
      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`faq-${group.title.replace(/\W+/g, "-").toLowerCase()}`}>
            <h2
              id={`faq-${group.title.replace(/\W+/g, "-").toLowerCase()}`}
              className="label-mono text-muted-foreground mb-4"
            >
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <details key={item.q} className="group rounded-xl border bg-card transition-colors hover:border-primary/30 open:border-primary/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="px-5 pb-5 -mt-1 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ArticlePage>
  );
}
