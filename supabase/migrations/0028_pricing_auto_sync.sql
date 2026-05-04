create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.pricing_sync_secrets (
  job_name text primary key,
  cron_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_sync_status (
  job_name text primary key,
  last_message text,
  last_run_at timestamptz,
  last_snapshot_count integer not null default 0,
  last_status text not null default 'never',
  last_success_at timestamptz,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_pricing_sync_secrets_updated_at on public.pricing_sync_secrets;
create trigger set_pricing_sync_secrets_updated_at
before update on public.pricing_sync_secrets
for each row
execute function public.set_updated_at();

drop trigger if exists set_pricing_sync_status_updated_at on public.pricing_sync_status;
create trigger set_pricing_sync_status_updated_at
before update on public.pricing_sync_status
for each row
execute function public.set_updated_at();

alter table public.pricing_sync_status enable row level security;
alter table public.pricing_sync_secrets enable row level security;

drop policy if exists "pricing_sync_status_admin_select" on public.pricing_sync_status;
create policy "pricing_sync_status_admin_select"
on public.pricing_sync_status
for select
to authenticated
using (public.is_admin());

drop policy if exists "pricing_sync_status_admin_manage" on public.pricing_sync_status;
create policy "pricing_sync_status_admin_manage"
on public.pricing_sync_status
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.pricing_sync_secrets (job_name, cron_key)
values ('pricing_auto_sync', encode(gen_random_bytes(32), 'hex'))
on conflict (job_name)
do update set
  cron_key = excluded.cron_key,
  updated_at = now();

insert into public.pricing_sync_status (job_name, last_status, last_snapshot_count)
values ('pricing_auto_sync', 'never', 0)
on conflict (job_name)
do update set
  updated_at = now();

create or replace function public.queue_pricing_auto_sync()
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
  job_secret text;
  request_id bigint;
begin
  select cron_key
    into job_secret
    from public.pricing_sync_secrets
   where job_name = 'pricing_auto_sync';

  if job_secret is null then
    raise exception 'pricing sync secret not configured';
  end if;

  update public.pricing_sync_status
     set last_status = 'queued',
         last_message = 'Sincronizacao automatica agendada pelo cron.',
         last_triggered_at = now()
   where job_name = 'pricing_auto_sync';

  request_id := net.http_post(
    url := 'https://jrxccuxqucwrlccfhdrg.supabase.co/functions/v1/sync-lme-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', job_secret
    ),
    body := jsonb_build_object(
      'mode', 'latest',
      'trigger', 'cron',
      'job_name', 'pricing_auto_sync'
    ),
    timeout_milliseconds := 10000
  );

  return request_id;
end;
$$;

do $$
begin
  if exists(select 1 from cron.job where jobname = 'pricing-auto-sync') then
    perform cron.unschedule('pricing-auto-sync');
  end if;

  perform cron.schedule(
    'pricing-auto-sync',
    '0 * * * *',
    $cron$ select public.queue_pricing_auto_sync(); $cron$
  );
end;
$$;
