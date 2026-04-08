alter table public.profiles
add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.auth_user_id = u.id
  and (p.email is null or p.email = '');

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null and email <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'Novo usuario'
    )
  )
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name;

  return new;
end;
$$;
