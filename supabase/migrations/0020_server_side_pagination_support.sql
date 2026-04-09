create index if not exists idx_listings_admin_status_state_updated
  on public.listings (status, state, updated_at desc);

create index if not exists idx_listings_user_updated
  on public.listings (user_id, updated_at desc);

create index if not exists idx_profiles_role_status_created
  on public.profiles (role, status, created_at desc);

create index if not exists idx_profiles_full_name_lower
  on public.profiles (lower(full_name));

create index if not exists idx_profiles_email_lower
  on public.profiles (lower(email));

create index if not exists idx_listing_questions_status_created
  on public.listing_questions (status, created_at desc);

create index if not exists idx_listing_questions_guest_name_lower
  on public.listing_questions (lower(coalesce(guest_name, '')));

create index if not exists idx_blog_posts_status_category_updated
  on public.blog_posts (status, category_id, updated_at desc);

create or replace view public.admin_log_feed
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
  audit.created_at as created_at
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
  integration.created_at as created_at
from public.integration_logs as integration;

grant select on public.admin_log_feed to authenticated;
