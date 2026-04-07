create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  support_email text,
  support_phone text,
  seo_title_default text,
  seo_description_default text,
  allow_guest_questions boolean not null default false,
  maintenance_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  integration_name text not null,
  status text not null,
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists set_system_settings_updated_at on public.system_settings;
create trigger set_system_settings_updated_at
before update on public.system_settings
for each row
execute function public.set_updated_at();
