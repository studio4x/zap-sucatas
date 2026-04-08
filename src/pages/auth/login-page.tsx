import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Acesse sua conta para publicar anúncios, responder perguntas e acompanhar o status da sua operação na plataforma."
        eyebrow="Entrar"
        title="Login do anunciante"
      />

      {!isSupabaseConfigured ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle>Supabase não configurado</CardTitle>
            <CardDescription>
              Defina as variáveis públicas do Supabase para habilitar o login real.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Entrar com senha</CardTitle>
            <CardDescription>
              Fluxo principal para anunciantes e administração da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Entrar com magic link</CardTitle>
            <CardDescription>
              Acesse sem senha usando um link seguro enviado por e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {magicLinkForm.formState.isSubmitting ? 'Enviando...' : 'Enviar magic link'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to={paths.auth.register}>Criar conta</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
