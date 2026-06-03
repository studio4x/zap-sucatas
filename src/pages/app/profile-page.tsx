import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardFormSection } from '@/components/dashboard/dashboard-form-section'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/domains/auth/api'
import { fetchCurrentProfile, updateCurrentProfile } from '@/domains/profiles/api'
import { passwordSettingsSchema, type PasswordSettingsValues } from '@/domains/settings/schemas'
import { profileFormSchema, type ProfileFormValues } from '@/domains/profiles/schemas'
import { useAuth } from '@/hooks/use-auth'

function getStatusLabel(status: 'active' | 'suspended' | 'under_review') {
  if (status === 'active') {
    return 'Perfil ativo'
  }

  if (status === 'suspended') {
    return 'Perfil suspenso'
  }

  return 'Perfil em análise'
}

export function AppProfilePage() {
  const { refreshUser, user } = useAuth()
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ['profile', user?.profileId],
    queryFn: () => fetchCurrentProfile(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    form.reset({
      fullName: profileQuery.data.fullName,
      phone: profileQuery.data.phone ?? '',
    })
  }, [form, profileQuery.data])

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const nextProfile = await updateCurrentProfile({
        fullName: values.fullName,
        phone: values.phone,
        profileId: user?.profileId ?? '',
      })

      await refreshUser()
      return nextProfile
    },
    onError: (error) => {
      setProfileFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar seus dados.')
    },
    onSuccess: () => {
      setProfileFeedback('Seus dados foram atualizados com sucesso.')
    },
  })

  const passwordForm = useForm<PasswordSettingsValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async (values: PasswordSettingsValues) => {
      await updatePassword(values.password)
    },
    onError: (error) => {
      setPasswordFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar sua senha.')
    },
    onSuccess: () => {
      passwordForm.reset()
      setPasswordFeedback('Sua senha foi atualizada com sucesso.')
    },
  })

  if (profileQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        Carregando perfil...
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <DashboardAlertCard
        description="Não foi possível carregar seus dados nesta tentativa."
        title="Falha ao carregar perfil"
        tone="error"
      />
    )
  }

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        description="Atualize seus dados de contato e mantenha a conta pronta para operar no marketplace."
        title="Meu perfil"
      />

      <DashboardAlertCard
        description="Seu perfil é usado para identificar a conta autenticada e apoiar os contatos exibidos nos seus anúncios."
        title="Mantenha estas informações sempre atualizadas"
        tone="info"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <DashboardFormSection
          description="Esses dados alimentam sua área autenticada e ajudam o time a reconhecer sua conta."
          title="Dados cadastrais"
        >
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              setProfileFeedback(null)
              updateMutation.mutate(values)
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="profile-full-name">
                  Nome completo
                </label>
                <Input id="profile-full-name" {...form.register('fullName')} />
                {form.formState.errors.fullName ? (
                  <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="profile-phone">
                  Telefone
                </label>
                <Input
                  id="profile-phone"
                  {...form.register('phone')}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {profileFeedback ? (
              <DashboardAlertCard
                description={profileFeedback}
                title="Perfil atualizado"
                tone="success"
              />
            ) : null}

            <Button disabled={updateMutation.isPending} type="submit">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar perfil'}
            </Button>
          </form>
        </DashboardFormSection>

        <div className="space-y-6">
          <DashboardFormSection
            description="Altere a senha de acesso sempre que quiser reforçar a segurança da conta."
            title="Segurança"
          >
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit((values) => {
                setPasswordFeedback(null)
                passwordMutation.mutate(values)
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="profile-password">
                    Nova senha
                  </label>
                  <Input id="profile-password" type="password" {...passwordForm.register('password')} />
                  {passwordForm.formState.errors.password ? (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="profile-confirm-password">
                    Confirmar nova senha
                  </label>
                  <Input
                    id="profile-confirm-password"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {passwordFeedback ? (
                <DashboardAlertCard
                  description={passwordFeedback}
                  title="Senha atualizada"
                  tone="success"
                />
              ) : null}

              <Button disabled={passwordMutation.isPending} type="submit">
                {passwordMutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
              </Button>
            </form>
          </DashboardFormSection>

          <DashboardFormSection
            description="Os controles sensíveis de papel e liberação da conta continuam protegidos no backend e no admin."
            title="Contexto da conta"
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Status atual:</span>{' '}
                {getStatusLabel(profileQuery.data.status)}
              </p>
              <p>
                <span className="font-medium text-foreground">Perfil:</span>{' '}
                {profileQuery.data.role === 'admin' ? 'Administrador' : 'Comprador e anunciante'}
              </p>
              <p>
                <span className="font-medium text-foreground">E-mail:</span> {user?.email}
              </p>
            </div>
          </DashboardFormSection>

          <DashboardAlertCard
            description="Se houver mudança de status da conta, o time administrativo trata esse fluxo fora desta tela."
            title="Alterações administrativas"
            tone="warning"
          />
        </div>
      </div>
    </section>
  )
}
