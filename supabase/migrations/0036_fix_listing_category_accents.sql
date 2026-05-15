update public.listing_categories
set
  name = case slug
    when 'metais-nao-ferrosos' then 'Metais não ferrosos'
    when 'papel-e-papelao' then 'Papel e papelão'
    when 'plastico' then 'Plástico'
    when 'maquinarios' then 'Maquinários'
    else name
  end,
  description = case slug
    when 'metais-nao-ferrosos' then 'Categorias para alumínio, cobre, latão e afins.'
    when 'papel-e-papelao' then 'Resíduos e aparas de papel e papelão.'
    when 'plastico' then 'Materiais plásticos industriais e recicláveis.'
    when 'maquinarios' then 'Máquinas e equipamentos reutilizáveis.'
    else description
  end,
  updated_at = now()
where slug in ('metais-nao-ferrosos', 'papel-e-papelao', 'plastico', 'maquinarios');
