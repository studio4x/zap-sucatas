alter table public.blog_categories enable row level security;

drop policy if exists "blog_categories_public_select" on public.blog_categories;
create policy "blog_categories_public_select"
on public.blog_categories
for select
using (true);

drop policy if exists "blog_categories_admin_manage" on public.blog_categories;
create policy "blog_categories_admin_manage"
on public.blog_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
