alter table public.system_settings
add column if not exists support_sla_config jsonb,
add column if not exists support_business_hours_config jsonb,
add column if not exists crisis_protocol_config jsonb;

update public.system_settings
set
  support_sla_config = coalesce(
    support_sla_config,
    jsonb_build_object(
      'categories', jsonb_build_array(
        jsonb_build_object('key', 'payment', 'label', 'Pagamentos', 'first_response_hours', 2, 'position', 1, 'description', 'Primeira resposta em ate 2 horas uteis.'),
        jsonb_build_object('key', 'technical', 'label', 'Problema tecnico', 'first_response_hours', 24, 'position', 2, 'description', 'Primeira resposta em ate 24 horas uteis.'),
        jsonb_build_object('key', 'account', 'label', 'Conta e acesso', 'first_response_hours', 24, 'position', 3, 'description', 'Primeira resposta em ate 24 horas uteis.'),
        jsonb_build_object('key', 'general', 'label', 'Duvida geral', 'first_response_hours', 24, 'position', 4, 'description', 'Primeira resposta em ate 24 horas uteis.')
      ),
      'public_note', 'Os prazos acima se referem ao tempo da primeira resposta humana da equipe. Nao representam prazo de resolucao final.'
    )
  ),
  support_business_hours_config = coalesce(
    support_business_hours_config,
    jsonb_build_object(
      'timezone', 'America/Sao_Paulo',
      'days_of_week', jsonb_build_array(1, 2, 3, 4, 5),
      'start_hour', 8,
      'end_hour', 18
    )
  ),
  crisis_protocol_config = coalesce(
    crisis_protocol_config,
    jsonb_build_object(
      'headline', 'Se houver risco, fraude ou situacao critica, abra o chamado e registre o contexto com o maximo de detalhe.',
      'note', 'Casos criticos devem ser registrados com horario, responsaveis e evidencias disponiveis.'
    )
  )
where true;

create or replace function public.get_support_sla_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select support_sla_config
      from public.system_settings
      order by created_at asc
      limit 1
    ),
    jsonb_build_object(
      'categories', jsonb_build_array(
        jsonb_build_object('key', 'payment', 'label', 'Pagamentos', 'first_response_hours', 2, 'position', 1, 'description', 'Primeira resposta em ate 2 horas uteis.'),
        jsonb_build_object('key', 'technical', 'label', 'Problema tecnico', 'first_response_hours', 24, 'position', 2, 'description', 'Primeira resposta em ate 24 horas uteis.'),
        jsonb_build_object('key', 'account', 'label', 'Conta e acesso', 'first_response_hours', 24, 'position', 3, 'description', 'Primeira resposta em ate 24 horas uteis.'),
        jsonb_build_object('key', 'general', 'label', 'Duvida geral', 'first_response_hours', 24, 'position', 4, 'description', 'Primeira resposta em ate 24 horas uteis.')
      ),
      'public_note', 'Os prazos acima se referem ao tempo da primeira resposta humana da equipe. Nao representam prazo de resolucao final.'
    )
  );
$$;

create or replace function public.get_support_business_hours_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select support_business_hours_config
      from public.system_settings
      order by created_at asc
      limit 1
    ),
    jsonb_build_object(
      'timezone', 'America/Sao_Paulo',
      'days_of_week', jsonb_build_array(1, 2, 3, 4, 5),
      'start_hour', 8,
      'end_hour', 18
    )
  );
$$;

create or replace function public.get_support_sla_target_hours(category_key text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (entry ->> 'first_response_hours')::integer
      from jsonb_array_elements(public.get_support_sla_config() -> 'categories') entry
      where entry ->> 'key' = category_key
      order by coalesce((entry ->> 'position')::integer, 999)
      limit 1
    ),
    24
  );
$$;

create or replace function public.is_support_business_minute(input_ts timestamptz)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cfg jsonb;
  timezone_name text;
  local_ts timestamp;
  local_dow integer;
  start_hour integer;
  end_hour integer;
  allowed_days integer[];
begin
  cfg := public.get_support_business_hours_config();
  timezone_name := coalesce(cfg ->> 'timezone', 'America/Sao_Paulo');
  start_hour := coalesce((cfg ->> 'start_hour')::integer, 8);
  end_hour := coalesce((cfg ->> 'end_hour')::integer, 18);
  allowed_days := array(
    select jsonb_array_elements_text(coalesce(cfg -> 'days_of_week', '[1,2,3,4,5]'::jsonb))::integer
  );

  local_ts := input_ts at time zone timezone_name;
  local_dow := extract(isodow from local_ts);

  if not (local_dow = any(allowed_days)) then
    return false;
  end if;

  return local_ts::time >= make_time(start_hour, 0, 0)
    and local_ts::time < make_time(end_hour, 0, 0);
end;
$$;

create or replace function public.align_support_business_start(input_ts timestamptz)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cursor_ts timestamptz := date_trunc('minute', input_ts);
begin
  if public.is_support_business_minute(cursor_ts) then
    return cursor_ts;
  end if;

  for i in 1..20000 loop
    cursor_ts := cursor_ts + interval '1 minute';
    if public.is_support_business_minute(cursor_ts) then
      return cursor_ts;
    end if;
  end loop;

  return cursor_ts;
end;
$$;

create or replace function public.add_support_business_minutes(start_ts timestamptz, minutes_to_add integer)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cursor_ts timestamptz := public.align_support_business_start(start_ts);
  added_minutes integer := 0;
begin
  if minutes_to_add <= 0 then
    return cursor_ts;
  end if;

  while added_minutes < minutes_to_add loop
    cursor_ts := cursor_ts + interval '1 minute';
    if public.is_support_business_minute(cursor_ts) then
      added_minutes := added_minutes + 1;
    end if;
  end loop;

  return cursor_ts;
end;
$$;

create or replace function public.compute_support_sla_status(due_at timestamptz, first_response_at timestamptz)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if first_response_at is not null then
    return 'answered';
  end if;

  if due_at is null then
    return 'on_time';
  end if;

  if now() > due_at then
    return 'overdue';
  end if;

  if now() + interval '30 minutes' >= due_at then
    return 'at_risk';
  end if;

  return 'on_time';
end;
$$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  category text not null default 'general',
  attachment_url text,
  attachment_name text,
  first_response_due_at timestamptz,
  first_response_at timestamptz,
  sla_policy_key text not null default 'general',
  sla_status text not null default 'on_time',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_status_check check (status in ('open', 'in_progress', 'closed')),
  constraint support_tickets_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint support_tickets_category_check check (category in ('payment', 'technical', 'account', 'general')),
  constraint support_tickets_sla_status_check check (sla_status in ('on_time', 'at_risk', 'overdue', 'answered'))
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user_created on public.support_tickets (user_id, created_at desc);
create index if not exists idx_support_tickets_category on public.support_tickets (category);
create index if not exists idx_support_tickets_due_status on public.support_tickets (status, sla_status, first_response_due_at asc);
create index if not exists idx_support_tickets_first_response_due on public.support_tickets (first_response_due_at asc);
create index if not exists idx_support_messages_ticket_created on public.support_messages (ticket_id, created_at asc);

create or replace function public.apply_support_ticket_sla_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  response_hours integer;
begin
  response_hours := public.get_support_sla_target_hours(new.category);
  new.sla_policy_key := new.category;

  if tg_op = 'INSERT'
    or new.category is distinct from old.category
    or new.created_at is distinct from old.created_at
    or new.first_response_due_at is null then
    new.first_response_due_at := public.add_support_business_minutes(coalesce(new.created_at, now()), response_hours * 60);
  end if;

  new.sla_status := public.compute_support_sla_status(new.first_response_due_at, new.first_response_at);
  return new;
end;
$$;

create or replace function public.handle_support_message_side_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_role text;
begin
  select role into sender_role
  from public.profiles
  where id = new.sender_id;

  update public.support_tickets
  set
    first_response_at = case
      when sender_role = 'admin' and first_response_at is null then new.created_at
      else first_response_at
    end,
    status = case
      when sender_role = 'admin' and status = 'open' then 'in_progress'
      else status
    end,
    updated_at = now()
  where id = new.ticket_id;

  return new;
end;
$$;

create or replace function public.refresh_support_ticket_sla_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.sla_status := public.compute_support_sla_status(new.first_response_due_at, new.first_response_at);
  return new;
end;
$$;

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row
execute function public.set_updated_at();

drop trigger if exists trg_support_ticket_sla_fields on public.support_tickets;
create trigger trg_support_ticket_sla_fields
before insert or update on public.support_tickets
for each row
execute function public.apply_support_ticket_sla_fields();

drop trigger if exists trg_support_first_admin_response on public.support_messages;
create trigger trg_support_first_admin_response
after insert on public.support_messages
for each row
execute function public.handle_support_message_side_effects();

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "support_tickets_select_own_or_admin" on public.support_tickets;
create policy "support_tickets_select_own_or_admin"
on public.support_tickets
for select
to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
on public.support_tickets
for insert
to authenticated
with check (user_id = public.current_profile_id());

drop policy if exists "support_tickets_admin_update" on public.support_tickets;
create policy "support_tickets_admin_update"
on public.support_tickets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "support_tickets_admin_delete" on public.support_tickets;
create policy "support_tickets_admin_delete"
on public.support_tickets
for delete
to authenticated
using (public.is_admin());

drop policy if exists "support_messages_select_own_ticket_or_admin" on public.support_messages;
create policy "support_messages_select_own_ticket_or_admin"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    where t.id = ticket_id
      and (t.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "support_messages_insert_accessible_ticket" on public.support_messages;
create policy "support_messages_insert_accessible_ticket"
on public.support_messages
for insert
to authenticated
with check (
  sender_id = public.current_profile_id()
  and exists (
    select 1
    from public.support_tickets t
    where t.id = ticket_id
      and (t.user_id = public.current_profile_id() or public.is_admin())
  )
);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "storage_uploads_public_read" on storage.objects;
create policy "storage_uploads_public_read"
on storage.objects
for select
using (bucket_id = 'uploads');

drop policy if exists "storage_uploads_insert_support_folder" on storage.objects;
create policy "storage_uploads_insert_support_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'support'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);

drop policy if exists "storage_uploads_update_support_folder" on storage.objects;
create policy "storage_uploads_update_support_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'support'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
)
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'support'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);

drop policy if exists "storage_uploads_delete_support_folder" on storage.objects;
create policy "storage_uploads_delete_support_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'support'
  and (
    public.is_admin()
    or (storage.foldername(name))[2] = auth.uid()::text
  )
);
