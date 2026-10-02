# Pay cycle

SpendWise's overview answers one question — **"how much can I spend right now?"** — by subtracting
this period's expenses and recurring commitments from this period's income.

By default "this period" is the **calendar month** (the 1st → the last day). That is wrong for anyone
paid *after* the month starts: on the 28th you get paid, so from the 1st to the 27th the dashboard
counts expenses with no income at all and the hero number reads a large negative.

A pay cycle fixes the **window**, not the arithmetic. Set the day your financial month begins and the
overview runs from that day to the day before the same day next month (paid on the 28th → the 28th
through the 27th). Income then lands on the first day of the window, which is the actual cash event
the question is about.

## How it works


| Piece                                             | Where                                 |
| -------------------------------------------------- | --------------------------------------- |
| Pure window math (`payCycleWindow`)                | `lib/utils.ts`                         |
| Persisted setting (`user.payday`)                  | `app/api/settings/route.ts`            |
| Client read (`Settings.payday`)                    | `hooks/use-settings.ts`                |
| Opt-in day-of-month control                        | `app/dashboard/settings/page.tsx`      |
| Window + range label on the headline card          | `app/dashboard/page.tsx`               |

`payday` is a nullable integer 1–31:

- `null` — the calendar month. **The default**, and byte-for-byte the behaviour that existed before
  this setting, so nobody's dashboard changes until they opt in.
- `1` — also the calendar month (there is no cycle that starts on the 1st).
- `2`–`31` — the cycle runs from that day to the day before the same day next month.

`payCycleWindow(now, payday)` returns `{ start, end }` at local midnight, and the dashboard sums
income and expenses over it exactly as it did for the calendar month. Because every amount still goes
through `txValue()`, foreign-currency snapshots are unaffected — the cycle only changes *which
transactions* are counted, never how an amount is valued.

### Month-end clamping

A payday of 31 does not exist in February. The helper clamps to the real length of each month, so a
31st payday yields Feb 28/29 and then Mar 30 — never the silent `new Date(y, m, 31)` overflow into
March. The same applies to the previous-period window used for the "compared to last month" line.

## Required database column

There is no local migration tooling in this project (see `AGENTS.md`) — run this once in the
Supabase dashboard SQL editor:

```sql
-- Day of the month the financial month begins. NULL = calendar month.
-- Safe to re-run.
alter table "user" add column if not exists payday smallint;
```

Verify:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user'
  and column_name = 'payday';
```

Until it is applied, the setting cannot be saved: `PATCH /api/settings` will return a 500 from
PostgREST for any payload containing `payday`, with a message saying so. Everything else keeps
working — `GET /api/settings` retries without the `payday` column when PostgREST rejects it, so the
dashboard renders on the calendar month and the rest of settings (name, currency, locale, theme)
save and load exactly as before. The deploy is therefore safe to push before the SQL; the setting
simply stays inert until the column exists.

## Interaction with budgets

Monthly budgets are still **calendar-anchored** — `periodWindowStart("monthly")` is the 1st, and
`computeBudgetSpend` stays the single definition shared by the dashboard and the budgets page (see
`AGENTS.md`). So with a pay cycle set, the headline "Available this month" covers 28th → 27th while a
monthly budget covers the 1st → 31st.

That disagreement is known and deliberate for now: budget spend is defined in exactly one place and
changing it would move every historical budget total. Aligning monthly budgets to the pay cycle means
threading `payday` through `periodWindowStart` / `computeBudgetSpend` as a follow-up.