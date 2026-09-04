import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "SpendWise — Smart Expense Tracking",
    template: "%s | SpendWise",
  },
  description:
    "Take control of your finances with SpendWise. Track expenses, manage subscriptions, set budgets, and gain insights into your spending habits.",
  keywords: [
    "expense tracker",
    "budgeting",
    "subscription management",
    "personal finance",
    "money management",
  ],
  authors: [{ name: "SpendWise" }],
  openGraph: {
    title: "SpendWise — Smart Expense Tracking",
    description:
      "Take control of your finances with SpendWise. Track expenses, manage subscriptions, set budgets, and gain insights.",
    siteName: "SpendWise",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise — Smart Expense Tracking",
    description:
      "Take control of your finances with SpendWise. Track expenses, manage subscriptions, set budgets, and gain insights.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
