# SpendWise

A modern, personal expense tracking application built with Next.js 15. Track expenses, manage subscriptions, set budgets, and gain actionable insights into your spending habits.

> **Tech Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL (Neon) · Drizzle ORM · NextAuth v5 · Recharts

## ✨ Features

- **Multi-currency expense tracking** — Log transactions in any currency with automatic conversion
- **Subscription management** — Track recurring payments with upcoming renewal alerts
- **Budget planning** — Set weekly, monthly, or yearly budgets per category
- **Beautiful reports** — Interactive pie/donut/bar charts with natural-language spending summaries
- **Time-aware dashboard** — "Good morning" greeting with daily financial snapshot and smart insights
- **Two-factor authentication** — TOTP-based 2FA via authenticator apps (Google Authenticator, etc.)
- **Google OAuth** — Sign in with Google in one click
- **Dark mode** — System-aware theme with manual toggle
- **Glassmorphism 2.0** — Frosted glass sidebar and cards with backdrop blur
- **Personalization** — Accent color picker, compact/cozy layouts, avatar with gradient fallback
- **Responsive** — Mobile-first design with collapsible sidebar

## 📸 Screenshots

| Dashboard | Transactions | Reports |
|-----------|-------------|---------|
| Time-aware greeting, bento grid stats, narrative insights, recent activity | Filterable list with emoji categories, add/delete dialogs | Donut & bar charts with AI-generated monthly letter summary |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL instance)
- A Google OAuth Client ID and Secret (optional, for social login)

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
| `DATABASE_URL` | PostgreSQL connection string (Neon or any PG) |
| `AUTH_SECRET` | Random string for session encryption (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Your app URL (default: `http://localhost:3000`) |

### Database Setup

Push the schema to your database:

```bash
npm run db:push
```

Generate TypeScript types (optional, for Drizzle Kit Studio):

```bash
npm run db:generate
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register your first account.

### Production Build

```bash
npm run build
npm start
```

## 🗄️ Database Schema

The schema uses 8 main tables:

| Table | Purpose |
|-------|---------|
| `user` | User accounts with preferences (currency, locale, theme, 2FA) |
| `category` | Custom categories with icon and color per user |
| `transaction` | Expense/income entries with currency, category, tags |
| `budget` | Spending limits per category with period and date range |
| `subscription` | Recurring payments with billing cycle and status tracking |
| `subscription_payment` | Payment history linked to subscriptions |
| `account` / `session` | NextAuth adapter tables for auth |
| `authenticator` | TOTP 2FA credential storage |

## 🧭 Project Structure

```
├── app/
│   ├── (auth)/login          # Login with email/password + 2FA + Google
│   ├── (auth)/register        # Registration
│   ├── (marketing)/           # Landing / marketing page
│   ├── api/                   # API routes (auth, crud for all entities)
│   │   ├── auth/              # NextAuth handler
│   │   ├── categories/        # GET/POST, GET/PATCH/DELETE by id
│   │   ├── transactions/      # GET/POST with search & filters
│   │   ├── budgets/           # GET/POST, PATCH/DELETE by id
│   │   └── subscriptions/     # GET/POST, PATCH/DELETE by id
│   ├── dashboard/             # All protected pages
│   │   ├── page.tsx           # Overview with greeting + insights
│   │   ├── transactions/      # Transaction list with search
│   │   ├── categories/        # CRUD category management
│   │   ├── budgets/           # Budget creation & tracking
│   │   ├── subscriptions/     # Subscription management
│   │   ├── reports/           # Charts + narrative summaries
│   │   └── settings/          # Profile, appearance, security
│   └── globals.css            # Warm palette + glass + animations
├── components/
│   ├── shared/                # Reusable form dialogs
│   │   ├── category-form-dialog.tsx
│   │   ├── transaction-form-dialog.tsx
│   │   ├── budget-form-dialog.tsx
│   │   └── subscription-form-dialog.tsx
│   ├── ui/                    # shadcn/ui primitives
│   └── providers.tsx          # Session, Theme, QueryClient providers
├── hooks/                     # React Query hooks for all entities
│   ├── use-categories.ts
│   ├── use-transactions.ts
│   ├── use-budgets.ts
│   └── use-subscriptions.ts
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema
│   │   └── index.ts           # DB client (Neon serverless)
│   ├── auth.ts                # NextAuth config (credentials + Google + 2FA)
│   ├── api-utils.ts           # Auth context & error handling helpers
│   └── utils.ts               # formatCurrency, cn, etc.
└── drizzle.config.ts          # Drizzle Kit config
```

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Kit Studio |

## 🚢 Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

The app is ready for Vercel deployment. Make sure to:

1. Set all environment variables in your Vercel project dashboard
2. Ensure your PostgreSQL (Neon) database is accessible from Vercel's IP range
3. Set `NEXT_PUBLIC_APP_URL` to your production domain

## 📄 License

MIT
