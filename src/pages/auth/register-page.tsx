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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)

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
    setErrorMessage(null)

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

      setIsConfirmationModalOpen(true)
      form.reset()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao criar conta.')
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

          {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}

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

      {isConfirmationModalOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="relative w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Cadastro criado
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              Confirme seu e-mail para ativar a conta
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Enviamos um e-mail de confirmação para você. Acesse sua caixa de entrada e valide o
              endereço para concluir o cadastro e entrar na plataforma.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsConfirmationModalOpen(false)} type="button">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicAuthShell>
  )
}
