import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ExternalLink, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminFeaturedPayments, updateAsaasEnvironment, validateAsaasIntegration } from '@/domains/featured-payments/api'
import type { AdminFeaturedPaymentItem } from '@/domains/featured-payments/types'

type TabKey = 'config' | 'payments'
type PaymentStatusFilter = 'all' | AdminFeaturedPaymentItem['status']

const PAGE_SIZE = 10

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Nao informado'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Nao informado'
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getPaymentStatusMeta(status: AdminFeaturedPaymentItem['status']) {
  switch (status) {
    case 'paid':
      return { label: 'Pago', tone: 'success' as const }
    case 'pending':
      return { label: 'Pendente', tone: 'warning' as const }
    case 'expired':
      return { label: 'Expirado', tone: 'danger' as const }
    case 'canceled':
      return { label: 'Cancelado', tone: 'neutral' as const }
    case 'failed':
    default:
      return { label: 'Falhou', tone: 'danger' as const }
  }
}

export function AdminFeaturedPaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('payments')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all')

  const paymentsQuery = useQuery({
    queryKey: ['featured-payments', 'admin'],
    queryFn: fetchAdminFeaturedPayments,
  })

  const validationMutation = useMutation({
    mutationFn: validateAsaasIntegration,
  })
  const updateEnvironmentMutation = useMutation({
    mutationFn: updateAsaasEnvironment,
    onSuccess: () => {
      validationMutation.mutate()
    },
  })

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return (paymentsQuery.data ?? []).filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      const haystack = `${item.listing.title} ${item.user.name} ${item.asaasPaymentId}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [paymentsQuery.data, query, statusFilter])

  const paginatedPayments = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE
    return filteredPayments.slice(from, from + PAGE_SIZE)
  }, [filteredPayments, page])

  const stats = useMemo(() => {
    const items = paymentsQuery.data ?? []

    return {
      paid: items.filter((item) => item.status === 'paid').length,
      pending: items.filter((item) => item.status === 'pending').length,
      total: items.length,
      volumePaid: items
        .filter((item) => item.status === 'paid')
        .reduce((acc, item) => acc + item.amount, 0),
    }
  }, [paymentsQuery.data])

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <Button asChild type="button" variant="outline">
            <Link to={paths.admin.listings}>Anuncios</Link>
          </Button>
        }
        description="Controle operacional dos pagamentos de destaque e validacao de conectividade da integracao Asaas."
        eyebrow="Admin / pagamentos"
        title="Pagamentos de destaque"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <button
          className={activeTab === 'payments' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('payments')}
          type="button"
        >
          Pagamentos
        </button>
        <button
          className={activeTab === 'config' ? 'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground' : 'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'}
          onClick={() => setActiveTab('config')}
          type="button"
        >
          Configuracao Asaas
        </button>
      </div>

      {activeTab === 'payments' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Total de cobrancas" value={stats.total} />
            <AdminStatCard label="Pendentes" value={stats.pending} />
            <AdminStatCard label="Pagas" value={stats.paid} />
            <AdminStatCard label="Volume pago" value={formatCurrency(stats.volumePaid)} />
          </div>

          <AdminFilterCard
            actions={
              <Button
                onClick={() => {
                  setPage(1)
                  setQuery('')
                  setStatusFilter('all')
                }}
                type="button"
                variant="outline"
              >
                Limpar filtros
              </Button>
            }
            description="Filtre por status ou busque por anuncio, anunciante e id Asaas."
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <Input
                onChange={(event) => {
                  setPage(1)
                  setQuery(event.target.value)
                }}
                placeholder="Buscar por anuncio, anunciante ou id Asaas"
                value={query}
              />
              <Select
                onChange={(event) => {
                  setPage(1)
                  setStatusFilter(event.target.value as PaymentStatusFilter)
                }}
                value={statusFilter}
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="expired">Expirado</option>
                <option value="canceled">Cancelado</option>
                <option value="failed">Falhou</option>
              </Select>
            </div>
          </AdminFilterCard>

          <AdminDataTable
            columns={[
              {
                header: 'Anuncio',
                cell: (item) => (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.listing.title}</p>
                    <p className="text-xs text-muted-foreground">{item.user.name}</p>
                  </div>
                ),
              },
              {
                header: 'Valor',
                className: 'w-[140px]',
                cell: (item) => <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>,
              },
              {
                header: 'Status',
                className: 'w-[120px]',
                cell: (item) => {
                  const meta = getPaymentStatusMeta(item.status)
                  return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
                },
              },
              {
                header: 'Criado em',
                className: 'w-[160px]',
                cell: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</span>,
              },
              {
                header: 'Pago em',
                className: 'w-[160px]',
                cell: (item) => <span className="text-sm text-muted-foreground">{formatDateTime(item.paidAt)}</span>,
              },
              {
                header: 'Acoes',
                className: 'w-[220px] text-right',
                cell: (item) => (
                  <div className="flex justify-end gap-2">
                    {item.listing.slug ? (
                      <Button asChild size="sm" type="button" variant="ghost">
                        <Link to={paths.public.listingDetails(item.listing.slug)}>Publico</Link>
                      </Button>
                    ) : null}
                    {item.invoiceUrl ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <a href={item.invoiceUrl} rel="noreferrer" target="_blank">
                          <ExternalLink className="size-4" />
                          Cobranca
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            data={paginatedPayments}
            emptyDescription="Nao ha pagamentos de destaque para os filtros atuais."
            emptyTitle="Sem pagamentos"
            errorMessage="Nao foi possivel carregar os pagamentos de destaque."
            getRowKey={(item) => item.id}
            isError={paymentsQuery.isError}
            isLoading={paymentsQuery.isLoading}
            minWidth="min-w-[1100px]"
          />

          <AdminPagination
            currentPage={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredPayments.length}
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="API key"
              value={validationMutation.data?.config.apiKeyConfigured ? 'Configurada' : 'Nao configurada'}
            />
            <AdminStatCard label="Billing type" value={validationMutation.data?.config.billingType ?? '--'} />
            <AdminStatCard
              label="Preco destaque"
              value={
                typeof validationMutation.data?.config.featuredPrice === 'number'
                  ? formatCurrency(validationMutation.data.config.featuredPrice)
                  : '--'
              }
            />
            <AdminStatCard
              label="Conectividade"
              value={
                validationMutation.data
                  ? validationMutation.data.connectivity.ok
                    ? 'OK'
                    : 'Falha'
                  : 'Nao testado'
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Validacao da integracao Asaas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Execute um teste para validar variaveis de ambiente e conectividade do backend com a API do Asaas.
              </p>

              <div className="rounded-lg border border-border bg-muted/25 p-4">
                <p className="text-sm font-semibold text-foreground">Modo da integracao</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha o ambiente ativo da integracao. Voce pode alternar entre sandbox e producao.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={
                      updateEnvironmentMutation.isPending ||
                      validationMutation.isPending ||
                      validationMutation.data?.config.asaasEnvironment === 'sandbox'
                    }
                    onClick={() => updateEnvironmentMutation.mutate('sandbox')}
                    type="button"
                    variant={validationMutation.data?.config.asaasEnvironment === 'sandbox' ? 'default' : 'outline'}
                  >
                    Sandbox
                  </Button>
                  <Button
                    disabled={
                      updateEnvironmentMutation.isPending ||
                      validationMutation.isPending ||
                      validationMutation.data?.config.asaasEnvironment === 'production'
                    }
                    onClick={() => updateEnvironmentMutation.mutate('production')}
                    type="button"
                    variant={validationMutation.data?.config.asaasEnvironment === 'production' ? 'default' : 'outline'}
                  >
                    Producao
                  </Button>
                </div>
              </div>

              <Button
                disabled={validationMutation.isPending || updateEnvironmentMutation.isPending}
                onClick={() => validationMutation.mutate()}
                type="button"
              >
                <RefreshCcw className="size-4" />
                {validationMutation.isPending ? 'Validando...' : 'Validar integracao'}
              </Button>

              {updateEnvironmentMutation.isError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {updateEnvironmentMutation.error instanceof Error
                    ? updateEnvironmentMutation.error.message
                    : 'Falha ao atualizar o ambiente Asaas.'}
                </div>
              ) : null}

              {validationMutation.isError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {validationMutation.error instanceof Error
                    ? validationMutation.error.message
                    : 'Falha ao validar integracao.'}
                </div>
              ) : null}

              {validationMutation.data ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-semibold text-foreground">Resultado da conectividade</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {validationMutation.data.connectivity.ok
                        ? 'Conexao com Asaas validada com sucesso.'
                        : validationMutation.data.connectivity.errorMessage ?? 'Falha na validacao.'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Testado em {formatDateTime(validationMutation.data.connectivity.testedAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">Ambiente ativo</p>
                      <p className="mt-1 text-muted-foreground">
                        {validationMutation.data.config.asaasEnvironment === 'production' ? 'Producao' : 'Sandbox'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">ASAAS_API_URL</p>
                      <p className="mt-1 text-muted-foreground">{validationMutation.data.config.apiUrl}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">Webhook token</p>
                      <p className="mt-1 text-muted-foreground">
                        {validationMutation.data.config.webhookTokenConfigured ? 'Configurado' : 'Nao configurado'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm md:col-span-2">
                      <p className="font-medium text-foreground">URL do webhook Asaas</p>
                      <p className="mt-1 break-all text-muted-foreground">
                        {validationMutation.data.config.webhookUrl}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">Due days</p>
                      <p className="mt-1 text-muted-foreground">{validationMutation.data.config.dueDays}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">API key</p>
                      <p className="mt-1 text-muted-foreground">
                        {validationMutation.data.config.apiKeyConfigured ? 'Configurada' : 'Nao configurada'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
