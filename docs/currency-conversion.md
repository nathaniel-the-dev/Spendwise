# Currency conversion

SpendWise totals money in **one preferred currency per user** (`user.preferred_currency`), but an
amount can be **entered** in a different currency — the motivating case being a subscription billed
in USD while the workspace tracks JMD.

Conversion is **snapshot-at-write**: the rate is resolved once, when the row is saved, and frozen
onto it. Nothing converts at render time, so a total is always a plain sum and history never drifts
when the market moves.

## How it works


| Piece                                                               | Where                                 |
| --------------------------------------------------------------------- | --------------------------------------- |
| Pure helpers (`convertAmount`, `buildFxColumns`, `resolveFxUpdate`) | `lib/fx.ts`                           |
| Rate endpoint (free, keyless, includes JMD)                         | `app/api/exchange-rates/route.ts`     |
| Client rate hook (12h cache, persisted)                             | `hooks/use-exchange-rate.ts`          |
| Rate input UI (auto-filled, editable)                               | `components/shared/fx-rate-field.tsx` |
| The single aggregation accessor                                     | `txValue()` in `lib/utils.ts`         |

Each foreign-currency row stores four extra columns:


| Column                | Meaning                                          |
| ----------------------- | -------------------------------------------------- |
| `amount_in_preferred` | The resolved amount, rounded to 2dp              |
| `fx_rate`             | The rate actually used (`currency` → preferred) |
| `fx_rate_at`          | When that rate was true                          |
| `fx_source`           | `auto` (fetched) or `manual` (typed by the user) |

`amount` and `currency` keep the **original** charge, so a row records both sides:
`US$9.99 @ 156.42 on 2026-09-24`.

Because every aggregate in the app funnels through `txValue()`:

```ts
Math.abs(tx.amountInPreferred ?? tx.amount)
```

...the dashboard, budgets, reports, calendar, charts, and the subscriptions "commitments" figure all
become conversion-aware **without a single call-site change**. Rows in the preferred currency carry
no snapshot and fall back to `amount` exactly as before.

## Required database columns

There is no local migration tooling in this project (see `AGENTS.md`) — run this once in the
Supabase dashboard SQL editor:

```sql
-- Frozen preferred-currency snapshot. Safe to re-run.
alter table "transaction"
  add column if not exists amount_in_preferred numeric(14,2),
  add column if not exists fx_rate            numeric(18,8),
  add column if not exists fx_rate_at         timestamptz,
  add column if not exists fx_source          text;

alter table "subscription"
  add column if not exists amount_in_preferred numeric(14,2),
  add column if not exists fx_rate            numeric(18,8),
  add column if not exists fx_rate_at         timestamptz,
  add column if not exists fx_source          text;

alter table "subscription_payment"
  add column if not exists amount_in_preferred numeric(14,2),
  add column if not exists fx_rate            numeric(18,8),
  add column if not exists fx_rate_at         timestamptz,
  add column if not exists fx_source          text;
```

Verify:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and column_name in ('amount_in_preferred', 'fx_rate', 'fx_rate_at', 'fx_source')
order by table_name, column_name;
```

Should return 12 rows (4 columns × 3 tables).

**Until this runs**, everything still works for single-currency users: those rows never send fx
columns at all. Only entering a *foreign* amount will fail, and it fails with an explicit
"run the migration" message rather than a bare 500 (see `isMissingFxColumnError` in `lib/fx.ts`).

No backfill is needed — pre-existing rows are all in the preferred currency, which is exactly what
`NULL` means here.

## Adding a new rate provider

`app/api/exchange-rates/route.ts` calls `open.er-api.com`. It was chosen over the ECB-based
Frankfurter because **ECB reference rates do not include JMD**. If you swap providers, keep the
response shape (`{ rate, from, to, fetchedAt }`) and keep `JMD` working.
