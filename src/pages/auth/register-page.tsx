import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signUp } from '@/domains/auth/api'
import { registerSchema, type RegisterFormValues } from '@/domains/auth/schemas'
import { useAuth } from '@/hooks/use-auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function handleSubmit(values: RegisterFormValues) {
    setMessage(null)

    try {
      const sessionUser = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })

      if (sessionUser) {
        navigate(paths.app.root, { replace: true })
        return
      }

      setMessage('Cadastro enviado. Verifique seu e-mail para confirmar a conta.')
      form.reset()
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Falha ao criar conta.'
      setMessage(nextMessage)
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Cadastro
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground md:text-5xl">
          Cadastro de anunciante
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Cadastro aberto para usuarios do marketplace. O papel administrativo continua fechado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Fluxo base de onboarding com e-mail e senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="register-full-name">
                Nome completo
              </label>
              <Input id="register-full-name" {...form.register('fullName')} />
              {form.formState.errors.fullName ? (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="register-email">
                E-mail
              </label>
              <Input id="register-email" type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="register-password">
                  Senha
                </label>
                <Input id="register-password" type="password" {...form.register('password')} />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="register-confirm-password">
                  Confirmar senha
                </label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={!isSupabaseConfigured || form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </Button>
              <Button asChild type="button" variant="outline">
                <a href={paths.auth.login}>Ja tenho conta</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
