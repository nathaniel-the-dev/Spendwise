import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

// UI workhorse face — the variable is declared on <html> (see RootLayout) so
// Tailwind's preflight, which reads --font-sans at root scope, actually
// resolves it. Declaring these on <body> left every consumer out of scope and
// silently fell back to system-ui.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Editorial serif for display headings — the "Kanso" voice: calm, considered,
// confident. SOFT rounds the terminals, WONK switches on the quirky alternate
// glyphs that are the whole reason to pick Fraunces over a stock serif, and
// opsz lets font-optical-sizing do its job at display sizes.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
});

// Small uppercase micro-labels (eyebrows, card titles, table headers).
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "SpendWise — Budgeting without bank sync",
    template: "%s | SpendWise",
  },
  description:
    "Track expenses, budgets, and subscriptions by hand — no bank logins, no trackers, nothing to monetize. One honest number: what you can actually spend.",
  keywords: [
    "budgeting without bank linking",
    "manual expense tracker",
    "private budget app",
    "budget app no bank access",
    "subscription management",
    "personal finance",
  ],
  authors: [{ name: "SpendWise" }],
  openGraph: {
    title: "SpendWise — Budgeting without bank sync",
    description:
      "Track expenses, budgets, and subscriptions by hand — no bank logins, no trackers. One honest number: what you can actually spend.",
    siteName: "SpendWise",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise — Budgeting without bank sync",
    description:
      "Track expenses, budgets, and subscriptions by hand — no bank logins, no trackers. One honest number: what you can actually spend.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
