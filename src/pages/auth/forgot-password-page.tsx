import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { paths } from '@/app/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function handleResetRequest(values: ForgotPasswordFormValues) {
    setMessage(null)

    try {
      await requestPasswordReset(values.email)
      setMessage('Email de recuperacao enviado. Verifique sua caixa de entrada.')
      emailForm.reset()
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Falha ao enviar recuperacao.'
      setMessage(nextMessage)
    }
  }

  async function handleUpdatePassword(values: UpdatePasswordFormValues) {
    setMessage(null)

    try {
      await updatePassword(values.password)
      setMessage('Senha atualizada com sucesso.')
      passwordForm.reset()
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Falha ao atualizar senha.'
      setMessage(nextMessage)
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Recuperacao
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground md:text-5xl">
          Recuperar senha
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Solicite o link de redefinicao ou, se voce ja voltou pelo e-mail, defina a nova senha.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAuthenticated ? 'Definir nova senha' : 'Solicitar recuperacao'}</CardTitle>
          <CardDescription>
            {isAuthenticated
              ? 'Sessao de recuperacao detectada. Defina sua nova senha.'
              : 'Envie o e-mail da conta para receber o link seguro de recuperacao.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handleUpdatePassword)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                  Nova senha
                </label>
                <Input id="new-password" type="password" {...passwordForm.register('password')} />
                {passwordForm.formState.errors.password ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="confirm-new-password">
                  Confirmar nova senha
                </label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={!isSupabaseConfigured || passwordForm.formState.isSubmitting} type="submit">
                  {passwordForm.formState.isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={emailForm.handleSubmit(handleResetRequest)}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
                  E-mail
                </label>
                <Input id="forgot-email" type="email" {...emailForm.register('email')} />
                {emailForm.formState.errors.email ? (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                ) : null}
              </div>

              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={!isSupabaseConfigured || emailForm.formState.isSubmitting} type="submit">
                  {emailForm.formState.isSubmitting ? 'Enviando...' : 'Enviar link'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={paths.auth.login}>Voltar ao login</a>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
