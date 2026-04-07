import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminUsersPage() {
  return (
    <PagePlaceholder
      description="Rota placeholder para gestão de usuários, papéis, convites e auditoria administrativa."
      eyebrow="Gestão de usuários"
      highlights={[
        'Tabela administrativa entra aqui',
        'Filtros, paginação e bulk actions podem ser adicionados depois',
        'Permissões finas podem ser acopladas acima do nível de rota',
      ]}
      title="Administração de usuários"
    />
  )
}
