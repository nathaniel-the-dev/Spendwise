-- ── drop an incompatible leftover account table ───────────────────────────────
do $$
declare
  has_user_id boolean;
  row_count   bigint;
begin
  if to_regclass('public.account') is null then
    return;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account' and column_name = 'user_id'
  ) into has_user_id;

  if has_user_id then
    return; -- already the right shape (or close enough to migrate, not replace)
  end if;

  execute 'select count(*) from public.account' into row_count;
  if row_count > 0 then
    raise exception 'public.account exists with % rows but no user_id column. Refusing to drop it — inspect it manually before running this migration.', row_count;
  end if;

  drop table public.account;
  raise notice 'Dropped an empty, incompatible public.account table.';
end $$;

# ==============================================================================

-- ── account ────────────────────────────────────────────────────────────────────
create table if not exists public.account (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  type                 text not null default 'checking'
                         check (type in ('checking','savings','cash','credit','investment','loan')),
  -- Stored for display and for a future native-currency phase. In v1 the app keeps this
  -- equal to user.preferred_currency; there is no DB constraint enforcing that.
  currency             text not null default 'USD',
  opening_balance      numeric(14,2) not null default 0,
  icon                 text not null default 'wallet',
  color                text not null default 'gray',
  include_in_net_worth boolean not null default true,
  is_archived          boolean not null default false,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists account_user_id_idx on public.account(user_id);

-- ── transaction.account_id ────────────────────────────────────────────────────
-- Nullable and ON DELETE SET NULL on purpose: pre-existing rows have no account and keep
-- working, and deleting an account must never destroy financial history.
alter table public."transaction"
  add column if not exists account_id uuid references public.account(id) on delete set null;
create index if not exists transaction_account_id_idx on public."transaction"(account_id);

-- ── transfer ──────────────────────────────────────────────────────────────────
create table if not exists public.transfer (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  from_account_id    uuid not null references public.account(id) on delete restrict,
  to_account_id      uuid not null references public.account(id) on delete restrict,
  amount             numeric(14,2) not null check (amount > 0),
  currency           text not null,
  date               date not null default current_date,
  description        text,
  notes              text,
  -- Same frozen snapshot as transaction, for a future cross-currency phase.
  amount_in_preferred numeric(14,2),
  fx_rate            numeric(18,8),
  fx_rate_at         timestamptz,
  fx_source          text check (fx_source in ('auto','manual')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint transfer_distinct_accounts check (from_account_id <> to_account_id)
);
-- `create table if not exists` skips the constraint when `transfer` already exists, so it is
-- added separately. Postgres has no `add constraint if not exists`, hence the guard.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transfer_distinct_accounts'
      and conrelid = 'public.transfer'::regclass
  ) then
    alter table public.transfer
      add constraint transfer_distinct_accounts check (from_account_id <> to_account_id);
  end if;
end $$;
create index if not exists transfer_from_idx on public.transfer(from_account_id);
create index if not exists transfer_to_idx   on public.transfer(to_account_id);

# ==============================================================================

alter table public.account  enable row level security;
alter table public.transfer enable row level security;

drop policy if exists "account own rows" on public.account;
create policy "account own rows" on public.account
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transfer own rows" on public.transfer;
create policy "transfer own rows" on public.transfer
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grant to the same roles as the existing tables (anon, authenticated).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.account  to authenticated;
grant select, insert, update, delete on public.transfer to authenticated;

# ==============================================================================

-- `create or replace view` refuses to change a view's column list. That is exactly the failure the
-- accounts feature hit in production, so drop first and create clean below.
drop view if exists public.account_balance;

create view public.account_balance
with (security_invoker = true) as
with tx_delta as (
  select
    t.account_id,
    sum(
      case when t.type = 'income'
        then  coalesce(t.amount_in_preferred, abs(t.amount))
        else -coalesce(t.amount_in_preferred, abs(t.amount))
      end
    ) as delta
  from public."transaction" t
  where t.account_id is not null
  group by t.account_id
),
transfer_delta as (
  select account_id, sum(delta) as delta
  from (
    select from_account_id as account_id,
           -coalesce(amount_in_preferred, abs(amount)) as delta
    from public.transfer
    union all
    select to_account_id as account_id,
           coalesce(amount_in_preferred, abs(amount)) as delta
    from public.transfer
  ) s
  group by account_id
)
select
  a.id                as account_id,
  a.user_id,
  a.name,
  a.type,
  a.currency,
  a.icon,
  a.color,
  a.opening_balance,
  a.is_archived,
  a.include_in_net_worth,
  coalesce(a.opening_balance, 0) + coalesce(x.delta, 0) + coalesce(t.delta, 0) as balance
from public.account a
left join tx_delta      x on x.account_id = a.id
left join transfer_delta t on t.account_id = a.id;

-- The view runs with the caller's permissions (security_invoker), so the grant below is what lets
-- an authenticated user read it at all.
grant select on public.account_balance to authenticated;
