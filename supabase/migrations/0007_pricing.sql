create table if not exists public.scrap_price_entries (
  id uuid primary key default gen_random_uuid(),
  material_name text not null,
  region_name text,
  price_label text not null,
  price_numeric numeric(12, 2),
  price_unit text,
  source_type text not null default 'manual',
  effective_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lme_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  metal_code text not null,
  metal_name text not null,
  currency_code text not null,
  price_value numeric(14, 4) not null,
  quoted_at timestamptz not null,
  source_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lme_price_snapshots_metal_code_quoted_at_idx
  on public.lme_price_snapshots(metal_code, quoted_at desc);

drop trigger if exists set_scrap_price_entries_updated_at on public.scrap_price_entries;
create trigger set_scrap_price_entries_updated_at
before update on public.scrap_price_entries
for each row
execute function public.set_updated_at();
