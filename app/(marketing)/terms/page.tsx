import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { ArticlePage, Section } from "@/components/marketing/article";
import { Eyebrow } from "@/components/marketing/visuals";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using SpendWise: a personal finance tool provided as is, with no warranty and no financial advice.",
};

const updated = "September 20, 2026";

export default function TermsPage() {
  return (
    <ArticlePage
      eyebrow={<Eyebrow><Scale className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Legal</Eyebrow>}
      title="Terms of Service"
      lede={`By using SpendWise you agree to these terms — last updated ${updated}. They are deliberately short, because the product is deliberately small.`}
    >
      <Section title="1. The service">
        <p>
          SpendWise is a personal money-tracking service: you log transactions, set budgets, and watch the
          numbers. These terms govern your use of it. What you pay for (which today is nothing) is described
          on the site; if a paid plan is ever introduced, its price and terms will be shown before you
          commit to anything.
        </p>
      </Section>

      <Section title="2. Your account and your data">
        <p>
          You are responsible for keeping your credentials safe and for everything that happens under your
          account. The ledger content in your account — transactions, budgets, notes — is yours. We hold it
          as your custodian, not our asset, and our handling of it is described in the{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>use the service to store or process other people&apos;s financial data without their consent;</li>
          <li>attempt to access another user&apos;s data, circumvent rate limits, or probe the service for vulnerabilities (report them politely instead — see Support);</li>
          <li>use the service for anything unlawful, including laundering or disguising the origin of funds;</li>
          <li>resell access to the service as your own offering without changing it substantially.</li>
        </ul>
      </Section>

      <Section title="4. No financial advice">
        <p>
          SpendWise computes sums and draws charts. It does not advise. Nothing in the app — including
          &ldquo;available this month,&rdquo; savings rates, or budget alerts — is financial, investment, tax, or
          legal advice, and no algorithm in it knows your debts, income changes, or goals. Decide with your own
          judgment or a licensed professional.
        </p>
      </Section>

      <Section title="5. Availability, changes, and termination">
        <p>
          The service is provided without an uptime guarantee. Features may change or disappear. You may stop
          using it at any time, and you may ask us to delete your account and everything in it. If we ever
          end the service, we&apos;ll say so and give you a window to take your data with you.
        </p>
      </Section>

      <Section title="6. Disclaimer and liability">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS,&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY AND FITNESS FOR A PURPOSE. THE AUTHORS ARE NOT LIABLE FOR ANY LOSS — OF
          DATA, MONEY, OR ELSEWHERE — ARISING FROM USE. For a money-tracking tool, that disclaimer matters:
          keep your own records of anything you can&apos;t afford to lose.
        </p>
      </Section>

      <Section title="7. These terms">
        <p>
          These terms may be updated; the date above is the signal. Continued use after an update means
          acceptance. If a provision is unenforceable where you live, the rest still stands.
        </p>
      </Section>

      <p className="text-xs text-muted-foreground">
        Questions? <Link href="/support" className="text-primary underline underline-offset-4">Support</Link>.
        How data is handled: <Link href="/privacy" className="text-primary underline underline-offset-4">Privacy Policy</Link>.
      </p>
    </ArticlePage>
  );
}
