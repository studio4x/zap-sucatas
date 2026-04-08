import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardFormSection } from '@/components/dashboard/dashboard-form-section'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      setFeedback('Sua senha foi atualizada com sucesso.')
    },
  })

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        description="Gerencie a segurança básica da conta e acompanhe as informações operacionais da plataforma."
        title="Configurações"
      />

      <DashboardAlertCard
        description="Preferências individuais mais avançadas ainda não entram neste MVP. Esta tela cobre segurança e referência institucional."
        title="Configurações essenciais da conta"
        tone="info"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Marketplace"
          value={settingsQuery.data?.siteName ?? 'Carregando'}
        />
        <DashboardStatCard
          label="Suporte"
          value={settingsQuery.data?.supportEmail ?? 'Não informado'}
        />
        <DashboardStatCard
          label="Perguntas anônimas"
          value={settingsQuery.data?.allowGuestQuestions ? 'Ativas' : 'Desativadas'}
        />
        <DashboardStatCard
          label="Manutenção"
          value={settingsQuery.data?.maintenanceMode ? 'Ativa' : 'Desativada'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <DashboardFormSection
          description="Atualize sua senha sempre que precisar reforçar a segurança da conta."
          title="Segurança"
        >
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => passwordMutation.mutate(values))}
          >
            <div className="grid gap-4 md:grid-cols-2">
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
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="settings-confirm-password"
                >
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
            </div>

            {feedback ? (
              <DashboardAlertCard
                description={feedback}
                title="Senha atualizada"
                tone="success"
              />
            ) : null}

            <Button disabled={passwordMutation.isPending} type="submit">
              {passwordMutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
            </Button>
          </form>
        </DashboardFormSection>

        <div className="space-y-6">
          <DashboardFormSection
            description="Referências institucionais e operacionais do marketplace neste momento."
            title="Informações da plataforma"
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Marketplace:</span>{' '}
                {settingsQuery.data?.siteName ?? 'Carregando'}
              </p>
              <p>
                <span className="font-medium text-foreground">Suporte por e-mail:</span>{' '}
                {settingsQuery.data?.supportEmail ?? 'Não informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Suporte por telefone:</span>{' '}
                {settingsQuery.data?.supportPhone ?? 'Não informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Perguntas anônimas:</span>{' '}
                {settingsQuery.data?.allowGuestQuestions ? 'Habilitadas' : 'Desabilitadas'}
              </p>
            </div>
          </DashboardFormSection>

          <DashboardAlertCard
            description="Mudanças globais de comportamento do site ficam sob controle administrativo."
            title="Preferências do produto"
            tone="warning"
          />
        </div>
      </div>
    </section>
  )
}
