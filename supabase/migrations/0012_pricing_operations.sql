alter table public.scrap_price_entries enable row level security;
alter table public.lme_price_snapshots enable row level security;

alter table public.lme_price_snapshots
  add column if not exists quoted_date date generated always as ((quoted_at at time zone 'utc')::date) stored,
  add column if not exists provider_name text;

update public.lme_price_snapshots
set provider_name = coalesce(nullif(provider_name, ''), 'manual')
where provider_name is null
   or provider_name = '';

alter table public.lme_price_snapshots
  alter column provider_name set default 'manual',
  alter column provider_name set not null;

create unique index if not exists lme_price_snapshots_unique_provider_day_idx
  on public.lme_price_snapshots(metal_code, quoted_date, currency_code, provider_name);

create index if not exists lme_price_snapshots_quoted_date_idx
  on public.lme_price_snapshots(quoted_date desc);

create index if not exists scrap_price_entries_effective_date_idx
  on public.scrap_price_entries(effective_date desc);

create or replace view public.lme_snapshot_months as
select
  to_char(date_trunc('month', quoted_date), 'YYYY-MM') as month_key,
  date_trunc('month', quoted_date)::date as month_start,
  max(quoted_date) as last_quoted_date,
  count(distinct quoted_date) as trading_days
from public.lme_price_snapshots
group by 1, 2
order by 2 desc;

grant select on public.lme_snapshot_months to anon, authenticated;

drop policy if exists "scrap_price_entries_public_select" on public.scrap_price_entries;
create policy "scrap_price_entries_public_select"
on public.scrap_price_entries
for select
using (is_active or public.is_admin());

drop policy if exists "scrap_price_entries_admin_manage" on public.scrap_price_entries;
create policy "scrap_price_entries_admin_manage"
on public.scrap_price_entries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lme_price_snapshots_public_select" on public.lme_price_snapshots;
create policy "lme_price_snapshots_public_select"
on public.lme_price_snapshots
for select
using (true);

drop policy if exists "lme_price_snapshots_admin_manage" on public.lme_price_snapshots;
create policy "lme_price_snapshots_admin_manage"
on public.lme_price_snapshots
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
