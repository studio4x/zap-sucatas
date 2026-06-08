create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.system_settings
  add column if not exists notification_auto_delete_enabled boolean not null default false,
  add column if not exists notification_retention_days integer not null default 30;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_settings_notification_retention_days_check'
  ) then
    alter table public.system_settings
      add constraint system_settings_notification_retention_days_check
      check (notification_retention_days between 1 and 3650);
  end if;
end;
$$;

create table if not exists public.notification_retention_secrets (
  job_name text primary key,
  cron_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_notification_retention_secrets_updated_at on public.notification_retention_secrets;
create trigger set_notification_retention_secrets_updated_at
before update on public.notification_retention_secrets
for each row
execute function public.set_updated_at();

alter table public.notification_retention_secrets enable row level security;

drop policy if exists "notification_retention_secrets_admin_select" on public.notification_retention_secrets;
create policy "notification_retention_secrets_admin_select"
on public.notification_retention_secrets
for select
to authenticated
using (public.is_admin());

drop policy if exists "notification_retention_secrets_admin_manage" on public.notification_retention_secrets;
create policy "notification_retention_secrets_admin_manage"
on public.notification_retention_secrets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.notification_retention_secrets (job_name, cron_key)
values ('notification_retention_cleanup', encode(gen_random_bytes(32), 'hex'))
on conflict (job_name)
do update set
  cron_key = excluded.cron_key,
  updated_at = now();

create or replace function public.queue_notification_retention_cleanup()
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
  job_secret text;
  request_id bigint;
  auto_delete_enabled boolean;
begin
  select notification_auto_delete_enabled
    into auto_delete_enabled
    from public.system_settings
   limit 1;

  if not coalesce(auto_delete_enabled, false) then
    return 0;
  end if;

  select cron_key
    into job_secret
    from public.notification_retention_secrets
   where job_name = 'notification_retention_cleanup';

  if job_secret is null then
    raise exception 'notification retention secret not configured';
  end if;

  request_id := net.http_post(
    url := 'https://jrxccuxqucwrlccfhdrg.supabase.co/functions/v1/purge-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', job_secret
    ),
    body := jsonb_build_object(
      'mode', 'purge_old',
      'job_name', 'notification_retention_cleanup',
      'trigger', 'cron'
    ),
    timeout_milliseconds := 10000
  );

  return request_id;
end;
$$;

do $$
begin
  if exists(select 1 from cron.job where jobname = 'notification-retention-cleanup') then
    perform cron.unschedule('notification-retention-cleanup');
  end if;

  perform cron.schedule(
    'notification-retention-cleanup',
    '30 3 * * *',
    $cron$ select public.queue_notification_retention_cleanup(); $cron$
  );
end;
$$;
