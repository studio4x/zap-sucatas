import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminLogsPage() {
  return (
    <PagePlaceholder
      description="Area de logs e auditoria para trilha administrativa e integracoes sensiveis do sistema."
      eyebrow="Admin / logs"
      highlights={[
        'Audit trail por acao',
        'Logs de integracao',
        'Base para operacao diaria confiavel',
      ]}
      title="Logs e auditoria"
    />
  )
}
