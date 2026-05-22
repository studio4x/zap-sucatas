import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import { PublicAuthShell } from '@/components/public/public-auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendMagicLink, signInWithPassword } from '@/domains/auth/api'
import {
  loginSchema,
  magicLinkSchema,
  type LoginFormValues,
  type MagicLinkFormValues,
} from '@/domains/auth/schemas'
import { useAuth } from '@/hooks/use-auth'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isSupabaseConfigured } = useAuth()
  const state = location.state as LocationState | null
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [magicMessage, setMagicMessage] = useState<string | null>(null)

  const passwordForm = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  })

  const magicLinkForm = useForm<MagicLinkFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(magicLinkSchema),
  })

  async function handlePasswordLogin(values: LoginFormValues) {
    setPasswordMessage(null)

    try {
      const sessionUser = await signInWithPassword(values)
      navigate(state?.from?.pathname ?? getDefaultPathByRole(sessionUser?.role ?? 'user'), {
        replace: true,
      })
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Falha ao autenticar.')
    }
  }

  async function handleMagicLink(values: MagicLinkFormValues) {
    setMagicMessage(null)

    try {
      await sendMagicLink(values.email)
      setMagicMessage('Magic link enviado. Verifique seu e-mail para concluir o login.')
      magicLinkForm.reset({ email: values.email })
    } catch (error) {
      setMagicMessage(error instanceof Error ? error.message : 'Falha ao enviar magic link.')
    }
  }

  return (
    <PublicAuthShell
      badge="Entrar"
      description="Acesse sua conta para publicar anuncios, responder perguntas e acompanhar o status da sua operacao no portal."
      highlights={[
        'Painel do anunciante com anuncios, perguntas e perfil.',
        'Fluxo de moderacao para dar mais confianca ao catalogo publico.',
        'Acesso administrativo separado e protegido por role.',
      ]}
      title="Login do anunciante"
    >
      <div className="space-y-6">
        {!isSupabaseConfigured ? (
          <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            Supabase nao configurado. Defina as variaveis publicas para habilitar o login real.
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">Entrar com senha</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Fluxo principal para anunciantes e administracao da plataforma.
            </p>
          </div>

          <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handlePasswordLogin)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="login-email">
                E-mail
              </label>
              <Input
                autoComplete="username"
                id="login-email"
                type="email"
                {...passwordForm.register('email')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="login-password">
                Senha
              </label>
              <Input
                autoComplete="current-password"
                id="login-password"
                type="password"
                {...passwordForm.register('password')}
              />
            </div>

            {passwordMessage ? <p className="text-sm text-muted-foreground">{passwordMessage}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={!isSupabaseConfigured || passwordForm.formState.isSubmitting} type="submit">
                {passwordForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={paths.auth.forgotPassword}>Recuperar senha</Link>
              </Button>
            </div>
          </form>
        </div>

        <div className="border-t border-border/70 pt-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Entrar com login sem senha</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Acesse sem senha usando um link seguro enviado por e-mail.
              </p>
            </div>

            <form className="space-y-4" onSubmit={magicLinkForm.handleSubmit(handleMagicLink)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="magic-email">
                  E-mail
                </label>
                <Input
                  autoComplete="username"
                  id="magic-email"
                  type="email"
                  {...magicLinkForm.register('email')}
                />
              </div>

              {magicMessage ? <p className="text-sm text-muted-foreground">{magicMessage}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!isSupabaseConfigured || magicLinkForm.formState.isSubmitting}
                  type="submit"
                  variant="secondary"
                >
                  {magicLinkForm.formState.isSubmitting ? 'Enviando...' : 'Enviar Link de acesso'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to={paths.auth.register}>Criar conta</Link>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicAuthShell>
  )
}
