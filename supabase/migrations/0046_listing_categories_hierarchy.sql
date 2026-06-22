alter table public.listing_categories
  add column if not exists parent_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_categories_parent_id_fkey'
      and conrelid = 'public.listing_categories'::regclass
  ) then
    alter table public.listing_categories
      add constraint listing_categories_parent_id_fkey
      foreign key (parent_id) references public.listing_categories(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_categories_parent_not_self_chk'
      and conrelid = 'public.listing_categories'::regclass
  ) then
    alter table public.listing_categories
      add constraint listing_categories_parent_not_self_chk
      check (parent_id is null or parent_id <> id);
  end if;
end $$;

create index if not exists listing_categories_parent_sort_idx
  on public.listing_categories (parent_id, sort_order asc, name asc);

update public.listing_categories
set parent_id = null
where slug in ('eu-compro', 'servicos', 'venda');

update public.listing_categories
set parent_id = (
  select id
  from public.listing_categories
  where slug = 'eu-compro'
)
where slug in (
  'catalizadores-automotivos-eu-compro',
  'diversos-eu-compro',
  'empilhadeiras-eu-compro',
  'maquinas-novas-eu-compro',
  'maquinas-usadas-eu-compro',
  'minerios-em-geral-eu-compro',
  'motores-diversos-eu-compro',
  'plasticos-eu-compro',
  'residuos-em-geral-eu-compro',
  'sucata-de-aluminio-eu-compro',
  'sucata-de-chumbo-eu-compro',
  'sucata-de-cobre-eu-compro',
  'sucata-de-eletronica-eu-compro',
  'sucata-de-estanho-eu-compro',
  'sucata-de-ferro-eu-compro',
  'sucata-de-inox-eu-compro',
  'sucata-de-magnesio-eu-compro',
  'sucata-de-molibdenio-eu-compro',
  'sucata-de-niquel-eu-compro',
  'sucata-de-zamac-eu-compro'
);

update public.listing_categories
set parent_id = (
  select id
  from public.listing_categories
  where slug = 'venda'
)
where slug in (
  'catalizadores-automotivos',
  'diversos',
  'empilhadeiras',
  'maquinas-novas',
  'maquinas-usadas',
  'minerios-em-geral',
  'motores-diversos',
  'plasticos',
  'residuos-em-geral',
  'sucata-de-aluminio',
  'sucata-de-chumbo',
  'sucata-de-cobre',
  'sucata-de-eletronica',
  'sucata-de-estanho',
  'sucata-de-ferro',
  'sucata-de-inox',
  'sucata-de-magnesio',
  'sucata-de-molibdenio',
  'sucata-de-niquel',
  'sucata-de-zamac'
);

update public.listings
set category_id = (
  select id
  from public.listing_categories
  where slug = 'sucata-de-niquel-eu-compro'
)
where category_id = (
  select id
  from public.listing_categories
  where slug = 'metais-ferrosos'
);

update public.listings
set category_id = (
  select id
  from public.listing_categories
  where slug = 'sucata-de-zamac-eu-compro'
)
where category_id = (
  select id
  from public.listing_categories
  where slug = 'metais-nao-ferrosos'
)
and title ilike 'Compro pó de zinco%';

update public.listings
set category_id = (
  select id
  from public.listing_categories
  where slug = 'diversos-eu-compro'
)
where category_id = (
  select id
  from public.listing_categories
  where slug = 'metais-nao-ferrosos'
)
and title ilike 'Compro sucata de níquel, cobalto%';

delete from public.listing_categories
where slug in (
  'metais-ferrosos',
  'metais-nao-ferrosos',
  'papel-e-papelao',
  'plastico',
  'eletronicos',
  'baterias',
  'maquinarios',
  'equipamentos-industriais'
);
