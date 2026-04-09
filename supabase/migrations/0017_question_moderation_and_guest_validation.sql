create or replace function public.normalize_listing_question_guest_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.question_text := regexp_replace(btrim(coalesce(new.question_text, '')), '\s+', ' ', 'g');

  if new.author_user_id is null then
    new.guest_name := nullif(regexp_replace(btrim(coalesce(new.guest_name, '')), '\s+', ' ', 'g'), '');
    new.guest_email := nullif(lower(btrim(coalesce(new.guest_email, ''))), '');

    if new.guest_name is null then
      raise exception 'Guest name is required for anonymous questions.'
        using errcode = '23514';
    end if;

    if new.guest_email is null or new.guest_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
      raise exception 'A valid guest email is required for anonymous questions.'
        using errcode = '23514';
    end if;
  else
    new.guest_name := null;
    new.guest_email := null;
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_listing_question_guest_fields on public.listing_questions;
create trigger normalize_listing_question_guest_fields
before insert or update on public.listing_questions
for each row
execute function public.normalize_listing_question_guest_fields();

create index if not exists listing_questions_status_idx on public.listing_questions(status);
