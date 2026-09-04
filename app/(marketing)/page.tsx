import Link from "next/link";
import { ArrowRight, BarChart3, Coins, CreditCard, DollarSign, Music, PiggyBank, RefreshCcw, Rocket, Shield, ShoppingCart, Sparkles, Target, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CreditCard,
    title: "Track Expenses",
    description: "Log expenses in seconds with smart categorization and tags.",
    color: "from-emerald-400/20 to-emerald-500/5",
  },
  {
    icon: RefreshCcw,
    title: "Manage Subscriptions",
    description: "Track recurring payments and never miss a renewal again.",
    color: "from-blue-400/20 to-blue-500/5",
  },
  {
    icon: PiggyBank,
    title: "Set Budgets",
    description: "Create weekly, monthly, or yearly budgets and track progress.",
    color: "from-violet-400/20 to-violet-500/5",
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Beautiful charts and insights into your spending habits.",
    color: "from-amber-400/20 to-amber-500/5",
  },
  {
    icon: Shield,
    title: "Private by design",
    description: "Keep your financial picture organized in one focused, personal workspace.",
    color: "from-rose-400/20 to-rose-500/5",
  },
];

function DotGrid({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

function GradientOrb({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`orb-${color.replace(/\W/g, "")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill={`url(#orb-${color.replace(/\W/g, "")})`} />
    </svg>
  );
}

function DashboardMockup() {
  const rows = [
    { icon: ShoppingCart, name: "Grocery Store", cat: "Food", date: "Today", amount: "-$84.50", expense: true },
    { icon: Zap, name: "Electric Bill", cat: "Utilities", date: "Yesterday", amount: "-$145.00", expense: true },
    { icon: Music, name: "Spotify", cat: "Subscription", date: "Jun 12", amount: "-$9.99", expense: true },
    { icon: Coins, name: "Freelance Pay", cat: "Income", date: "Jun 10", amount: "+$1,200", expense: false },
  ];
  return (
    <div className="rounded-2xl border bg-card shadow-dialog overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
            <DollarSign className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs font-medium">Overview</span>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-rose-400" />
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3 border-b">
        {[
          { label: "Income", value: "$4,280", color: "text-emerald-600", change: "+12%" },
          { label: "Expenses", value: "$2,150", color: "text-rose-500", change: "+8%" },
          { label: "Savings", value: "$2,130", color: "text-primary", change: "50%" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-xs font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted flex-shrink-0">
                <r.icon className="h-3 w-3" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.cat} &middot; {r.date}</p>
              </div>
            </div>
            <span className={`text-xs font-medium flex-shrink-0 ml-2 ${!r.expense ? "text-emerald-600" : ""}`}>{r.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">$</span>
            <span>SpendWise</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <DotGrid className="w-full h-full text-border" />
            <div className="absolute -top-40 -right-40 w-96 h-96">
              <GradientOrb color="#00a86b" />
            </div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80">
              <GradientOrb color="#00d98b" />
            </div>
            <div className="absolute top-1/4 left-1/3 w-20 h-20 opacity-[0.03]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-foreground">
                <text x="0" y="80" fontSize="80" fontWeight="bold">$</text>
              </svg>
            </div>
            <div className="absolute bottom-1/3 right-1/4 w-16 h-16 opacity-[0.03]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-foreground">
                <text x="0" y="80" fontSize="70" fontWeight="bold">+</text>
              </svg>
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium mb-6 backdrop-blur-sm">
                A calmer way to manage everyday money
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
                Know where your money goes.
                <span className="text-primary"> Plan what comes next.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                SpendWise brings spending, recurring payments, budgets, and useful context into one clear view.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
              </div>
            </div>
          </div>
        </section>

        <section className="border-t relative">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium mb-4">
                  <Rocket className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  See it in action
                </div>
                <h2 className="text-xl font-semibold mb-2">Everything at a glance</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Your financial dashboard shows income, expenses, recent transactions, and budget progress
                  in one clean view. No clutter, no confusion.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border bg-card px-3 py-1.5">Income and expenses</span>
                  <span className="rounded-full border bg-card px-3 py-1.5">Budgets and goals</span>
                  <span className="rounded-full border bg-card px-3 py-1.5">Recurring payments</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-xl" />
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-px h-full bg-border/30" />
            <div className="absolute top-0 right-1/4 w-px h-full bg-border/30" />
          </div>
          <div className="mx-auto max-w-5xl px-4 py-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Powerful features
              </div>
              <h2 className="text-lg font-semibold mb-2">Everything you need to manage your money</h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Powerful features to help you understand and optimize your spending.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <Icon className="h-5 w-5 text-primary" />
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

        <section className="border-t relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64">
              <GradientOrb color="#00a86b" />
            </div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48">
              <GradientOrb color="#00d98b" />
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-4 py-16 text-center relative">
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium mb-4 backdrop-blur-sm">
              <Target className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Get started today
            </div>
            <h2 className="text-lg font-semibold mb-2">Ready to take control?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Start with a clear view of your spending and build better habits one decision at a time.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-1.5 text-sm font-medium shadow-sm">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SpendWise. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Privacy-first workspace</span>
            <span>Personal use</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
