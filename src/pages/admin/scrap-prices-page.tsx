import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchAdminScrapPrices, upsertScrapPrice, deleteScrapPrice } from '@/domains/scrap-prices/api'
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

export function AdminScrapPricesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

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

  const items = useMemo(() => pricesQuery.data ?? [], [pricesQuery.data])

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
          <Button onClick={openCreateModal} type="button">
            <Plus className="size-4" />
            Novo item
          </Button>
        }
        description="CRUD operacional para os produtos e preços exibidos na página pública de Preço das Sucatas."
        eyebrow="Administração / preço das sucatas"
        title="Preço das Sucatas"
      />

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

