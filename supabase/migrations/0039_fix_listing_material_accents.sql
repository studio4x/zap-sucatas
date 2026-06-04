update public.listing_materials
set
  name = case slug
    when 'aco' then 'Aço'
    when 'aluminio' then 'Alumínio'
    when 'latao' then 'Latão'
    when 'plastico-misto' then 'Plástico misto'
    when 'papelao' then 'Papelão'
    when 'eletronicos' then 'Eletrônicos'
    else name
  end,
  updated_at = now()
where slug in ('aco', 'aluminio', 'latao', 'plastico-misto', 'papelao', 'eletronicos');
