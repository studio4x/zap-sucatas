create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  action_url text,
  category text not null default 'system',
  priority text not null default 'normal',
  is_actionable boolean not null default true,
  read_at timestamptz,
  read_by_channels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint notifications_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint notifications_title_length_check check (char_length(title) <= 200)
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  whatsapp_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text not null default 'America/Sao_Paulo',
  email_digest text not null default 'immediate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_email_digest_check check (email_digest in ('immediate', 'daily', 'weekly', 'never'))
);

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  category text not null default 'system',
  priority text not null default 'normal',
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_retry_at timestamptz not null default now(),
  final_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_queue_channel_check check (channel in ('push', 'email', 'whatsapp', 'in-app')),
  constraint notification_queue_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint notification_queue_status_check check (status in ('pending', 'retry', 'sent', 'delivered', 'failed', 'bounced'))
);

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.notification_queue(id) on delete cascade,
  channel text not null,
  attempt_number integer not null,
  status text not null,
  error_message text,
  response_status_code integer,
  retry_attempt integer not null default 0,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_delivery_logs_channel_check check (channel in ('push', 'email', 'whatsapp', 'in-app')),
  constraint notification_delivery_logs_status_check check (status in ('success', 'failure'))
);

create table if not exists public.admin_notification_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_ids jsonb,
  filters_snapshot jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, read_at) where read_at is null;
create index if not exists idx_notification_queue_status_retry on public.notification_queue (status, next_retry_at asc, created_at asc);
create index if not exists idx_notification_queue_user_created on public.notification_queue (user_id, created_at desc);
create index if not exists idx_notification_queue_channel_status on public.notification_queue (channel, status, created_at desc);
create index if not exists idx_notification_delivery_logs_queue_created on public.notification_delivery_logs (queue_id, created_at desc);
create index if not exists idx_admin_notification_actions_created on public.admin_notification_actions (created_at desc);

insert into public.notification_preferences (user_id)
select p.id
from public.profiles p
left join public.notification_preferences np on np.user_id = p.id
where np.user_id is null;

create or replace function public.ensure_notification_preferences_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_ensure_notification_preferences_for_profile on public.profiles;
create trigger trg_ensure_notification_preferences_for_profile
after insert on public.profiles
for each row
execute function public.ensure_notification_preferences_for_profile();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists set_notification_queue_updated_at on public.notification_queue;
create trigger set_notification_queue_updated_at
before update on public.notification_queue
for each row
execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_delivery_logs enable row level security;
alter table public.admin_notification_actions enable row level security;

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications
for select
to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notifications_insert_own_or_admin" on public.notifications;
create policy "notifications_insert_own_or_admin"
on public.notifications
for insert
to authenticated
with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications
for update
to authenticated
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notifications_delete_own_or_admin" on public.notifications;
create policy "notifications_delete_own_or_admin"
on public.notifications
for delete
to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notification_preferences_select_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_select_own_or_admin"
on public.notification_preferences
for select
to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notification_preferences_insert_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_insert_own_or_admin"
on public.notification_preferences
for insert
to authenticated
with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notification_preferences_update_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_update_own_or_admin"
on public.notification_preferences
for update
to authenticated
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "notification_queue_admin_select" on public.notification_queue;
create policy "notification_queue_admin_select"
on public.notification_queue
for select
to authenticated
using (public.is_admin());

drop policy if exists "notification_queue_admin_insert" on public.notification_queue;
create policy "notification_queue_admin_insert"
on public.notification_queue
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "notification_queue_admin_update" on public.notification_queue;
create policy "notification_queue_admin_update"
on public.notification_queue
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notification_delivery_logs_admin_select" on public.notification_delivery_logs;
create policy "notification_delivery_logs_admin_select"
on public.notification_delivery_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "notification_delivery_logs_admin_insert" on public.notification_delivery_logs;
create policy "notification_delivery_logs_admin_insert"
on public.notification_delivery_logs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_notification_actions_admin_select" on public.admin_notification_actions;
create policy "admin_notification_actions_admin_select"
on public.admin_notification_actions
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_notification_actions_admin_insert" on public.admin_notification_actions;
create policy "admin_notification_actions_admin_insert"
on public.admin_notification_actions
for insert
to authenticated
with check (public.is_admin());
