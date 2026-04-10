import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PublicAuthShell } from '@/components/public/public-auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPasswordReset, updatePassword } from '@/domains/auth/api'
import {
  forgotPasswordSchema,
  updatePasswordSchema,
  type ForgotPasswordFormValues,
  type UpdatePasswordFormValues,
} from '@/domains/auth/schemas'
import { useAuth } from '@/hooks/use-auth'

export function ForgotPasswordPage() {
  const { isAuthenticated, isSupabaseConfigured } = useAuth()
  const [message, setMessage] = useState<string | null>(null)

  const emailForm = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  })

  const passwordForm = useForm<UpdatePasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    resolver: zodResolver(updatePasswordSchema),
  })

  async function handleResetRequest(values: ForgotPasswordFormValues) {
    setMessage(null)

    try {
      await requestPasswordReset(values.email)
      setMessage('E-mail de recuperacao enviado. Verifique sua caixa de entrada.')
      emailForm.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao enviar recuperacao.')
    }
  }

  async function handleUpdatePassword(values: UpdatePasswordFormValues) {
    setMessage(null)

    try {
      await updatePassword(values.password)
      setMessage('Senha atualizada com sucesso.')
      passwordForm.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao atualizar senha.')
    }
  }

  return (
    <PublicAuthShell
      badge="Recuperar acesso"
      description="Solicite o link de redefinicao ou, se voce ja voltou pelo e-mail, defina uma nova senha para acessar sua conta."
      highlights={[
        'Fluxo seguro de recuperacao via e-mail.',
        'Atualizacao imediata da senha ao retornar pelo link.',
        'Acesso pensado para nao interromper a operacao do anunciante.',
      ]}
      title="Recuperar senha"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {isAuthenticated ? 'Definir nova senha' : 'Solicitar recuperacao'}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            {isAuthenticated
              ? 'Sessao de recuperacao detectada. Defina sua nova senha.'
              : 'Envie o e-mail da conta para receber um link seguro de recuperacao.'}
          </p>
        </div>

        {isAuthenticated ? (
          <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handleUpdatePassword)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                Nova senha
              </label>
              <Input
                autoComplete="new-password"
                id="new-password"
                type="password"
                {...passwordForm.register('password')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="confirm-new-password">
                Confirmar nova senha
              </label>
              <Input
                autoComplete="new-password"
                id="confirm-new-password"
                type="password"
                {...passwordForm.register('confirmPassword')}
              />
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <Button disabled={!isSupabaseConfigured || passwordForm.formState.isSubmitting} type="submit">
              {passwordForm.formState.isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={emailForm.handleSubmit(handleResetRequest)}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
                E-mail
              </label>
              <Input
                autoComplete="username"
                id="forgot-email"
                type="email"
                {...emailForm.register('email')}
              />
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={!isSupabaseConfigured || emailForm.formState.isSubmitting} type="submit">
                {emailForm.formState.isSubmitting ? 'Enviando...' : 'Enviar link'}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to={paths.auth.login}>Voltar ao login</Link>
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicAuthShell>
  )
}
