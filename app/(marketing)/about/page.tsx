import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ArticlePage, Section, Sub } from "@/components/marketing/article";
import { Eyebrow } from "@/components/marketing/visuals";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why SpendWise exists: a calm, private, answer-first home for everyday money — built for people, not for data.",
};

const principles = [
  {
    title: "Answer-first, not dashboard-first",
    body: "Software should finish the user's thought. SpendWise opens with the one number the whole app exists to compute — what's left to spend — and keeps everything else one tap away.",
  },
  {
    title: "Money is stored honestly",
    body: "Amounts are kept exactly as you enter them — nothing is estimated, rounded away, or quietly reinterpreted. A charge billed in another currency is converted once, at a rate you can see and edit, and that rate is saved with the entry. A total is the sum of what you logged, and a number you can't trust is flagged, not hidden.",
  },
  {
    title: "Reversible beats cautious",
    body: "Confirm dialogs are friction tax paid by everyone to protect the momentary slip. SpendWise keeps the slip cheap with a 5-second undo instead of taxing every delete.",
  },
  {
    title: "Private by construction",
    body: "No bank connections, no card numbers, no analytics scripts, no ad pixels. Your ledger is yours alone — the app is built so there's nothing to leak and no reason to sell it.",
  },
];

export default function AboutPage() {
  return (
    <ArticlePage
      eyebrow={<Eyebrow><Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />About</Eyebrow>}
      title="Built for one person. Then shared."
      lede="SpendWise started as a spreadsheet refusal — one person's refusal to keep doing mental arithmetic to answer 'can I afford this?' What began as a personal tool became SpendWise: a small, focused app with opinions, now open to anyone who wants the same calm."
    >
      <Section title="The problem it was built against">
        <p>
          Most personal-finance software assumes you want a project: connect your bank, categorize a thousand
          historical transactions, maintain the system forever. Most people don&apos;t. They want the answer to
          three questions, fast —
        </p>
        <p className="text-foreground font-medium">
          &ldquo;What can I spend this month?&rdquo; &middot; &ldquo;What&apos;s coming out of me automatically?&rdquo;
          &middot; &ldquo;Where does it actually go?&rdquo;
        </p>
        <p>
          SpendWise is the shape of an answer to those questions: one honest number up top, a subscriptions radar
          behind it, and reports that slice your history any way you ask. It&apos;s a personal-finance tool by
          design — your money&apos;s story is nobody else&apos;s, and the app never asks to see anyone
          else&apos;s accounts.
        </p>
      </Section>

      <Section title="Principles">
        {principles.map((p) => (
          <Sub key={p.title} title={p.title}>
            <p>{p.body}</p>
          </Sub>
        ))}
      </Section>

      <Section title="What it deliberately isn't">
        <p>
          It&apos;s not financial advice, a budgeting coach, or an investment tracker. It doesn&apos;t predict your
          future or nudge you with gamification. It computes, displays, and gets out of the way. The judgment stays
          with you — that&apos;s the part that doesn&apos;t scale into software.
        </p>
      </Section>

      <p className="text-sm text-muted-foreground">
        Curious about the details? Read the <Link href="/faq" className="text-primary underline underline-offset-4">FAQ</Link>,
        see <Link href="/support" className="text-primary underline underline-offset-4">support options</Link>, or check how
        data is handled in the <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
      </p>
    </ArticlePage>
  );
}
