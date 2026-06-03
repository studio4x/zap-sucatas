drop policy if exists "listings_insert_own" on public.listings;

create policy "listings_insert_own"
on public.listings
for insert
to authenticated
with check (
  user_id = public.current_profile_id()
  or public.is_admin()
);
