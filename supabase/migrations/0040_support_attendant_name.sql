alter table public.support_tickets
add column if not exists responder_name text;

alter table public.support_messages
add column if not exists sender_display_name text;

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
    responder_name = case
      when sender_role = 'admin' and responder_name is null then coalesce(nullif(new.sender_display_name, ''), responder_name)
      else responder_name
    end,
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
