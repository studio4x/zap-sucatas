create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  request_ip text null,
  user_agent text null,
  source text not null default 'public_contact',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_status_created
  on public.contact_messages (status, created_at desc);

create index if not exists idx_contact_messages_email_created
  on public.contact_messages (lower(email), created_at desc);

create index if not exists idx_contact_messages_ip_created
  on public.contact_messages (request_ip, created_at desc);

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row
execute function public.set_updated_at();

alter table public.contact_messages enable row level security;

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
