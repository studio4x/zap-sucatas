import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppListingsPage() {
  return (
    <PagePlaceholder
      description="Listagem privada dos anuncios do usuario com visao por status, edicao e envio para revisao."
      eyebrow="Meus anuncios"
      highlights={[
        'Filtros por status',
        'Acesso rapido a rascunhos e rejeitados',
        'Conexao futura com Edge Function de submissao',
      ]}
      title="Gestao dos meus anuncios"
    />
  )
}
