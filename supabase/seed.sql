insert into public.listing_categories (name, slug, description, sort_order, parent_id)
values
  ('Eu Compro', 'eu-compro', 'Categorias de compra organizadas por segmento.', 5, null),
  ('Serviços', 'servicos', 'Serviços relacionados ao mercado de sucatas e maquinários.', 210, null),
  ('Venda', 'venda', 'Categorias de venda organizadas por segmento.', 220, null)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id,
  updated_at = now();

insert into public.listing_categories (name, slug, description, sort_order, parent_id)
values
  ('Catalizadores Automotivos', 'catalizadores-automotivos-eu-compro', 'Compra de catalizadores automotivos e peças relacionadas.', 10, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Diversos', 'diversos-eu-compro', 'Categorias variadas de compra sem segmentação específica.', 20, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Empilhadeiras', 'empilhadeiras-eu-compro', 'Compra de empilhadeiras e equipamentos de movimentação.', 30, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Máquinas Novas', 'maquinas-novas-eu-compro', 'Compra de máquinas novas ou sem uso operacional.', 40, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Máquinas Usadas', 'maquinas-usadas-eu-compro', 'Compra de máquinas usadas, recuperadas ou seminovas.', 50, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Minérios em Geral', 'minerios-em-geral-eu-compro', 'Compra de minérios e materiais minerais diversos.', 60, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Motores Diversos', 'motores-diversos-eu-compro', 'Compra de motores de vários portes e aplicações.', 70, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Plásticos', 'plasticos-eu-compro', 'Compra de plásticos e resíduos plásticos em geral.', 80, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Resíduos em Geral', 'residuos-em-geral-eu-compro', 'Compra de resíduos diversos e materiais mistos.', 90, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Alumínio', 'sucata-de-aluminio-eu-compro', 'Compra de sucata de alumínio e ligas correlatas.', 100, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Chumbo', 'sucata-de-chumbo-eu-compro', 'Compra de sucata de chumbo e derivados.', 110, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Cobre', 'sucata-de-cobre-eu-compro', 'Compra de sucata de cobre e materiais afins.', 120, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Eletrônica', 'sucata-de-eletronica-eu-compro', 'Compra de sucata eletrônica, placas e componentes.', 130, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Estanho', 'sucata-de-estanho-eu-compro', 'Compra de sucata de estanho e ligas com estanho.', 140, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Ferro', 'sucata-de-ferro-eu-compro', 'Compra de sucata de ferro e aço.', 150, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Inox', 'sucata-de-inox-eu-compro', 'Compra de sucata de inox e aço inoxidável.', 160, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Magnésio', 'sucata-de-magnesio-eu-compro', 'Compra de sucata de magnésio e ligas leves.', 170, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Molibdênio', 'sucata-de-molibdenio-eu-compro', 'Compra de sucata de molibdênio e ligas especiais.', 180, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Níquel', 'sucata-de-niquel-eu-compro', 'Compra de sucata de níquel e materiais relacionados.', 190, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Sucata de Zamac', 'sucata-de-zamac-eu-compro', 'Compra de sucata de zamac e ligas de zinco.', 200, (select id from public.listing_categories where slug = 'eu-compro')),
  ('Catalizadores Automotivos', 'catalizadores-automotivos', 'Venda de catalizadores automotivos e peças relacionadas.', 230, (select id from public.listing_categories where slug = 'venda')),
  ('Diversos', 'diversos', 'Categorias variadas de venda sem segmentação específica.', 240, (select id from public.listing_categories where slug = 'venda')),
  ('Empilhadeiras', 'empilhadeiras', 'Venda de empilhadeiras e equipamentos de movimentação.', 250, (select id from public.listing_categories where slug = 'venda')),
  ('Máquinas Novas', 'maquinas-novas', 'Venda de máquinas novas ou sem uso operacional.', 260, (select id from public.listing_categories where slug = 'venda')),
  ('Máquinas Usadas', 'maquinas-usadas', 'Venda de máquinas usadas, recuperadas ou seminovas.', 270, (select id from public.listing_categories where slug = 'venda')),
  ('Minérios em Geral', 'minerios-em-geral', 'Venda de minérios e materiais minerais diversos.', 280, (select id from public.listing_categories where slug = 'venda')),
  ('Motores Diversos', 'motores-diversos', 'Venda de motores de vários portes e aplicações.', 290, (select id from public.listing_categories where slug = 'venda')),
  ('Plásticos', 'plasticos', 'Venda de plásticos e resíduos plásticos em geral.', 300, (select id from public.listing_categories where slug = 'venda')),
  ('Resíduos em Geral', 'residuos-em-geral', 'Venda de resíduos diversos e materiais mistos.', 310, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Alumínio', 'sucata-de-aluminio', 'Venda de sucata de alumínio e ligas correlatas.', 320, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Chumbo', 'sucata-de-chumbo', 'Venda de sucata de chumbo e derivados.', 330, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Cobre', 'sucata-de-cobre', 'Venda de sucata de cobre e materiais afins.', 340, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Eletrônica', 'sucata-de-eletronica', 'Venda de sucata eletrônica, placas e componentes.', 350, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Estanho', 'sucata-de-estanho', 'Venda de sucata de estanho e ligas com estanho.', 360, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Ferro', 'sucata-de-ferro', 'Venda de sucata de ferro e aço.', 370, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Inox', 'sucata-de-inox', 'Venda de sucata de inox e aço inoxidável.', 380, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Magnésio', 'sucata-de-magnesio', 'Venda de sucata de magnésio e ligas leves.', 390, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Molibdênio', 'sucata-de-molibdenio', 'Venda de sucata de molibdênio e ligas especiais.', 400, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Níquel', 'sucata-de-niquel', 'Venda de sucata de níquel e materiais relacionados.', 410, (select id from public.listing_categories where slug = 'venda')),
  ('Sucata de Zamac', 'sucata-de-zamac', 'Venda de sucata de zamac e ligas de zinco.', 420, (select id from public.listing_categories where slug = 'venda'))
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id,
  updated_at = now();

insert into public.listing_materials (name, slug)
values
  ('Ferro', 'ferro'),
  ('Aco', 'aco'),
  ('Aluminio', 'aluminio'),
  ('Cobre', 'cobre'),
  ('Latao', 'latao'),
  ('Plastico misto', 'plastico-misto'),
  ('Papel', 'papel'),
  ('Papelao', 'papelao'),
  ('Eletronicos', 'eletronicos'),
  ('Chumbo', 'chumbo')
on conflict (slug) do update
set
  name = excluded.name,
  updated_at = now();

insert into public.system_settings (
  site_name,
  support_email,
  support_phone,
  seo_title_default,
  seo_description_default,
  allow_guest_questions,
  blog_enabled,
  maintenance_mode
)
select
  'Zap Sucatas',
  'contato@zapsucatas.com.br',
  '+55 11 99999-9999',
  'Zap Sucatas | Marketplace de sucatas e maquinarios',
  'Plataforma para anunciar, encontrar e moderar oportunidades em sucatas e maquinarios.',
  false,
  true,
  false
where not exists (select 1 from public.system_settings);
