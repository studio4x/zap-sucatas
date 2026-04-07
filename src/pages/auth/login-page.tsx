import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  sendMagicLink,
  signInWithPassword,
} from '@/domains/auth/api'
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
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  })

  async function handlePasswordLogin(values: LoginFormValues) {
    setPasswordMessage(null)

    try {
      const sessionUser = await signInWithPassword(values)
      navigate(state?.from?.pathname ?? getDefaultPathByRole(sessionUser?.role ?? 'user'), {
        replace: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao autenticar.'
      setPasswordMessage(message)
    }
  }

  async function handleMagicLink(values: MagicLinkFormValues) {
    setMagicMessage(null)

    try {
      await sendMagicLink(values.email)
      setMagicMessage('Magic link enviado. Verifique seu e-mail para concluir o login.')
      magicLinkForm.reset({ email: values.email })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar magic link.'
      setMagicMessage(message)
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Auth
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground md:text-5xl">
          Login da plataforma
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Login real com Supabase Auth usando senha ou magic link.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Supabase nao configurado</CardTitle>
            <CardDescription>
              Defina as variaveis publicas do Supabase para habilitar o login real.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entrar com senha</CardTitle>
            <CardDescription>
              Fluxo principal para anunciantes e administracao do MVP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handlePasswordLogin)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="login-email">
                  E-mail
                </label>
                <Input id="login-email" type="email" {...passwordForm.register('email')} />
                {passwordForm.formState.errors.email ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="login-password">
                  Senha
                </label>
                <Input
                  id="login-password"
                  type="password"
                  {...passwordForm.register('password')}
                />
                {passwordForm.formState.errors.password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              {passwordMessage ? (
                <p className="text-sm text-muted-foreground">{passwordMessage}</p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={!isSupabaseConfigured || passwordForm.formState.isSubmitting} type="submit">
                  {passwordForm.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={paths.auth.forgotPassword}>Recuperar senha</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrar com magic link</CardTitle>
            <CardDescription>
              Login sem senha, com conclusao por e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={magicLinkForm.handleSubmit(handleMagicLink)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="magic-email">
                  E-mail
                </label>
                <Input id="magic-email" type="email" {...magicLinkForm.register('email')} />
                {magicLinkForm.formState.errors.email ? (
                  <p className="text-sm text-destructive">
                    {magicLinkForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              {magicMessage ? <p className="text-sm text-muted-foreground">{magicMessage}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={!isSupabaseConfigured || magicLinkForm.formState.isSubmitting} type="submit" variant="secondary">
                  {magicLinkForm.formState.isSubmitting ? 'Enviando...' : 'Enviar magic link'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={paths.auth.register}>Criar conta</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
