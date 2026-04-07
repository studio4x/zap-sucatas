import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppSettingsPage() {
  return (
    <PagePlaceholder
      description="Configuracoes basicas da conta autenticada e preferencias operacionais do anunciante."
      eyebrow="Configuracoes"
      highlights={[
        'Separacao clara entre perfil e preferencias',
        'Toggles preparados para evolucao futura',
        'Pronta para persistencia segura',
      ]}
      title="Configuracoes do anunciante"
    />
  )
}
