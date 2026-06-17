create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  path text not null unique,
  section text not null,
  description text not null default '',
  is_online boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

drop policy if exists "site_pages_public_select_online" on public.site_pages;
create policy "site_pages_public_select_online"
on public.site_pages
for select
using (is_online = true);

drop policy if exists "site_pages_admin_manage" on public.site_pages;
create policy "site_pages_admin_manage"
on public.site_pages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists set_site_pages_updated_at on public.site_pages;
create trigger set_site_pages_updated_at
before update on public.site_pages
for each row
execute function public.set_updated_at();

drop trigger if exists capture_site_pages_change on public.site_pages;
create trigger capture_site_pages_change
after insert or update or delete on public.site_pages
for each row
execute function public.capture_admin_table_change('site_page');

insert into public.site_pages (
  page_key,
  title,
  path,
  section,
  description,
  is_online,
  sort_order
)
values
  ('home', 'Home', '/', 'Institucional', 'Página inicial e apresentação da plataforma.', true, 10),
  ('listings', 'Anúncios', '/anuncios', 'Comercial', 'Catálogo público de anúncios aprovados.', true, 20),
  ('categories', 'Categorias', '/categorias', 'Comercial', 'Navegação por categorias de sucata e materiais.', true, 30),
  ('pricing', 'Cotação LME', '/preco-dos-metais-lme', 'Comercial', 'Referência pública de preços e cotação de metais.', true, 40),
  ('scrap_prices', 'Preços dos Metais', '/tabela-de-precos', 'Comercial', 'Tabela pública de preços de sucatas e materiais.', true, 50),
  ('about', 'Sobre', '/sobre', 'Institucional', 'Apresentação institucional da Zap Sucatas.', true, 60),
  ('contact', 'Contato', '/contato', 'Relacionamento', 'Formulário e canais de contato com o time.', true, 70),
  ('support', 'Suporte', '/suporte', 'Relacionamento', 'Canal público de suporte e orientação.', true, 80)
on conflict (page_key) do update set
  title = excluded.title,
  path = excluded.path,
  section = excluded.section,
  description = excluded.description,
  sort_order = excluded.sort_order;
