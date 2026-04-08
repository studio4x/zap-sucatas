import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Crie sua conta para publicar anúncios, acompanhar perguntas e operar o seu catálogo no portal."
        eyebrow="Cadastro"
        title="Abra sua conta de anunciante"
      />

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Cadastro aberto para anunciantes. O papel administrativo continua fechado.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <Link to={paths.auth.login}>Já tenho conta</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
