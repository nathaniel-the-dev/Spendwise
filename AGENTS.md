# AGENTS.md — SpendWise

Instructions for AI coding agents working in this repository. Read this before making changes.

## What this project is

Personal finance tracker: **Next.js 15** (App Router, no `src/`), **React 19**, **TypeScript (strict)**, **Tailwind CSS v4**, Radix UI primitives (shadcn-style, in `components/ui/`), **TanStack Query**, **React Hook Form + Zod**, **Recharts**, and **Supabase** for BOTH auth and all data (PostgREST). Version 2.0.0, MIT licensed.

There is **no** Drizzle, no direct Postgres driver, no NextAuth, no i18n library, no ORM, and no test runner or CI config. Do not reintroduce any of these — the legacy stack was deliberately removed (commit `0d39303`).

## Commands

| Command | Notes |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build; also type-checks |
| `npm run typecheck` | `tsc --noEmit` — use this to verify changes |
| `npm run lint` | ⚠️ `next lint` is deprecated/interactive — avoid in automation |
| `npm run start` | Serve the production build |

**Critical gotcha:** the dev server and `next build` CONFLICT — running both corrupts `.next` and causes 500s. Kill one before starting the other. `typecheck` is safe alongside the dev server.

## Environment variables

Core vars (`.env.local`, full list in README): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`. The `NEXT_PUBLIC_` prefix is mandatory for the Supabase pair because `lib/supabase/client.ts` runs in the browser — production builds only bundle `NEXT_PUBLIC_`-prefixed vars (dev mode hides this by exposing all env vars to client code). Never add secrets or use the `service_role` key — all data access goes through the anon/publishable key with Row Level Security.

## Architecture rules

### API routes (`app/api/**/route.ts`)
Every route handler follows the same pattern — match it:
1. `const { userId } = await getAuthContext()` from `@/lib/api-utils` (throws `"Unauthorized"`).
2. Wrap everything in `try { … } catch (error) { return handleError(error) }` — it maps the Unauthorized error to 401, everything else to 500.
3. Create the server client with `createClient()` from `@/lib/supabase/server`.
4. Validate request bodies with a Zod schema defined at module top; return `{ error: "Invalid input", details: parsed.error.flatten() }` with status 400 on failure.
5. ALWAYS filter/mutate by `user_id` (`.eq("user_id", userId)`, `user_id: userId` on insert). RLS is the safety net, not the design.
6. Generate ids with `generateId()` from `@/lib/utils` and pass them explicitly on insert.

### Database schema
Managed in the Supabase dashboard/SQL editor — **there is no local migration tooling**; never look for or create migration files. Tables: `user`, `category`, `transaction`, `budget`, `subscription`, `subscription_payment`. All columns `snake_case`.

**PostgREST is strict about casing:** request payloads must map camelCase fields to snake_case columns before `.update()`/`.insert()` (e.g. `preferredCurrency` → `preferred_currency`), or the query 500s. This was a real bug in `PATCH /api/settings` — don't repeat it.

The `user` table only has `name`, `email`, `preferred_currency`, `locale`, `theme` (+ timestamps). There is no DDL access via the anon key, so settings that need new columns cannot be backed — don't build decorative, non-functional controls.

### Money math (P0-critical conventions)
- Amounts are stored **positive**; the `type` field (`expense`/`income`) carries meaning.
- The app tracks money in a **single currency** per user (`preferred_currency` on the `user` row is the display/entry currency). There is NO multi-currency conversion: `amount_in_preferred`, `toPreferred()`, `needsConversion()`, `/api/exchange-rates`, and `hooks/use-exchange-rate.ts` were removed deliberately — do not reintroduce them. Totals are plain sums of `amount`; use `txValue(tx)` (`Math.abs(amount)`) as the single aggregation accessor.
- Budget spend is defined ONCE: `computeBudgetSpend(budget, txns)` + `budgetPct` + `budgetTone` in `lib/utils.ts`, shared by the dashboard and budgets page. `budgetPct` is intentionally uncapped (overages like 128% must show); cap only the `Progress` bar value.
- Display colors: `--spend` is the spending token (Progress tone + chart fills). Brand green is NOT for spend.

### Client data access
Reads/writes go through the TanStack Query hooks in `hooks/` (`use-transactions.ts`, `use-budgets.ts`, etc.) hitting the `/api/*` routes — components never call Supabase PostgREST directly (except auth via `components/supabase-provider.tsx`). `useTransactionsPage()` is paginated (50/page, offset); plain `useTransactions()` fetches up to 500 for aggregates. Mutations must invalidate BOTH `["transactions"]` and `["transactions-page"]`.

### Deletes
Transaction/budget/subscription deletes are **undoable**: the mutation captures the full object and the toast offers a 5s Undo that re-POSTs it. Category deletes are NOT undoable (unlinked transactions can't be re-linked) and keep a confirm dialog.

### Auth
Email/password with a PKCE flow (`app/auth/callback/route.ts`). `middleware.ts` → `lib/supabase/middleware.ts` refreshes sessions and protects `/dashboard`. Route handlers use `lib/auth.ts` (`getUser()`). The sidebar/avatar name reads **auth `user_metadata`**, not the DB — `PATCH /api/settings` syncs `auth.updateUser({ data: { name } })` when name changes; keep that in sync.

### Icons
No emoji anywhere in UI code. Categories store `icon` as a string key into `categoryIconMap` in `components/category-icon.tsx` (the central Lucide registry); DB default is `"circle"`. Register new icons there rather than importing Lucide ad hoc.

### Locale
`setDefaultLocale()` is called in the dashboard layout from user settings; `formatCurrency`/`formatDate` in `lib/utils.ts` default to it. Don't hardcode `en-US` in components.

## Code conventions

- TypeScript `strict` — no `any`, no `@ts-ignore` without a comment explaining why.
- Path alias `@/*` maps to the repo root; always use it instead of relative `../../` imports.
- Styling: Tailwind v4 utilities + `cn()` from `lib/utils.ts`; class-variance-authority for variants in `components/ui/`. New primitives should follow the existing shadcn-style files.
- Form dialogs (`components/shared/*-form-dialog.tsx`) use React Hook Form with Zod resolvers; reuse the same Zod shapes as the API routes where possible.
- User-facing success/error feedback via `sonner` toasts, not `alert()`/`confirm()` (except the category-delete confirm).
- Keep changes scoped; this project favors deleting non-functional UI over shipping decorative controls.

## Verifying your work

1. `npm run typecheck` must pass (dev server may stay running; stop it before any `npm run build`).
2. For UI changes, check in the browser at http://localhost:3000 (dashboard requires a registered account) and verify both light/dark themes and mobile widths.
3. Money-related changes: double-check every aggregate uses `txValue` and the shared budget helpers — the app is single-currency, so a total must be a plain sum of stored `amount`.

## Repo hygiene notes

- `.gitignore` excludes `.omo/` and `.codegraph` (local agent/tool data).
- `design/` (prototype HTML + screenshots) and `exports/` (UI plan docs) are intentionally untracked on disk — do not commit or delete them without asking.
- Git on Windows emits pre-existing LF→CRLF warnings; they are non-blocking, not your bug.
