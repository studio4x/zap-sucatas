import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminMaterialsPage() {
  return (
    <PagePlaceholder
      description="CRUD de materiais usados no catalogo e na tabela de precos."
      eyebrow="Admin / materiais"
      highlights={[
        'Materiais reutilizaveis em anuncios',
        'Base para pricing manual',
        'Gestao centralizada de termos do dominio',
      ]}
      title="Gestao de materiais"
    />
  )
}
