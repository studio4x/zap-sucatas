import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      setMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada.')
      emailForm.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao enviar recuperação.')
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
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Solicite o link de redefinição ou, se você já voltou pelo e-mail, defina uma nova senha para acessar sua conta."
        eyebrow="Recuperar acesso"
        title="Recuperar senha"
      />

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{isAuthenticated ? 'Definir nova senha' : 'Solicitar recuperação'}</CardTitle>
          <CardDescription>
            {isAuthenticated
              ? 'Sessão de recuperação detectada. Defina sua nova senha.'
              : 'Envie o e-mail da conta para receber um link seguro de recuperação.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
