create table if not exists public.admin_listing_localities (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  city text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state, city)
);

create index if not exists admin_listing_localities_state_city_idx
  on public.admin_listing_localities(state, city);

drop trigger if exists set_admin_listing_localities_updated_at on public.admin_listing_localities;
create trigger set_admin_listing_localities_updated_at
before update on public.admin_listing_localities
for each row
execute function public.set_updated_at();

alter table public.admin_listing_localities enable row level security;

drop policy if exists "admin_listing_localities_admin_select" on public.admin_listing_localities;
create policy "admin_listing_localities_admin_select"
on public.admin_listing_localities
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_listing_localities_admin_insert" on public.admin_listing_localities;
create policy "admin_listing_localities_admin_insert"
on public.admin_listing_localities
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_listing_localities_admin_update" on public.admin_listing_localities;
create policy "admin_listing_localities_admin_update"
on public.admin_listing_localities
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
