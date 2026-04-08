import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCcw, Upload } from 'lucide-react'
import { PricingChart } from '@/components/pricing/pricing-chart'
import { PricingHistoryTable } from '@/components/pricing/pricing-history-table'
import { PricingManualPriceForm } from '@/components/pricing/pricing-manual-price-form'
import { PricingManualSnapshotForm } from '@/components/pricing/pricing-manual-snapshot-form'
import { PricingUpdateOverview } from '@/components/pricing/pricing-update-overview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  deleteScrapPriceEntry,
  fetchAdminPricingDashboard,
  runPricingSync,
  saveManualLmeSnapshots,
  upsertScrapPriceEntry,
} from '@/domains/pricing/api'
import type { ManualSnapshotFormValues, ScrapPriceEntryFormValues } from '@/domains/pricing/schemas'
import type { ScrapPriceEntry } from '@/domains/pricing/types'
import { formatPricingDate, formatPricingNumber } from '@/domains/pricing/utils'

function toEntryFormValues(entry?: ScrapPriceEntry): ScrapPriceEntryFormValues {
  return {
    effectiveDate: entry?.effectiveDate ?? new Date().toISOString().slice(0, 10),
    isActive: entry?.isActive ?? true,
    materialName: entry?.materialName ?? '',
    priceLabel: entry?.priceLabel ?? '',
    priceNumeric: typeof entry?.priceNumeric === 'number' ? String(entry.priceNumeric).replace('.', ',') : '',
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
  const [monthKey, setMonthKey] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<ScrapPriceEntry | null>(null)

  const pricingQuery = useQuery({
    queryKey: ['pricing', 'admin', monthKey],
    queryFn: () => fetchAdminPricingDashboard(monthKey || undefined),
  })

  useEffect(() => {
    if (!monthKey && pricingQuery.data?.selectedMonthKey) {
      setMonthKey(pricingQuery.data.selectedMonthKey)
    }
  }, [monthKey, pricingQuery.data?.selectedMonthKey])

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
      setFeedback(`Sincronizacao concluida com ${result.inserted} snapshots.`)
      await invalidatePricing()
    },
  })

  const backfillMutation = useMutation({
    mutationFn: () => runPricingSync('backfill'),
    onSuccess: async (result) => {
      setFeedback(`Backfill historico concluido com ${result.inserted} snapshots.`)
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
  const sortedManualEntries = useMemo(
    () =>
      [...(pricingQuery.data?.manualEntries ?? [])].sort((left, right) =>
        left.effectiveDate < right.effectiveDate ? 1 : left.effectiveDate > right.effectiveDate ? -1 : 0,
      ),
    [pricingQuery.data?.manualEntries],
  )

  if (pricingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando gestao de precos...
        </CardContent>
      </Card>
    )
  }

  if (pricingQuery.isError || !pricingQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar o modulo de precos.
        </CardContent>
      </Card>
    )
  }

  const data = pricingQuery.data

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Admin / precos
            </p>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
              Operacao da tabela de precos
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              Gerencie referencias manuais de sucata, snapshots diarios LME, backfill historico e a
              sincronizacao com providers publicos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
              {backfillMutation.isPending ? 'Importando...' : 'Backfill historico'}
            </Button>
          </div>
        </div>
      </div>

      {feedback ? (
        <Card className="border-emerald-200/70 bg-emerald-50">
          <CardContent className="p-5 text-sm text-emerald-900">{feedback}</CardContent>
        </Card>
      ) : null}

      <PricingUpdateOverview
        lastManualUpdate={data.lastManualUpdate}
        latestQuotedDate={data.latestQuotedDate}
        latestValues={data.latestValues}
        snapshotCount={data.snapshotCount}
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <PricingChart series={data.chartSeries} />

        <Card>
          <CardHeader>
            <CardTitle>Janela analisada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setMonthKey(event.target.value)}
              value={data.selectedMonthKey ?? ''}
            >
              {data.periods.map((period) => (
                <option key={period.monthKey} value={period.monthKey}>
                  {period.monthLabel}
                </option>
              ))}
            </select>

            <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Ultimo dia no periodo:</span>{' '}
                {formatPricingDate(
                  data.periods.find((period) => period.monthKey === data.selectedMonthKey)?.lastQuotedDate ?? null,
                )}
              </p>
              <p>
                <span className="font-medium text-foreground">Snapshots carregados:</span>{' '}
                {data.snapshotCount}
              </p>
              <p>
                <span className="font-medium text-foreground">Provider atual:</span> Westmetall +
                AwesomeAPI
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingHistoryTable rows={data.historyRows} title="Historico do periodo selecionado" />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Entradas manuais publicas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedManualEntries.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Nenhuma entrada manual cadastrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[780px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-emerald-600 text-left text-white">
                      <th className="px-4 py-3 font-semibold">Material</th>
                      <th className="px-4 py-3 font-semibold">Preco</th>
                      <th className="px-4 py-3 font-semibold">Vigencia</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedManualEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/60">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{entry.materialName}</span>
                            <span className="text-xs text-muted-foreground">{entry.regionName ?? 'Brasil'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{entry.priceLabel}</span>
                            {typeof entry.priceNumeric === 'number' ? (
                              <span className="text-xs text-muted-foreground">
                                {formatPricingNumber(entry.priceNumeric, 2)} {entry.priceUnit ?? ''}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatPricingDate(entry.effectiveDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {entry.isActive ? 'Ativo' : 'Inativo'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => setEditingEntry(entry)} size="sm" type="button" variant="outline">
                              Editar
                            </Button>
                            <Button
                              disabled={deletePriceMutation.isPending}
                              onClick={() => deletePriceMutation.mutate(entry.id)}
                              size="sm"
                              type="button"
                              variant="destructive"
                            >
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Snapshots recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentSnapshots.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                Ainda nao existem snapshots LME gravados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-emerald-600 text-left text-white">
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Serie</th>
                      <th className="px-4 py-3 font-semibold">Valor</th>
                      <th className="px-4 py-3 font-semibold">Moeda</th>
                      <th className="px-4 py-3 font-semibold">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSnapshots.map((snapshot) => (
                      <tr key={snapshot.id} className="border-b border-border/60">
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatPricingDate(snapshot.quotedDate)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{snapshot.metalName}</td>
                        <td className="px-4 py-3 text-foreground">
                          {formatPricingNumber(snapshot.priceValue, 2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{snapshot.currencyCode}</td>
                        <td className="px-4 py-3 text-muted-foreground">{snapshot.providerName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
