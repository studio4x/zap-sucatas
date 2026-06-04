import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Pencil, Plus, Upload, Trash2, TriangleAlert, X } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteScrapPrice, fetchAdminScrapPrices, upsertScrapPrice, upsertScrapPrices } from '@/domains/scrap-prices/api'
import {
  downloadScrapPricesWorkbook,
  parseScrapPricesWorkbook,
  type ScrapPriceImportIssue,
  type ScrapPriceSpreadsheetRow,
} from '@/domains/scrap-prices/spreadsheet'
import type { ScrapPriceItem } from '@/domains/scrap-prices/types'

type FormState = {
  id?: string
  isActive: boolean
  priceLabel: string
  productName: string
  quantityLabel: string
  sortOrder: string
}

const emptyForm: FormState = {
  isActive: true,
  priceLabel: '',
  productName: '',
  quantityLabel: '',
  sortOrder: '0',
}

type ImportPreviewState = {
  fileName: string
  issues: ScrapPriceImportIssue[]
  rows: ScrapPriceSpreadsheetRow[]
}

export function AdminScrapPricesPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  )

  const pricesQuery = useQuery({
    queryKey: ['scrap-prices', 'admin'],
    queryFn: fetchAdminScrapPrices,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertScrapPrice({
        id: form.id,
        isActive: form.isActive,
        priceLabel: form.priceLabel,
        productName: form.productName,
        quantityLabel: form.quantityLabel,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    onSuccess: async () => {
      setIsModalOpen(false)
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ['scrap-prices'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteScrapPrice(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scrap-prices'] })
    },
  })

  const importMutation = useMutation({
    mutationFn: (items: ScrapPriceSpreadsheetRow[]) => upsertScrapPrices({ items }),
    onSuccess: async (result) => {
      setImportPreview(null)
      setFeedbackMessage({
        tone: 'success',
        text: `${result.count} item(ns) importado(s) com sucesso.`,
      })
      await queryClient.invalidateQueries({ queryKey: ['scrap-prices'] })
    },
    onError: (error) => {
      setFeedbackMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível importar a planilha.',
      })
    },
  })

  const items = useMemo(() => pricesQuery.data ?? [], [pricesQuery.data])
  const importIssueCount = importPreview?.issues.length ?? 0
  const importRowCount = importPreview?.rows.length ?? 0

  const hasValidImportRows = importRowCount > 0 && importIssueCount === 0

  async function handleExport() {
    setFeedbackMessage(null)

    try {
      await downloadScrapPricesWorkbook(items)
      setFeedbackMessage({
        tone: 'success',
        text: 'Planilha exportada com os itens atuais.',
      })
    } catch (error) {
      setFeedbackMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível exportar a planilha.',
      })
    }
  }

  async function handleImportFile(file: File) {
    setFeedbackMessage(null)

    try {
      const preview = await parseScrapPricesWorkbook(file)

      if (preview.rows.length === 0) {
        throw new Error('A planilha não contém linhas válidas para importação.')
      }

      setImportPreview({
        fileName: preview.fileName,
        issues: preview.issues,
        rows: preview.rows,
      })

      if (preview.issues.length > 0) {
        setFeedbackMessage({
          tone: 'error',
          text: 'A planilha possui linhas inválidas. Corrija os campos destacados antes de importar.',
        })
      } else {
        setFeedbackMessage({
          tone: 'info',
          text: `Arquivo ${preview.fileName} carregado. Revise os itens e confirme a importação.`,
        })
      }
    } catch (error) {
      setImportPreview(null)
      setFeedbackMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível ler a planilha enviada.',
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function openCreateModal() {
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(item: ScrapPriceItem) {
    setForm({
      id: item.id,
      isActive: item.isActive,
      priceLabel: item.priceLabel,
      productName: item.productName,
      quantityLabel: item.quantityLabel,
      sortOrder: String(item.sortOrder),
    })
    setIsModalOpen(true)
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button disabled={items.length === 0 || pricesQuery.isLoading} onClick={handleExport} type="button" variant="outline">
              <Download className="size-4" />
              Exportar XLSX
            </Button>
            <Button
              disabled={importMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Importar XLSX
            </Button>
            <Button onClick={openCreateModal} type="button">
              <Plus className="size-4" />
              Novo item
            </Button>
          </>
        }
        description="CRUD operacional para os produtos e preços exibidos na página pública de Preço das Sucatas."
        eyebrow="Administração / preço das sucatas"
        title="Preço das Sucatas"
      />

      <input
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleImportFile(file)
        }}
        ref={fileInputRef}
        type="file"
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileSpreadsheet className="size-4 text-primary" />
              Importação e exportação por XLSX
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Exporte a tabela atual para editar em lote e reimporte o arquivo. A importação faz upsert por{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">id</code> quando disponível,
              atualiza ordem, preço, quantidade e status, e não remove itens ausentes da planilha.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted/50 px-3 py-1">Cabeçalho: ID, Ordem, Produto, Preço, Quantidade, Ativo</span>
            <span className="rounded-full border border-border bg-muted/50 px-3 py-1">Planilha compatível com Excel e LibreOffice</span>
          </div>
        </div>

        {feedbackMessage ? (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              feedbackMessage.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : feedbackMessage.tone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-sky-200 bg-sky-50 text-sky-800'
            }`}
          >
            {feedbackMessage.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : feedbackMessage.tone === 'error' ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            ) : (
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0" />
            )}
            <p>{feedbackMessage.text}</p>
          </div>
        ) : null}

        {importPreview ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{importPreview.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {importRowCount} linha(s) pronta(s) para importação
                  {importIssueCount > 0 ? `, ${importIssueCount} erro(s) encontrado(s)` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!hasValidImportRows || importMutation.isPending}
                  onClick={() => importMutation.mutate(importPreview.rows)}
                  type="button"
                >
                  {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Importar planilha
                </Button>
                <Button
                  onClick={() => {
                    setImportPreview(null)
                    setFeedbackMessage(null)
                  }}
                  type="button"
                  variant="outline"
                >
                  <X className="size-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
              <div className="rounded-lg bg-muted/45 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.08em]">Linhas válidas</p>
                <p className="mt-1 text-base font-semibold text-foreground">{importRowCount}</p>
              </div>
              <div className="rounded-lg bg-muted/45 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.08em]">Itens com ID</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {importPreview.rows.filter((row) => Boolean(row.id)).length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/45 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.08em]">Itens novos</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {importPreview.rows.filter((row) => !row.id).length}
                </p>
              </div>
            </div>

            {importPreview.issues.length > 0 ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Corrija estas linhas antes de importar</p>
                <ul className="mt-2 grid gap-1">
                  {importPreview.issues.slice(0, 8).map((issue) => (
                    <li key={`${issue.row}-${issue.message}`}>
                      Linha {issue.row}: {issue.message}
                    </li>
                  ))}
                </ul>
                {importPreview.issues.length > 8 ? (
                  <p className="mt-2 text-xs text-rose-600">Outras {importPreview.issues.length - 8} linha(s) também possuem erro.</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                A planilha está pronta para importação.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <AdminDataTable
        columns={[
          { header: 'Ordem', className: 'w-[80px]', cell: (item) => <span>{item.sortOrder}</span> },
          { header: 'Produto', cell: (item) => <span className="font-medium text-foreground">{item.productName}</span> },
          { header: 'Preço', cell: (item) => <span>{item.priceLabel}</span> },
          { header: 'Quantidade', cell: (item) => <span className="text-muted-foreground">{item.quantityLabel}</span> },
          {
            header: 'Status',
            className: 'w-[120px]',
            cell: (item) => (
              <AdminStatusBadge tone={item.isActive ? 'success' : 'neutral'}>
                {item.isActive ? 'Ativo' : 'Inativo'}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[220px] text-right',
            cell: (item) => (
              <AdminRowActions
                actions={[
                  { icon: Pencil, label: 'Editar', onClick: () => openEditModal(item) },
                  {
                    icon: Trash2,
                    label: 'Excluir',
                    onClick: () => deleteMutation.mutate(item.id),
                    variant: 'destructive',
                  },
                ]}
              />
            ),
          },
        ]}
        data={items}
        emptyDescription="Cadastre itens para exibir preços e quantidades na página pública."
        emptyTitle="Sem itens cadastrados"
        errorMessage="Não foi possível carregar os preços das sucatas."
        getRowKey={(item) => item.id}
        isError={pricesQuery.isError}
        isLoading={pricesQuery.isLoading}
      />

      {isModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de preço de sucata"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!saveMutation.isPending) setIsModalOpen(false)
            }}
            type="button"
          />
          <div className="relative w-full max-w-xl rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <p className="text-sm font-semibold text-foreground">{form.id ? 'Editar item' : 'Novo item'}</p>
            <div className="mt-4 grid gap-3">
              <Input placeholder="Produto" value={form.productName} onChange={(e) => setForm((c) => ({ ...c, productName: e.target.value }))} />
              <Input placeholder="Preço" value={form.priceLabel} onChange={(e) => setForm((c) => ({ ...c, priceLabel: e.target.value }))} />
              <Input placeholder="Quantidade" value={form.quantityLabel} onChange={(e) => setForm((c) => ({ ...c, quantityLabel: e.target.value }))} />
              <Input placeholder="Ordem" type="number" value={form.sortOrder} onChange={(e) => setForm((c) => ({ ...c, sortOrder: e.target.value }))} />
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input checked={form.isActive} onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} type="checkbox" />
                Ativo
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button onClick={() => setIsModalOpen(false)} type="button" variant="outline">
                Cancelar
              </Button>
              <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

