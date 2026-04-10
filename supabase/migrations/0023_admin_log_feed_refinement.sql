drop view if exists public.admin_log_feed;

create view public.admin_log_feed
with (security_invoker = true) as
select
  'audit'::text as kind,
  audit.id::text as id,
  audit.action as label,
  audit.entity_type as secondary_label,
  audit.entity_id::text as detail,
  audit.actor_user_id::text as actor_user_id,
  audit.entity_type as entity_type,
  audit.entity_id::text as entity_id,
  audit.before_data as before_data,
  audit.after_data as after_data,
  null::jsonb as payload,
  audit.created_at as created_at,
  case
    when audit.action ilike '%delete%' then 'warning'
    when audit.action ilike '%reject%' or audit.action ilike '%block%' then 'warning'
    else 'info'
  end::text as severity,
  'admin_audit'::text as source_name,
  audit.action as action_key
from public.admin_audit_logs as audit
union all
select
  'integration'::text as kind,
  integration.id::text as id,
  integration.integration_name as label,
  integration.status as secondary_label,
  integration.message as detail,
  null::text as actor_user_id,
  null::text as entity_type,
  null::text as entity_id,
  null::jsonb as before_data,
  null::jsonb as after_data,
  integration.payload as payload,
  integration.created_at as created_at,
  case
    when integration.status in ('error', 'failed') then 'danger'
    when integration.status = 'blocked' then 'warning'
    when integration.status in ('success', 'ok') then 'success'
    else 'info'
  end::text as severity,
  integration.integration_name as source_name,
  coalesce(
    integration.payload ->> 'event',
    integration.payload ->> 'mode',
    integration.status
  ) as action_key
from public.integration_logs as integration;

grant select on public.admin_log_feed to authenticated;

create index if not exists idx_admin_audit_logs_action_entity_created
  on public.admin_audit_logs (action, entity_type, created_at desc);

create index if not exists idx_integration_logs_name_status_created
  on public.integration_logs (integration_name, status, created_at desc);
