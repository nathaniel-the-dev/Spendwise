import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, PiggyBank, RefreshCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CreditCard,
    title: "Track Expenses",
    description: "Log expenses in seconds with smart categorization and tags.",
  },
  {
    icon: RefreshCcw,
    title: "Manage Subscriptions",
    description: "Track recurring payments and never miss a renewal again.",
  },
  {
    icon: PiggyBank,
    title: "Set Budgets",
    description: "Create weekly, monthly, or yearly budgets and track progress.",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Beautiful charts and insights into your spending habits.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and protected with industry-standard security.",
  },
];

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">$</span>
            <span>SpendWise</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-8">
              ✨ Smart Expense Tracking Made Simple
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Take Control of Your
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-500">
                {" "}Financial Future
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Track expenses, manage subscriptions, set budgets, and gain actionable insights
              to make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to manage your money</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Powerful features to help you understand and optimize your spending.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t py-20 bg-muted/50">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already making smarter financial decisions with SpendWise.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
