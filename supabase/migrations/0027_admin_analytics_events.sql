create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  pathname text not null,
  target text,
  referrer text,
  user_agent text,
  duration_ms integer,
  timezone text,
  language text,
  created_at timestamptz not null default now(),
  constraint analytics_events_type_check check (event_type in ('page_view', 'click', 'page_leave', 'heartbeat'))
);

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_event_type on public.analytics_events (event_type, created_at desc);
create index if not exists idx_analytics_events_pathname on public.analytics_events (pathname, created_at desc);
create index if not exists idx_analytics_events_profile on public.analytics_events (profile_id, created_at desc);
create index if not exists idx_analytics_events_session on public.analytics_events (session_id, created_at desc);

alter table public.analytics_events enable row level security;

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
