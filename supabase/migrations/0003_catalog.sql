create table if not exists public.listing_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_listing_categories_updated_at on public.listing_categories;
create trigger set_listing_categories_updated_at
before update on public.listing_categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_listing_materials_updated_at on public.listing_materials;
create trigger set_listing_materials_updated_at
before update on public.listing_materials
for each row
execute function public.set_updated_at();
