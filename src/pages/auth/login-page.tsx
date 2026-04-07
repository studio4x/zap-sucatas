import { useLocation, useNavigate } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import { PagePlaceholder } from '@/components/shared/page-placeholder'
import { Button } from '@/components/ui/button'
import type { AuthRole } from '@/domains/auth/types'
import { useAuth } from '@/hooks/use-auth'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signInAs } = useAuth()
  const state = location.state as LocationState | null

  function handleMockSignIn(role: AuthRole) {
    signInAs(role)
    navigate(state?.from?.pathname ?? getDefaultPathByRole(role), { replace: true })
  }

  return (
    <PagePlaceholder
      actions={[
        {
          label: 'Criar conta',
          to: paths.auth.register,
          variant: 'outline',
        },
        {
          label: 'Recuperar senha',
          to: paths.auth.forgotPassword,
          variant: 'secondary',
        },
      ]}
      description="Base inicial do login. O proximo passo e substituir este mock por Supabase Auth com sessao real e bootstrap de profile."
      eyebrow="Auth"
      highlights={[
        'Rota alinhada ao blueprint',
        'Guards ja redirecionam por role',
        'Ponto certo para integrar login seguro',
      ]}
      title="Login da plataforma"
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <Button onClick={() => handleMockSignIn('user')}>Entrar como usuario</Button>
        <Button onClick={() => handleMockSignIn('admin')} variant="secondary">
          Entrar como admin
        </Button>
      </div>
    </PagePlaceholder>
  )
}
