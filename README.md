# SpendWise

A modern, personal finance tracker built with **Next.js 15**. Track expenses and income, plan budgets, manage subscriptions, and get clear, decision-first insights into your money.

> **Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Radix UI · TanStack Query · React Hook Form + Zod · Recharts · [Supabase](https://supabase.com) (Auth + Postgres via PostgREST)

## ✨ Features

- **Overview dashboard** — A "one-number" view of money available this month, with an income/spent/commitments breakdown, weekly context, and smart alerts (over-budget, upcoming renewals).
- **Transaction tracking** — Log expenses and income in any currency, tag a category, and get automatic conversion to your preferred currency.
- **Budgets** — Set weekly, monthly, or yearly limits per category with live spend progress.
- **Subscriptions** — Track recurring payments with billing-cycle normalization and upcoming renewal alerts.
- **Reports** — Interactive donut/bar charts with per-category breakdowns.
- **Categories** — Custom categories with a Lucide icon and color.
- **Settings** — Update your profile, preferred currency, locale, and theme, and change your password.
- **Supabase auth** — Email/password sign-up & login with a secure PKCE callback flow; dashboard is protected via middleware.
- **Dark mode** — System-aware theme with a manual toggle.
- **Responsive & accessible** — Mobile-first layout, keyboard-friendly Radix UI primitives, reduced-motion support.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- A [Supabase](https://supabase.com) project (provides both authentication and the Postgres database)

### Installation

```bash
git clone https://github.com/your-username/spendwise.git
cd spendwise
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (default: `http://localhost:3000`) |

### Database Setup

Data access goes through **Supabase PostgREST** — there is no local migration tooling. The schema is managed from the Supabase dashboard / SQL editor. The core tables and their columns are documented under [Database schema](#-database-schema) below. Seed a `user` profile row on sign-up (see `app/api/register/route.ts`) and enable Row Level Security so users only read/write their own rows.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register your first account.

## 🗄️ Database schema

The app reads and writes through Supabase PostgREST. Tables and key columns (all `snake_case`):

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `user` | User profile + preferences (managed alongside Supabase `auth.users`) | `id`, `name`, `email`, `preferred_currency`, `locale`, `theme`, `created_at`, `updated_at` |
| `category` | Custom categories per user | `id`, `name`, `icon`, `color`, `type` (`expense`/`income`), `user_id` |
| `transaction` | Expense/income entries | `id`, `amount`, `currency`, `amount_in_preferred`, `description`, `date`, `type`, `category_id`, `user_id`, `tags`, `notes` |
| `budget` | Spending limits per category | `id`, `amount`, `currency`, `period` (`weekly`/`monthly`/`yearly`), `start_date`, `end_date`, `category_id`, `user_id` |
| `subscription` | Recurring payments | `id`, `name`, `amount`, `currency`, `amount_in_preferred`, `billing_cycle` (`weekly`/`monthly`/`quarterly`/`yearly`/`custom`), `billing_interval`, `category_id`, `start_date`, `next_billing_date`, `end_date`, `status`, `user_id` |
| `subscription_payment` | Payment history for subscriptions | `id`, `subscription_id`, `amount`, `currency`, `paid_date` |

> Convention: amounts are stored as **positive** numbers; the `type` field (`expense`/`income`) carries meaning. Currency conversion uses `amount_in_preferred` populated at write time.

## 🧭 Project structure

```
├── app/
│   ├── (auth)/login            # Login (email/password)
│   ├── (auth)/register         # Registration
│   ├── (marketing)/            # Landing / marketing page
│   ├── auth/callback/          # Supabase PKCE auth callback
│   ├── api/                    # Route handlers (Supabase PostgREST)
│   │   ├── auth/signout/
│   │   ├── register/
│   │   ├── categories/         # GET/POST, PATCH/DELETE by id
│   │   ├── transactions/       # GET/POST (search & filters), by id
│   │   ├── budgets/            # GET/POST, PATCH/DELETE by id
│   │   ├── subscriptions/      # GET/POST, PATCH/DELETE by id
│   │   └── settings/           # PATCH profile; /password change
│   ├── dashboard/              # Protected pages
│   │   ├── page.tsx            # Overview ("available this month" hero + alerts)
│   │   ├── transactions/ categories/ budgets/ subscriptions/ reports/ settings/
│   └── layout.tsx, globals.css
├── components/
│   ├── ui/                     # shadcn-style primitives (Radix + Tailwind v4)
│   ├── shared/                 # Form dialogs (category/transaction/budget/subscription)
│   ├── category-icon.tsx       # Central Lucide icon registry
│   ├── supabase-provider.tsx   # Auth session/UserContext provider
│   └── providers.tsx           # Theme, QueryClient, User providers
├── hooks/                      # TanStack Query hooks
│   ├── use-categories.ts use-transactions.ts use-budgets.ts use-subscriptions.ts
├── lib/
│   ├── supabase/               # client.ts, server.ts, middleware.ts
│   ├── auth.ts                 # getUser() wrapper used by route handlers
│   ├── api-utils.ts            # Auth context + error handling helpers
│   └── utils.ts                # formatCurrency, normalizeBillingAmount, icons, cn
├── middleware.ts               # Session refresh + route protection
└── next.config.mjs
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks) |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |

## 🚢 Deployment

The app is ready for Vercel deployment.

1. Push the repository to GitHub and import it in Vercel.
2. Set the environment variables in your Vercel project (see [Environment Variables](#environment-variables)).
3. Point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at your hosted Supabase project and add `NEXT_PUBLIC_APP_URL` to your Supabase Auth redirect allow-list.

## 📄 License

MIT
