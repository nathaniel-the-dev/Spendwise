import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ArticlePage, Section } from "@/components/marketing/article";
import { Eyebrow } from "@/components/marketing/visuals";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What SpendWise stores, what it never touches, and how to delete it all. No analytics, no trackers, no data sale — ever.",
};

const updated = "September 20, 2026";

export default function PrivacyPage() {
  return (
    <ArticlePage
      eyebrow={<Eyebrow><ShieldCheck className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Legal</Eyebrow>}
      title="Privacy Policy"
      lede={`SpendWise is a personal ledger, and personal ledgers stay personal. This policy describes exactly what we store and what we never touch — last updated ${updated}.`}
    >
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Short version: we store only what you type. We run no analytics, no ads, and no tracking of any
        kind — and we never see your bank.
      </p>

      <Section title="1. Information we store">
        <p>When you create an account, SpendWise stores:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-foreground">Account credentials:</strong> your email address and a salted hash of your password — never the password itself. Nobody at SpendWise can read it.</li>
          <li><strong className="text-foreground">Profile:</strong> your display name and (optionally) an avatar image — used only to greet you and identify you in your own interface.</li>
          <li><strong className="text-foreground">Preferences:</strong> your currency, language, and theme choice.</li>
          <li><strong className="text-foreground">Your content:</strong> the transactions, categories, budgets, and subscriptions you create — descriptions, amounts, dates, tags, and notes you enter.</li>
        </ul>
        <p>
          We do not ask for, and cannot store, bank logins, card numbers, or government identifiers. If you
          sign in with Google, we additionally receive your Google profile name and photo.
        </p>
      </Section>

      <Section title="2. What we never do">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Sell, rent, or share your data with anyone, for any purpose.</li>
          <li>Run advertising, analytics, or social trackers — on this site or in the app. There are no cookies beyond the session cookie required to keep you signed in.</li>
          <li>Read your ledger. Every account&apos;s data is isolated at the storage layer, so a request can only ever reach your own rows — even a broken one.</li>
          <li>Send you marketing email. You get email only when you ask for it (e.g. an authentication flow).</li>
        </ul>
      </Section>

      <Section title="3. Your rights and deletion">
        <p>
          Your data is yours. You can remove entries any time from inside the app, and you can ask us to
          delete your entire account — profile, transactions, budgets, and subscriptions are removed
          together. See the{" "}
          <Link href="/support" className="text-primary underline underline-offset-4">Support page</Link>{" "}
          for how to reach us.
        </p>
      </Section>

      <Section title="4. Security">
        <p>
          The site and app are served over HTTPS, passwords are salted and hashed, and every request to your
          data is checked against your sign-in before it runs. No system is perfect — if you believe
          you&apos;ve found a vulnerability, please report it privately via the contact on the Support page.
        </p>
      </Section>

      <Section title="5. Changes to this policy">
        <p>
          If this policy changes, the &ldquo;last updated&rdquo; date above changes with it. Material changes
          will be noted on the Support page. Continuing to use the app after a change means accepting it.
        </p>
      </Section>

      <p className="text-xs text-muted-foreground">
        Questions about this policy? See <Link href="/support" className="text-primary underline underline-offset-4">Support</Link>.
        Related: <Link href="/terms" className="text-primary underline underline-offset-4">Terms of Service</Link>.
      </p>
    </ArticlePage>
  );
}
