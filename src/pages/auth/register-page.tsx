import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PublicAuthShell } from '@/components/public/public-auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp } from '@/domains/auth/api'
import { registerSchema, type RegisterFormValues } from '@/domains/auth/schemas'
import { useAuth } from '@/hooks/use-auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
    },
    resolver: zodResolver(registerSchema),
  })

  async function handleSubmit(values: RegisterFormValues) {
    setMessage(null)

    try {
      const sessionUser = await signUp({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
      })

      if (sessionUser) {
        navigate(paths.app.root, { replace: true })
        return
      }

      setMessage('Cadastro enviado. Verifique seu e-mail para confirmar a conta.')
      form.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar conta.')
    }
  }

  return (
    <PublicAuthShell
      badge="Cadastro"
      description="Crie sua conta para publicar anuncios, acompanhar perguntas e operar o seu catalogo no portal."
      highlights={[
        'Cadastro aberto para anunciantes do marketplace.',
        'Fluxo administrativo segue separado e controlado.',
        'Conta pensada para anunciar, responder perguntas e acompanhar moderacao.',
      ]}
      title="Abra sua conta de anunciante"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Criar conta</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Cadastro aberto para anunciantes. O papel administrativo continua fechado.
          </p>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="register-full-name">
              Nome completo
            </label>
            <Input autoComplete="name" id="register-full-name" {...form.register('fullName')} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="register-email">
              E-mail
            </label>
            <Input
              autoComplete="username"
              id="register-email"
              type="email"
              {...form.register('email')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="register-password">
                Senha
              </label>
              <Input
                autoComplete="new-password"
                id="register-password"
                type="password"
                {...form.register('password')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="register-confirm-password">
                Confirmar senha
              </label>
              <Input
                autoComplete="new-password"
                id="register-confirm-password"
                type="password"
                {...form.register('confirmPassword')}
              />
            </div>
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={!isSupabaseConfigured || form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.auth.login}>Ja tenho conta</Link>
            </Button>
          </div>
        </form>
      </div>
    </PublicAuthShell>
  )
}
