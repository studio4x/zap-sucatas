import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppProfilePage() {
  return (
    <PagePlaceholder
      description="Gestao do perfil do anunciante com dados cadastrais, telefone, status e papel operacional."
      eyebrow="Perfil"
      highlights={[
        'Leitura e update do proprio profile',
        'Dados espelhados em tabela dedicada',
        'Base para validacoes posteriores',
      ]}
      title="Perfil do anunciante"
    />
  )
}
