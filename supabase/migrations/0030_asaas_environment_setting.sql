alter table public.system_settings
  add column if not exists asaas_environment text not null default 'sandbox';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'system_settings_asaas_environment_check'
  ) then
    alter table public.system_settings
      add constraint system_settings_asaas_environment_check
      check (asaas_environment in ('sandbox', 'production'));
  end if;
end;
$$;
