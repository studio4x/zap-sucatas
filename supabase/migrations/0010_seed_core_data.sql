insert into public.listing_categories (name, slug, description, sort_order)
values
  ('Metais ferrosos', 'metais-ferrosos', 'Categorias para ferro, aco e derivados.', 10),
  ('Metais não ferrosos', 'metais-nao-ferrosos', 'Categorias para alumínio, cobre, latão e afins.', 20),
  ('Papel e papelão', 'papel-e-papelao', 'Resíduos e aparas de papel e papelão.', 30),
  ('Plástico', 'plastico', 'Materiais plásticos industriais e recicláveis.', 40),
  ('Eletronicos', 'eletronicos', 'Sucata eletronica e componentes.', 50),
  ('Baterias', 'baterias', 'Baterias automotivas e industriais.', 60),
  ('Maquinários', 'maquinarios', 'Máquinas e equipamentos reutilizáveis.', 70),
  ('Equipamentos industriais', 'equipamentos-industriais', 'Equipamentos industriais e linhas produtivas.', 80)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.listing_materials (name, slug)
values
  ('Ferro', 'ferro'),
  ('Aço', 'aco'),
  ('Alumínio', 'aluminio'),
  ('Cobre', 'cobre'),
  ('Latão', 'latao'),
  ('Plástico misto', 'plastico-misto'),
  ('Papel', 'papel'),
  ('Papelão', 'papelao'),
  ('Eletrônicos', 'eletronicos'),
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
