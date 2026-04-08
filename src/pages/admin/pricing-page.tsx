import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCcw, Upload } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { PricingChart } from '@/components/pricing/pricing-chart'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { PricingManualPriceForm } from '@/components/pricing/pricing-manual-price-form'
import { PricingManualSnapshotForm } from '@/components/pricing/pricing-manual-snapshot-form'
import { PricingUpdateOverview } from '@/components/pricing/pricing-update-overview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  deleteScrapPriceEntry,
  fetchAdminPricingDashboard,
  runPricingSync,
  saveManualLmeSnapshots,
  upsertScrapPriceEntry,
} from '@/domains/pricing/api'
import type { ManualSnapshotFormValues, ScrapPriceEntryFormValues } from '@/domains/pricing/schemas'
import type { LmePriceSnapshot, ScrapPriceEntry } from '@/domains/pricing/types'
import { formatPricingDate, formatPricingNumber } from '@/domains/pricing/utils'

const MANUAL_PAGE_SIZE = 8
const SNAPSHOT_PAGE_SIZE = 10

function toEntryFormValues(entry?: ScrapPriceEntry): ScrapPriceEntryFormValues {
  return {
    effectiveDate: entry?.effectiveDate ?? new Date().toISOString().slice(0, 10),
    isActive: entry?.isActive ?? true,
    materialName: entry?.materialName ?? '',
    priceLabel: entry?.priceLabel ?? '',
    priceNumeric:
      typeof entry?.priceNumeric === 'number' ? String(entry.priceNumeric).replace('.', ',') : '',
    priceUnit: entry?.priceUnit ?? '',
    regionName: entry?.regionName ?? '',
  }
}

function toSnapshotFormValues(): ManualSnapshotFormValues {
  return {
    providerName: 'manual_admin',
    quotedDate: new Date().toISOString().slice(0, 10),
    values: {
      AL: '',
      CU: '',
      NI: '',
      PB: '',
      SN: '',
      USD: '',
      ZN: '',
    },
  }
}

export function AdminPricingPage() {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<ScrapPriceEntry | null>(null)
  const [manualQuery, setManualQuery] = useState('')
  const [manualStatusFilter, setManualStatusFilter] = useState<'active' | 'all' | 'inactive'>('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [manualPage, setManualPage] = useState(1)
  const [snapshotPage, setSnapshotPage] = useState(1)

  const pricingQuery = useQuery({
    queryKey: ['pricing', 'admin'],
    queryFn: fetchAdminPricingDashboard,
  })

  const invalidatePricing = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pricing', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['pricing', 'public'] }),
    ])
  }

  const savePriceMutation = useMutation({
    mutationFn: async (values: ScrapPriceEntryFormValues) =>
      upsertScrapPriceEntry({
        ...values,
        id: editingEntry?.id,
      }),
    onSuccess: async () => {
      setFeedback(editingEntry ? 'Entrada manual atualizada com sucesso.' : 'Entrada manual criada com sucesso.')
      setEditingEntry(null)
      await invalidatePricing()
    },
  })

  const deletePriceMutation = useMutation({
    mutationFn: deleteScrapPriceEntry,
    onSuccess: async () => {
      setFeedback('Entrada manual removida com sucesso.')
      setEditingEntry(null)
      await invalidatePricing()
    },
  })

  const saveSnapshotMutation = useMutation({
    mutationFn: saveManualLmeSnapshots,
    onSuccess: async () => {
      setFeedback('Snapshot manual registrado com sucesso.')
      await invalidatePricing()
    },
  })

  const latestSyncMutation = useMutation({
    mutationFn: () => runPricingSync('latest'),
    onSuccess: async (result) => {
      setFeedback(`Sincronização concluída com ${result.inserted} snapshots.`)
      await invalidatePricing()
    },
  })

  const backfillMutation = useMutation({
    mutationFn: () => runPricingSync('backfill'),
    onSuccess: async (result) => {
      setFeedback(`Backfill histórico concluído com ${result.inserted} snapshots.`)
      await invalidatePricing()
    },
  })

  const isBusy =
    savePriceMutation.isPending ||
    deletePriceMutation.isPending ||
    saveSnapshotMutation.isPending ||
    latestSyncMutation.isPending ||
    backfillMutation.isPending

  const manualPriceDefaults = useMemo(
    () => toEntryFormValues(editingEntry ?? undefined),
    [editingEntry],
  )
  const manualSnapshotDefaults = useMemo(() => toSnapshotFormValues(), [])

  if (pricingQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando gestão de preços...
      </div>
    )
  }

  if (pricingQuery.isError || !pricingQuery.data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm">
        Não foi possível carregar o módulo de preços.
      </div>
    )
  }

  const data = pricingQuery.data
  const providerOptions = ['all', ...new Set(data.recentSnapshots.map((snapshot) => snapshot.providerName))]
  const filteredManualEntries = data.manualEntries.filter((entry) => {
    const normalizedQuery = manualQuery.trim().toLowerCase()
    const matchesQuery =
      normalizedQuery.length === 0
        ? true
        : `${entry.materialName} ${entry.regionName ?? ''} ${entry.priceLabel}`.toLowerCase().includes(normalizedQuery)
    const matchesStatus =
      manualStatusFilter === 'all'
        ? true
        : manualStatusFilter === 'active'
          ? entry.isActive
          : !entry.isActive

    return matchesQuery && matchesStatus
  })
  const filteredSnapshots = data.recentSnapshots.filter((snapshot) =>
    providerFilter === 'all' ? true : snapshot.providerName === providerFilter,
  )
  const paginatedManualEntries = filteredManualEntries.slice(
    (manualPage - 1) * MANUAL_PAGE_SIZE,
    manualPage * MANUAL_PAGE_SIZE,
  )
  const paginatedSnapshots = filteredSnapshots.slice(
    (snapshotPage - 1) * SNAPSHOT_PAGE_SIZE,
    snapshotPage * SNAPSHOT_PAGE_SIZE,
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button disabled={isBusy} onClick={() => latestSyncMutation.mutate()} type="button">
              <RefreshCcw className="size-4" />
              {latestSyncMutation.isPending ? 'Sincronizando...' : 'Sincronizar agora'}
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => backfillMutation.mutate()}
              type="button"
              variant="outline"
            >
              <Upload className="size-4" />
              {backfillMutation.isPending ? 'Importando...' : 'Backfill histórico'}
            </Button>
          </>
        }
        description="Gerencie referências públicas, snapshots diários, sincronização e fallback manual sem depender de plugins externos."
        eyebrow="Admin / preços"
        title="Operação da tabela de preços"
      />

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <PricingUpdateOverview
        historySnapshotCount={data.historySnapshotCount}
        historyWindowLabel={data.historyWindowLabel}
        lastManualUpdate={data.lastManualUpdate}
        latestQuotedDate={data.latestQuotedDate}
        latestValues={data.latestValues}
      />

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setManualQuery('')
              setManualStatusFilter('all')
              setProviderFilter('all')
              setManualPage(1)
              setSnapshotPage(1)
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Os filtros controlam tanto a tabela manual quanto a lista de snapshots recentes."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_220px]">
          <Input
            onChange={(event) => {
              setManualPage(1)
              setManualQuery(event.target.value)
            }}
            placeholder="Buscar entrada manual por material, região ou rótulo"
            value={manualQuery}
          />
          <Select
            onChange={(event) => {
              setManualPage(1)
              setManualStatusFilter(event.target.value as typeof manualStatusFilter)
            }}
            value={manualStatusFilter}
          >
            <option value="all">Todas as entradas</option>
            <option value="active">Apenas ativas</option>
            <option value="inactive">Apenas inativas</option>
          </Select>
          <Select
            onChange={(event) => {
              setSnapshotPage(1)
              setProviderFilter(event.target.value)
            }}
            value={providerFilter}
          >
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider === 'all' ? 'Todos os providers' : provider}
              </option>
            ))}
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Material',
            cell: (entry) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{entry.materialName}</p>
                <p className="text-xs text-muted-foreground">{entry.regionName ?? 'Brasil'}</p>
              </div>
            ),
          },
          {
            header: 'Preco',
            cell: (entry) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{entry.priceLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {typeof entry.priceNumeric === 'number'
                    ? `${formatPricingNumber(entry.priceNumeric, 2)} ${entry.priceUnit ?? ''}`
                    : 'Sem valor numerico'}
                </p>
              </div>
            ),
          },
          {
            header: 'Vigencia',
            cell: (entry) => (
              <span className="text-sm text-muted-foreground">{formatPricingDate(entry.effectiveDate)}</span>
            ),
          },
          {
            header: 'Status',
            cell: (entry) => (
              <AdminStatusBadge tone={entry.isActive ? 'success' : 'neutral'}>
                {entry.isActive ? 'Ativa' : 'Inativa'}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[200px] text-right',
            cell: (entry) => (
              <AdminRowActions
                actions={[
                  {
                    label: 'Editar',
                    onClick: () => setEditingEntry(entry),
                  },
                  {
                    disabled: deletePriceMutation.isPending,
                    label: 'Remover',
                    onClick: () => deletePriceMutation.mutate(entry.id),
                    variant: 'destructive',
                  },
                ]}
              />
            ),
          },
        ]}
        data={paginatedManualEntries}
        emptyDescription="Nenhuma entrada manual foi encontrada com os filtros atuais."
        emptyTitle="Sem referências manuais"
        getRowKey={(entry) => entry.id}
      />

      <AdminPagination
        currentPage={manualPage}
        onPageChange={setManualPage}
        pageSize={MANUAL_PAGE_SIZE}
        totalItems={filteredManualEntries.length}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <PricingChart series={data.chartSeries} />

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Janela operacional</p>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Tabela historica:</span> {data.historyWindowLabel}
            </p>
            <p>
              <span className="font-medium text-foreground">Grafico:</span> {data.chartWindowLabel}
            </p>
            <p>
              <span className="font-medium text-foreground">Última data consolidada:</span>{' '}
              {formatPricingDate(data.latestQuotedDate)}
            </p>
            <p>
              <span className="font-medium text-foreground">Providers atuais:</span> Westmetall e Banco Central PTAX
            </p>
          </div>
        </div>
      </div>

      <PricingHistoryTable
        rows={data.historyRows}
        title="Histórico consolidado dos últimos 6 meses"
      />

      <AdminDataTable
        columns={[
          {
            header: 'Data',
            cell: (snapshot: LmePriceSnapshot) => (
              <span className="text-sm text-muted-foreground">{formatPricingDate(snapshot.quotedDate)}</span>
            ),
          },
          {
            header: 'Serie',
            cell: (snapshot: LmePriceSnapshot) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{snapshot.metalName}</p>
                <p className="text-xs text-muted-foreground">{snapshot.metalCode}</p>
              </div>
            ),
          },
          {
            header: 'Valor',
            cell: (snapshot: LmePriceSnapshot) => (
              <span className="text-sm text-foreground">
                {formatPricingNumber(snapshot.priceValue, 2)}
              </span>
            ),
          },
          {
            header: 'Moeda',
            cell: (snapshot: LmePriceSnapshot) => (
              <span className="text-sm text-muted-foreground">{snapshot.currencyCode}</span>
            ),
          },
          {
            header: 'Provider',
            cell: (snapshot: LmePriceSnapshot) => (
              <AdminStatusBadge tone="info">{snapshot.providerName}</AdminStatusBadge>
            ),
          },
        ]}
        data={paginatedSnapshots}
        emptyDescription="Ainda não existem snapshots recentes para o provider selecionado."
        emptyTitle="Sem snapshots recentes"
        getRowKey={(snapshot) => snapshot.id}
      />

      <AdminPagination
        currentPage={snapshotPage}
        onPageChange={setSnapshotPage}
        pageSize={SNAPSHOT_PAGE_SIZE}
        totalItems={filteredSnapshots.length}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <PricingManualPriceForm
          defaultValues={manualPriceDefaults}
          isPending={savePriceMutation.isPending}
          onCancel={editingEntry ? () => setEditingEntry(null) : undefined}
          onSubmit={(values) => savePriceMutation.mutate(values)}
          submitLabel={editingEntry ? 'Atualizar entrada manual' : 'Criar entrada manual'}
        />

        <PricingManualSnapshotForm
          defaultValues={manualSnapshotDefaults}
          isPending={saveSnapshotMutation.isPending}
          onSubmit={(values) => saveSnapshotMutation.mutate(values)}
        />
      </div>
    </section>
  )
}
