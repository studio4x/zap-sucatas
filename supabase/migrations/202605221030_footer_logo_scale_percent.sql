alter table public.system_settings
  add column if not exists footer_logo_scale_percent integer not null default 200;

update public.system_settings
set footer_logo_scale_percent = 200
where footer_logo_scale_percent is null
   or footer_logo_scale_percent < 100
   or footer_logo_scale_percent > 260;
