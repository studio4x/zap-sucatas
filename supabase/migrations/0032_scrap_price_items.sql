create table if not exists public.scrap_price_items (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  price_label text not null,
  quantity_label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scrap_price_items_sort_order_idx
  on public.scrap_price_items(sort_order asc, created_at desc);

drop trigger if exists set_scrap_price_items_updated_at on public.scrap_price_items;
create trigger set_scrap_price_items_updated_at
before update on public.scrap_price_items
for each row
execute function public.set_updated_at();

alter table public.scrap_price_items enable row level security;

drop policy if exists "scrap_price_items_public_select_active" on public.scrap_price_items;
create policy "scrap_price_items_public_select_active"
on public.scrap_price_items
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "scrap_price_items_admin_insert" on public.scrap_price_items;
create policy "scrap_price_items_admin_insert"
on public.scrap_price_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "scrap_price_items_admin_update" on public.scrap_price_items;
create policy "scrap_price_items_admin_update"
on public.scrap_price_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "scrap_price_items_admin_delete" on public.scrap_price_items;
create policy "scrap_price_items_admin_delete"
on public.scrap_price_items
for delete
to authenticated
using (public.is_admin());
