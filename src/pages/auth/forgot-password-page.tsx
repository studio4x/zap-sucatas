import { paths } from '@/app/paths'
import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function ForgotPasswordPage() {
  return (
    <PagePlaceholder
      actions={[
        {
          label: 'Voltar ao login',
          to: paths.auth.login,
        },
      ]}
      description="Ponto reservado para recuperacao de senha via Supabase Auth e fluxo de redefinicao seguro."
      eyebrow="Recuperacao"
      highlights={[
        'Fluxo seguro de reset',
        'Compatibilidade com email transacional',
        'Sem regra critica no frontend',
      ]}
      title="Recuperar senha"
    />
  )
}
