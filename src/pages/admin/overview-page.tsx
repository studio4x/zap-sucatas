import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminOverviewPage() {
  return (
    <PagePlaceholder
      description="Home do backoffice administrativo. Aqui entram indicadores operacionais, filas críticas e pontos de controle globais."
      eyebrow="Admin"
      highlights={[
        'Acesso protegido por papel',
        'Shell administrativo separado da jornada pública',
        'Base pronta para features de governança',
      ]}
      title="Visão geral administrativa"
    />
  )
}
