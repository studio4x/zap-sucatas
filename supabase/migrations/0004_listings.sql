create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  category_id uuid not null references public.listing_categories(id),
  primary_material_id uuid references public.listing_materials(id),
  title text not null,
  slug text unique,
  summary text,
  description text not null,
  condition_type text,
  price_label text,
  contact_name text,
  contact_phone text,
  city text not null,
  state text not null,
  status text not null default 'draft',
  rejection_reason text,
  is_featured boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_status_check check (
    status in ('draft', 'pending_review', 'approved', 'rejected', 'paused', 'archived', 'expired')
  )
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  alt_text text,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_attributes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  attribute_key text not null,
  attribute_label text not null,
  attribute_value text not null,
  created_at timestamptz not null default now()
);

create index if not exists listings_user_id_status_idx on public.listings(user_id, status);
create index if not exists listings_category_id_status_idx on public.listings(category_id, status);
create index if not exists listings_state_city_idx on public.listings(state, city);
create unique index if not exists listings_slug_idx on public.listings(slug);
create index if not exists listings_published_at_idx on public.listings(published_at desc);
create index if not exists listing_images_listing_id_sort_order_idx on public.listing_images(listing_id, sort_order);

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

create or replace function public.generate_unique_listing_slug(source_title text, current_listing_id uuid default null)
returns text
language plpgsql
as $$
declare
  base_slug text := public.slugify(source_title);
  candidate text;
  suffix integer := 0;
begin
  if coalesce(base_slug, '') = '' then
    base_slug := 'anuncio';
  end if;

  candidate := base_slug;

  while exists (
    select 1
    from public.listings l
    where l.slug = candidate
      and (current_listing_id is null or l.id <> current_listing_id)
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;
