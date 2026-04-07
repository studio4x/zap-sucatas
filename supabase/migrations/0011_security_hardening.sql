create or replace function public.protect_profile_mutations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.auth_user_id = auth.uid() then
    new.id := old.id;
    new.auth_user_id := old.auth_user_id;
    new.role := old.role;
    new.is_admin := old.is_admin;
    new.status := old.status;
    new.created_at := old.created_at;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_mutations on public.profiles;
create trigger protect_profile_mutations
before update on public.profiles
for each row
execute function public.protect_profile_mutations();

create or replace function public.protect_listing_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.user_id = public.current_profile_id() then
    new.id := old.id;
    new.user_id := old.user_id;
    new.slug := old.slug;
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.is_featured := old.is_featured;
    new.published_at := old.published_at;
    new.expires_at := old.expires_at;
    new.created_at := old.created_at;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_listing_sensitive_fields on public.listings;
create trigger protect_listing_sensitive_fields
before update on public.listings
for each row
execute function public.protect_listing_sensitive_fields();

drop policy if exists "listing_questions_admin_update" on public.listing_questions;
create policy "listing_questions_admin_update"
on public.listing_questions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "listing_answers_manage_owner_or_admin" on public.listing_answers;
create policy "listing_answers_admin_manage"
on public.listing_answers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
