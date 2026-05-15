alter table public.system_settings
  add column if not exists featured_payments_enabled boolean not null default true;
