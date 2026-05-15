alter table public.system_settings
  add column if not exists blog_enabled boolean not null default true;

update public.system_settings
set blog_enabled = true
where blog_enabled is distinct from true;
