import { paths } from '@/app/paths'
import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function RegisterPage() {
  return (
    <PagePlaceholder
      actions={[
        {
          label: 'Ja tenho conta',
          to: paths.auth.login,
        },
      ]}
      description="Tela base de cadastro para onboarding do anunciante e criacao do perfil operacional."
      eyebrow="Cadastro"
      highlights={[
        'Preparada para RHF + Zod',
        'Conexao futura com Supabase Auth',
        'Bootstrap do profile em tabela dedicada',
      ]}
      title="Cadastro de anunciante"
    />
  )
}
