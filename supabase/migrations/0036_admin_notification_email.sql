alter table public.system_settings
  add column if not exists admin_notification_email text;
