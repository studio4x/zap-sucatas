import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchSystemSettings } from '@/domains/settings/api'
import { passwordSettingsSchema, type PasswordSettingsValues } from '@/domains/settings/schemas'
import { updatePassword } from '@/domains/auth/api'

export function AppSettingsPage() {
  const [feedback, setFeedback] = useState<string | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const form = useForm<PasswordSettingsValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordSettingsValues) => {
      await updatePassword(values.password)
    },
    onSuccess: () => {
      form.reset()
      setFeedback('Senha atualizada com sucesso.')
    },
  })

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Configuracoes
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Configuracoes da conta
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Ajustes basicos de seguranca e consulta das informacoes operacionais do marketplace.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seguranca</CardTitle>
            <CardDescription>Atualize sua senha de acesso da conta autenticada.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => passwordMutation.mutate(values))}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="settings-password">
                  Nova senha
                </label>
                <Input id="settings-password" type="password" {...form.register('password')} />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="settings-confirm-password">
                  Confirmar nova senha
                </label>
                <Input
                  id="settings-confirm-password"
                  type="password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

              <Button disabled={passwordMutation.isPending} type="submit">
                {passwordMutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes da plataforma</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Marketplace:</span>{' '}
                {settingsQuery.data?.siteName ?? 'Carregando'}
              </p>
              <p>
                <span className="font-medium text-foreground">Suporte por e-mail:</span>{' '}
                {settingsQuery.data?.supportEmail ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Suporte por telefone:</span>{' '}
                {settingsQuery.data?.supportPhone ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Perguntas anonimas:</span>{' '}
                {settingsQuery.data?.allowGuestQuestions ? 'Habilitadas' : 'Desabilitadas'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operacao</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Preferencias individuais mais avancadas ainda nao entram neste MVP. Nesta etapa, a
              tela cobre seguranca basica da conta e informacoes institucionais do marketplace.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
