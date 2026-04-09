alter table public.listing_categories enable row level security;
alter table public.listing_materials enable row level security;

create index if not exists listing_categories_active_sort_idx
  on public.listing_categories (is_active, sort_order asc, name asc);

create index if not exists listing_materials_active_name_idx
  on public.listing_materials (is_active, name asc);

drop policy if exists "listing_categories_select_active_or_admin" on public.listing_categories;
create policy "listing_categories_select_active_or_admin"
on public.listing_categories
for select
using (is_active or public.is_admin());

drop policy if exists "listing_categories_admin_manage" on public.listing_categories;
create policy "listing_categories_admin_manage"
on public.listing_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "listing_materials_select_active_or_admin" on public.listing_materials;
create policy "listing_materials_select_active_or_admin"
on public.listing_materials
for select
using (is_active or public.is_admin());

drop policy if exists "listing_materials_admin_manage" on public.listing_materials;
create policy "listing_materials_admin_manage"
on public.listing_materials
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
