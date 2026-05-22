alter table public.system_settings
  add column if not exists header_logo_scale_percent integer not null default 100;

update public.system_settings
set header_logo_scale_percent = 100
where header_logo_scale_percent is null
   or header_logo_scale_percent < 60
   or header_logo_scale_percent > 220;
