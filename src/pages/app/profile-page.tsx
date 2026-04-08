import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchCurrentProfile, updateCurrentProfile } from '@/domains/profiles/api'
import { profileFormSchema, type ProfileFormValues } from '@/domains/profiles/schemas'
import { useAuth } from '@/hooks/use-auth'

function getStatusLabel(status: 'active' | 'suspended' | 'under_review') {
  if (status === 'active') {
    return 'Perfil ativo'
  }

  if (status === 'suspended') {
    return 'Perfil suspenso'
  }

  return 'Perfil em analise'
}

export function AppProfilePage() {
  const { refreshUser, user } = useAuth()
  const [feedback, setFeedback] = useState<string | null>(null)

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
    onSuccess: () => {
      setFeedback('Perfil atualizado com sucesso.')
    },
  })

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Perfil
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Perfil do anunciante
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Atualize seus dados cadastrais basicos. As regras sensiveis de papel e status continuam
          protegidas no backend.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
            <CardDescription>Essas informacoes alimentam sua area autenticada e dados de contato.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
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
                <Input id="profile-phone" {...form.register('phone')} placeholder="(11) 99999-9999" />
              </div>

              {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

              <Button disabled={updateMutation.isPending || profileQuery.isLoading} type="submit">
                {updateMutation.isPending ? 'Salvando...' : 'Salvar perfil'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da conta</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">E-mail:</span> {user?.email}
              </p>
              <p>
                <span className="font-medium text-foreground">Papel:</span>{' '}
                {profileQuery.data?.role === 'admin' ? 'Administrador' : 'Anunciante'}
              </p>
              <p>
                <span className="font-medium text-foreground">Status:</span>{' '}
                {profileQuery.data ? getStatusLabel(profileQuery.data.status) : 'Carregando'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observacao</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Alteracoes de papel, aprovacao ou suspensao de conta nao podem ser feitas por esta
              tela. Isso continua no fluxo administrativo.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
