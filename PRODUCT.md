# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Privacy-minded individuals who want a clear answer about their money without handing over bank credentials — the manual-entry, no-bank-sync posture the code is built around. They arrive at the dashboard mid-task (Operate: decide what they can spend now) and at the landing page deciding whether to trust the tool (Persuade).

*Inferred: no audience research exists in-repo; the founder may be the primary user. Marked open below.*

## Product Purpose

Track expenses and income, set per-category budgets, manage recurring subscriptions, and turn the pile into decision-first clarity: one number answering "what can I spend this month," with context (income / spent / commitments, weekly view, over-budget and renewal alerts) around it. Success = a visitor who was fuzzy about their money leaves knowing what to do next.

## Positioning

The mechanism a neighbor couldn't copy-paste: privacy-first manual entry — the app never asks for bank credentials, card numbers, or an aggregator login, so there is structurally nothing to leak or monetize — combined with the one-number "available now" hero that folds income, spending, and committed subscriptions into a single decision. The category either buys your bank login or leaves you a spreadsheet. SpendWise is manual-entry and privacy-first by design (footer: "Privacy-first workspace · Personal use").

*Inferred from code evidence; no competitor claims made anywhere in the app.*

## Operating Context

Manual transaction entry with undoable deletes; custom categories (Lucide icon + color); budgets with weekly/monthly/yearly periods and live spend progress; subscriptions with billing-cycle normalization and upcoming-renewal alerts; reports with donut/bar charts and PDF export; settings for name, currency, and theme. Money is totalled in a single preferred currency per user, with foreign-currency entries converted at entry time. Data lives in Supabase Postgres under Row Level Security; email/password or Google auth with a PKCE flow.

## Capabilities and Constraints

- Stack (binding): Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Radix/shadcn-style primitives, TanStack Query, React Hook Form + Zod, Recharts, Supabase for auth AND all data via PostgREST. No ORM, no local migrations (schema managed in the Supabase dashboard), no test runner, no CI, no i18n library.
- The `user` table supports only name / email / preferred_currency / locale / theme, and there is no DDL access via the anon key — settings that need new columns cannot be backed and must not ship as decorative controls.
- Money math is P0: totals are plain sums of the resolved preferred-currency value — use `txValue()` and the shared budget helpers in `lib/utils.ts`. A foreign-currency entry snapshots its rate at write time (`lib/fx.ts` / `docs/currency-conversion.md`); there is no read-time conversion, so a historical total never changes retroactively.
- No bank-sync (Plaid or similar) exists or is planned. *Inferred.*
- Open decision: commercial product vs. open-source portfolio project (MIT, v2.0.0 suggest portfolio posture). Until the founder decides, future work must not add pricing, testimonials, customer counts, or roadmap claims.

## Brand Commitments

- Name: SpendWise. Tagline in use: "Know where your money goes. Plan what comes next."
- The "Kanso" voice — calm, considered, confident editorial restraint — is binding: Fraunces display (with SOFT/WONK axes) for headings and the wordmark, Inter for UI, IBM Plex Mono `.label-mono` as the one micro-label recipe. Established in code comments and locked by this repo's typography system.
- Green primary (oklch ≈ 0.47 0.12 158); `--spend` is the spending color — brand green is never used for spend.
- No emoji anywhere; Lucide icons through the `categoryIconMap` registry.
- Light and dark are both first-class; system-aware with a manual toggle.

## Evidence on Hand

- A complete working product: landing, auth funnel, dashboard, CRUD for transactions/budgets/subscriptions/categories, settings, reports with PDF export.
- Recorded design history: `.impeccable/critique/2026-09-20T02-49-25Z__app-globals-css.md` (font-decision critique and fixes).
- Absences future work must not fabricate: no real testimonials, no customer or usage numbers, no benchmarks, no pricing.

## Product Principles

1. **One number, one decision.** The dashboard answers "what can I spend now" before it decorates.
2. **Correct money beats clever features.** A total must be exactly the sum of what the user logged; a wrong number is worse than a missing chart. A foreign amount is therefore converted once, at entry, at a rate the user can see and edit — never estimated at render time.
3. **Manual entry, private by default.** The user's data stays theirs; no sync, no scraping, no hidden telemetry.
4. **Calm is a feature.** Density is earned by the task; the Kanso voice governs type, color, and motion restraint.
5. **Delete decorative UI.** A control that can't be backed with real data doesn't ship (precedent: the settings-page cleanup).

## Accessibility & Inclusion

WCAG AA contrast is the working bar (dark-mode tokens were explicitly tuned to stay AA-legible); keyboard-friendly Radix primitives; reduced-motion support; tabular numerals on all money figures. Every surface must be verified in both themes and at mobile widths. *Inferred from README claims and code comments; no formal audit on file.*
