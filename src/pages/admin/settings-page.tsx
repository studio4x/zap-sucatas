import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Link2, Palette } from 'lucide-react'
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
import {
  fetchAdminVisualSettings,
  fetchSystemSettings,
  updateSystemSettings,
  uploadAdminVisualAsset,
} from '@/domains/settings/api'
import type {
  UpdateSystemSettingsInput,
  VisualAssetItem,
  VisualAssetKind,
} from '@/domains/settings/types'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

type SettingsFormState = UpdateSystemSettingsInput

type AdminSettingsTab = 'operational' | 'visual'

type VisualAssetMeta = {
  accept: string
  backgroundClassName: string
  description: string
  helper: string
  kind: VisualAssetKind
  title: string
}

const visualAssetMetaList: VisualAssetMeta[] = [
  {
    accept: '.svg,.png,.webp,.jpg,.jpeg,image/*',
    backgroundClassName: 'border-[#0f5160] bg-[linear-gradient(180deg,#1d7385_0%,#0f5562_100%)]',
    description: 'Aplicado automaticamente em áreas com fundo escuro.',
    helper: 'Padrão recomendado: SVG ou PNG com transparência.',
    kind: 'logoLight',
    title: 'Logotipo light',
  },
  {
    accept: '.svg,.png,.webp,.jpg,.jpeg,image/*',
    backgroundClassName: 'border-border bg-muted/40',
    description: 'Aplicado em cabeçalhos claros, admin e superfícies neutras.',
    helper: 'Padrão recomendado: SVG ou PNG com transparência.',
    kind: 'logoDark',
    title: 'Logotipo dark',
  },
  {
    accept: '.svg,.png,.ico,.jpg,.jpeg,image/*',
    backgroundClassName: 'border-border bg-muted/20',
    description: 'Usado na aba do navegador e em atalhos da plataforma.',
    helper: 'Padrão recomendado: PNG quadrado (512x512) ou ICO.',
    kind: 'favicon',
    title: 'Favicon',
  },
]

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return 'Tamanho não informado'
  }

  const kb = sizeBytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

function VisualAssetCard(props: {
  asset: VisualAssetItem | null
  isUploading: boolean
  meta: VisualAssetMeta
  onUpload: (file: File) => void
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Definição visual
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{props.meta.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{props.meta.description}</p>

      <div className={`mt-5 flex min-h-[132px] items-center justify-center overflow-hidden rounded-3xl border px-6 py-6 ${props.meta.backgroundClassName}`}>
        {props.asset ? (
          props.meta.kind === 'favicon' ? (
            <img
              alt={props.asset.name}
              className="h-16 w-16 rounded-2xl bg-background object-contain p-2 shadow-sm"
              src={props.asset.publicUrl}
            />
          ) : (
            <img
              alt={props.asset.name}
              className="max-h-16 w-auto max-w-full object-contain"
              src={props.asset.publicUrl}
            />
          )
        ) : (
          <span className="text-sm font-medium text-muted-foreground">Nenhum arquivo publicado</span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Arquivo atual</p>
          <p className="mt-2 truncate text-sm font-semibold text-foreground">
            {props.asset?.name ?? 'Nenhum arquivo'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(props.asset?.sizeBytes ?? null)}</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Enviar novo arquivo
          </span>
          <input
            accept={props.meta.accept}
            className="block w-full cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary"
            disabled={props.isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) {
                props.onUpload(file)
              }
            }}
            type="file"
          />
        </label>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          {props.meta.helper}
        </div>
      </div>
    </article>
  )
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [draftState, setDraftState] = useState<SettingsFormState | null>(null)
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>('operational')

  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const visualAssetsQuery = useQuery({
    queryKey: ['system-settings', 'visual-assets'],
    queryFn: fetchAdminVisualSettings,
  })

  const initialFormState = useMemo<SettingsFormState>(
    () =>
      settingsQuery.data
        ? {
            id: settingsQuery.data.id,
            allowGuestQuestions: settingsQuery.data.allowGuestQuestions,
            maintenanceMode: settingsQuery.data.maintenanceMode,
            seoDescriptionDefault: settingsQuery.data.seoDescriptionDefault ?? '',
            seoTitleDefault: settingsQuery.data.seoTitleDefault ?? '',
            siteName: settingsQuery.data.siteName,
            supportEmail: settingsQuery.data.supportEmail ?? '',
            supportPhone: settingsQuery.data.supportPhone ?? '',
          }
        : {
            id: '',
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

  const uploadMutation = useMutation({
    mutationFn: uploadAdminVisualAsset,
    onSuccess: async () => {
      setSuccessFeedback('Asset visual publicado com sucesso.')
      await queryClient.invalidateQueries({ queryKey: ['system-settings', 'visual-assets'] })
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível publicar o asset visual.')
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

  const visualAssets = visualAssetsQuery.data
  const visualPublishedCount = [visualAssets?.logoLight, visualAssets?.logoDark, visualAssets?.favicon].filter(Boolean).length

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              disabled={activeTab !== 'operational' || updateMutation.isPending}
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
        description="Parâmetros globais do produto, contatos institucionais e gestão visual da identidade da plataforma."
        eyebrow="Admin / configurações"
        title="Configurações globais"
      />

      <OperationFeedback feedback={feedback} />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <button
          className={activeTab === 'operational' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('operational')}
          type="button"
        >
          Operação
        </button>
        <button
          className={activeTab === 'visual' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('visual')}
          type="button"
        >
          Definições visuais
        </button>
      </div>

      {activeTab === 'operational' ? (
        <>
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
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Assets publicados" value={`${visualPublishedCount}/3`} />
            <AdminStatCard label="Seleção dinâmica" value="Automática" />
            <AdminStatCard label="Favicon" value={visualAssets?.favicon ? 'Ativo' : 'Pendente'} />
            <AdminStatCard
              label="Atualização"
              value={uploadMutation.isPending ? 'Publicando...' : 'Pronta'}
            />
          </div>

          <AdminFilterCard
            description="Envie os arquivos oficiais da marca. O sistema manterá sempre um único arquivo por tipo (light, dark e favicon)."
            title="Branding e logotipos"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Palette className="size-4 text-primary" />
                  Identidade visual
                </div>
                <p className="mt-2 text-xs">
                  Os arquivos devem seguir padrão institucional e boa legibilidade em desktop e mobile.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <ImagePlus className="size-4 text-primary" />
                  Publicação imediata
                </div>
                <p className="mt-2 text-xs">
                  O upload substitui automaticamente o arquivo anterior da mesma categoria visual.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Link2 className="size-4 text-primary" />
                  URL pública
                </div>
                <p className="mt-2 text-xs">
                  Cada asset fica disponível por URL pública no bucket <code>site-assets</code>.
                </p>
              </div>
            </div>
          </AdminFilterCard>

          {visualAssetsQuery.isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
              Não foi possível carregar os assets visuais atuais.
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-3">
            {visualAssetMetaList.map((meta) => (
              <VisualAssetCard
                asset={visualAssets ? visualAssets[meta.kind] : null}
                isUploading={uploadMutation.isPending && uploadMutation.variables?.kind === meta.kind}
                key={meta.kind}
                meta={meta}
                onUpload={(file) => {
                  clearFeedback()
                  uploadMutation.mutate({ file, kind: meta.kind })
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
