create or replace function public.normalize_listing_location_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_city text;
begin
  normalized_city := regexp_replace(btrim(coalesce(new.city, '')), '\s+', ' ', 'g');

  if normalized_city = '' then
    raise exception 'City is required.'
      using errcode = '23514';
  end if;

  if normalized_city = lower(normalized_city) or normalized_city = upper(normalized_city) then
    normalized_city := initcap(lower(normalized_city));
  end if;

  new.city := normalized_city;
  new.state := upper(regexp_replace(btrim(coalesce(new.state, '')), '\s+', '', 'g'));

  if new.state !~ '^[A-Z]{2}$' then
    raise exception 'State must use the UF format with 2 letters.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

update public.listings
set
  city = case
    when regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g') = lower(regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g'))
      or regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g') = upper(regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g'))
      then initcap(lower(regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g')))
    else regexp_replace(btrim(coalesce(city, '')), '\s+', ' ', 'g')
  end,
  state = upper(regexp_replace(btrim(coalesce(state, '')), '\s+', '', 'g'))
where city is not null
  and state is not null;

drop trigger if exists normalize_listing_location_fields on public.listings;
create trigger normalize_listing_location_fields
before insert or update on public.listings
for each row
execute function public.normalize_listing_location_fields();
