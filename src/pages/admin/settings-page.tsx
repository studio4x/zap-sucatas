import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { fetchSystemSettings, updateSystemSettings } from '@/domains/settings/api'
import type { UpdateSystemSettingsInput } from '@/domains/settings/types'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

type SettingsFormState = UpdateSystemSettingsInput

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [draftState, setDraftState] = useState<SettingsFormState | null>(null)

  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const initialFormState = useMemo<SettingsFormState>(
    () =>
      settingsQuery.data
        ? {
            allowGuestQuestions: settingsQuery.data.allowGuestQuestions,
            maintenanceMode: settingsQuery.data.maintenanceMode,
            seoDescriptionDefault: settingsQuery.data.seoDescriptionDefault ?? '',
            seoTitleDefault: settingsQuery.data.seoTitleDefault ?? '',
            siteName: settingsQuery.data.siteName,
            supportEmail: settingsQuery.data.supportEmail ?? '',
            supportPhone: settingsQuery.data.supportPhone ?? '',
          }
        : {
            allowGuestQuestions: false,
            maintenanceMode: false,
            seoDescriptionDefault: '',
            seoTitleDefault: '',
            siteName: '',
            supportEmail: '',
            supportPhone: '',
          },
    [settingsQuery.data],
  )
  const formState = draftState ?? initialFormState
  const latestFormStateRef = useRef<SettingsFormState>(formState)

  useEffect(() => {
    latestFormStateRef.current = formState
  }, [formState])

  function updateDraftState(partial: Partial<SettingsFormState>) {
    clearFeedback()
    setDraftState((current) => {
      const nextState = {
        ...(current ?? initialFormState),
        ...partial,
      }

      latestFormStateRef.current = nextState
      return nextState
    })
  }

  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: async () => {
      setSuccessFeedback('Configurações globais atualizadas com sucesso.')
      setDraftState(null)
      await queryClient.invalidateQueries({ queryKey: ['system-settings'] })
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível salvar as configurações globais.')
    },
  })

  if (settingsQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando configurações globais...
      </div>
    )
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm">
        Não foi possível carregar as configurações do sistema.
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                clearFeedback()
                updateMutation.mutate(latestFormStateRef.current)
              }}
              type="button"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.home}>Ver site</Link>
            </Button>
          </>
        }
        description="Parâmetros globais do produto, contatos institucionais e toggles operacionais do MVP."
        eyebrow="Admin / configurações"
        title="Configurações globais"
      />

      <OperationFeedback feedback={feedback} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Site" value={settingsQuery.data.siteName} />
        <AdminStatCard
          label="Perguntas anônimas"
          value={settingsQuery.data.allowGuestQuestions ? 'Ativas' : 'Desativadas'}
        />
        <AdminStatCard
          label="Manutenção"
          value={settingsQuery.data.maintenanceMode ? 'Ativa' : 'Desativada'}
        />
        <AdminStatCard label="Suporte" value={settingsQuery.data.supportEmail ?? 'Sem e-mail'} />
      </div>

      <AdminFilterCard
        description="Escopo global do site e toggles que impactam operação, suporte e experiência pública."
        title="Escopo operacional"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Ajustes aqui afetam o comportamento público e autenticado do MVP.
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Regras críticas continuam no backend com RLS, triggers e funções sensíveis no Supabase.
          </div>
        </div>
      </AdminFilterCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Operação do produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="site-name">
                Nome do site
              </label>
              <Input
                id="site-name"
                onChange={(event) => updateDraftState({ siteName: event.target.value })}
                value={formState.siteName}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="support-email">
                E-mail de suporte
              </label>
              <Input
                id="support-email"
                onChange={(event) => updateDraftState({ supportEmail: event.target.value })}
                value={formState.supportEmail}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="support-phone">
                Telefone de suporte
              </label>
              <Input
                id="support-phone"
                onChange={(event) => updateDraftState({ supportPhone: event.target.value })}
                value={formState.supportPhone}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/25 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Perguntas anônimas</p>
                  <p className="text-sm text-muted-foreground">
                    Libera envio de perguntas sem login no detalhe do anúncio.
                  </p>
                </div>
                <Switch
                  id="allow-guest-questions-switch"
                  checked={formState.allowGuestQuestions}
                  onCheckedChange={(checked) => updateDraftState({ allowGuestQuestions: checked })}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/25 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Modo manutenção</p>
                  <p className="text-sm text-muted-foreground">
                    Toggle operacional para contingência global do site.
                  </p>
                </div>
                <Switch
                  id="maintenance-mode-switch"
                  checked={formState.maintenanceMode}
                  onCheckedChange={(checked) => updateDraftState({ maintenanceMode: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="seo-title">
                Título SEO padrão
              </label>
              <Input
                id="seo-title"
                onChange={(event) => updateDraftState({ seoTitleDefault: event.target.value })}
                value={formState.seoTitleDefault}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="seo-description">
                Descrição SEO padrão
              </label>
              <Textarea
                id="seo-description"
                onChange={(event) => updateDraftState({ seoDescriptionDefault: event.target.value })}
                value={formState.seoDescriptionDefault}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
