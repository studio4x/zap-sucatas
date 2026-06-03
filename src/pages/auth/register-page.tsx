import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import handshakeBg from '@/assets/home-bg/cta-handshake-bg.png'
import { paths } from '@/app/paths'
import { PublicAuthShell } from '@/components/public/public-auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp } from '@/domains/auth/api'
import { getAuthErrorMessage } from '@/domains/auth/error-messages'
import { registerSchema, type RegisterFormValues } from '@/domains/auth/schemas'
import { useAuth } from '@/hooks/use-auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      setErrorMessage(getAuthErrorMessage(error, 'Falha ao criar conta.'))
    }
  }

  return (
    <PublicAuthShell
      badge="Cadastro"
      description="Crie sua conta para anunciar, comprar, enviar perguntas e acompanhar suas negociações no portal."
      media={
        <div className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-slate-950 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.55)]">
          <div className="relative aspect-[16/8]">
            <img
              alt="Equipe comercial e operação de sucatas da Zap Sucatas"
              className="absolute inset-0 h-full w-full object-cover"
              src={handshakeBg}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/28 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
              <div className="max-w-sm space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
                  Cadastro aberto
                </p>
                <p className="text-lg font-semibold leading-tight">
                  Abra sua conta para anunciar, negociar e acompanhar suas oportunidades no portal.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur sm:block">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Operação</p>
                <p className="mt-1 text-sm font-semibold">Conta pronta para uso</p>
              </div>
            </div>
          </div>
        </div>
      }
      highlights={[]}
      title="Abra sua conta"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Criar conta</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Cadastro aberto para compradores e anunciantes. O papel administrativo continua fechado.
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
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pr-11"
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                />
                <button
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="register-confirm-password">
                Confirmar senha
              </label>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  className="pr-11"
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...form.register('confirmPassword')}
                />
                <button
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={!isSupabaseConfigured || form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.auth.login}>Já tenho conta</Link>
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
