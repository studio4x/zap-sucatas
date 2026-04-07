import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminSettingsPage() {
  return (
    <PagePlaceholder
      description="Configuracoes globais do site, contatos institucionais, SEO padrao e toggles operacionais."
      eyebrow="Admin / configuracoes"
      highlights={[
        'Site name e contatos',
        'SEO default e maintenance mode',
        'Allow guest questions como toggle central',
      ]}
      title="Configuracoes globais"
    />
  )
}
