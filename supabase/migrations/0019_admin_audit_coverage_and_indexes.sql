create or replace function public.capture_admin_table_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile_id uuid := public.current_profile_id();
  target_id uuid := coalesce(new.id, old.id);
  entity_type text := tg_argv[0];
begin
  if actor_profile_id is null then
    return coalesce(new, old);
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    actor_profile_id,
    lower(tg_op) || '_' || entity_type,
    entity_type,
    target_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.capture_manual_snapshot_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile_id uuid := public.current_profile_id();
  target_id uuid := coalesce(new.id, old.id);
  provider_name text := coalesce(new.provider_name, old.provider_name, '');
begin
  if actor_profile_id is null then
    return coalesce(new, old);
  end if;

  if provider_name not like 'manual%' then
    return coalesce(new, old);
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    actor_profile_id,
    lower(tg_op) || '_lme_price_snapshot',
    'lme_price_snapshot',
    target_id,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists capture_blog_posts_change on public.blog_posts;
create trigger capture_blog_posts_change
after insert or update or delete on public.blog_posts
for each row
execute function public.capture_admin_table_change('blog_post');

drop trigger if exists capture_blog_categories_change on public.blog_categories;
create trigger capture_blog_categories_change
after insert or update or delete on public.blog_categories
for each row
execute function public.capture_admin_table_change('blog_category');

drop trigger if exists capture_scrap_price_entries_change on public.scrap_price_entries;
create trigger capture_scrap_price_entries_change
after insert or update or delete on public.scrap_price_entries
for each row
execute function public.capture_admin_table_change('scrap_price_entry');

drop trigger if exists capture_system_settings_change on public.system_settings;
create trigger capture_system_settings_change
after update on public.system_settings
for each row
execute function public.capture_admin_table_change('system_settings');

drop trigger if exists capture_manual_snapshot_change on public.lme_price_snapshots;
create trigger capture_manual_snapshot_change
after insert or update or delete on public.lme_price_snapshots
for each row
execute function public.capture_manual_snapshot_change();

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_action_created_at_idx
  on public.admin_audit_logs(action, created_at desc);

create index if not exists admin_audit_logs_entity_type_created_at_idx
  on public.admin_audit_logs(entity_type, created_at desc);

create index if not exists integration_logs_created_at_idx
  on public.integration_logs(created_at desc);

create index if not exists integration_logs_name_status_created_at_idx
  on public.integration_logs(integration_name, status, created_at desc);
