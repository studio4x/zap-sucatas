alter table public.analytics_events enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.analytics_events to anon, authenticated;
grant select on table public.analytics_events to authenticated;

drop policy if exists "analytics_events_insert_client" on public.analytics_events;
create policy "analytics_events_insert_client"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "analytics_events_select_admin" on public.analytics_events;
create policy "analytics_events_select_admin"
on public.analytics_events
for select
to authenticated
using (public.is_admin());
