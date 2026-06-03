import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import heroIndustrialBg from '@/assets/home-bg/hero-industrial-bg.png'
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
  const [showPassword, setShowPassword] = useState(false)

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
      setMagicMessage('Link de acesso enviado. Verifique seu e-mail para concluir o login.')
      magicLinkForm.reset({ email: values.email })
    } catch (error) {
      setMagicMessage(error instanceof Error ? error.message : 'Falha ao enviar magic link.')
    }
  }

  return (
    <PublicAuthShell
      badge="Entrar"
      media={
        <div className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-slate-950 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.55)]">
          <div className="relative aspect-[16/8]">
            <img
              alt="Sucata industrial e operação comercial da Zap Sucatas"
              className="absolute inset-0 h-full w-full object-cover"
              src={heroIndustrialBg}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/28 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
              <div className="max-w-sm space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
                  Portal comercial
                </p>
                <p className="text-lg font-semibold leading-tight">
                  Acesso seguro para quem anuncia, negocia e acompanha a operação do portal.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur sm:block">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Marketplace</p>
                <p className="mt-1 text-sm font-semibold">Sucatas e maquinários</p>
              </div>
            </div>
          </div>
        </div>
      }
      description="Acesse sua conta para anunciar, comprar, enviar perguntas em outros anúncios e acompanhar sua operação no portal."
      highlights={[]}
      title="Login da conta"
    >
      <div className="space-y-6">
        {!isSupabaseConfigured ? (
          <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
            Supabase não configurado. Defina as variaveis públicas para habilitar o login real.
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">Entrar com senha</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Fluxo principal para compradores, anunciantes e administração da plataforma.
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
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  className="pr-11"
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  {...passwordForm.register('password')}
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
