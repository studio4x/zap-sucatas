import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminMaterialForm } from '@/components/admin/admin-material-form'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  createAdminMaterial,
  deleteAdminMaterial,
  fetchAdminMaterials,
  updateAdminMaterial,
} from '@/domains/categories/api'
import type { AdminMaterialFormValues } from '@/domains/categories/schemas'
import type { AdminListingMaterial } from '@/domains/categories/types'

const PAGE_SIZE = 10

type FeedbackState = {
  message: string
  tone: 'error' | 'success' | 'warning'
}

const emptyMaterialValues: AdminMaterialFormValues = {
  isActive: true,
  name: '',
  slug: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function materialToFormValues(material: AdminListingMaterial): AdminMaterialFormValues {
  return {
    isActive: material.isActive,
    name: material.name,
    slug: material.slug,
  }
}

export function AdminMaterialsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<AdminListingMaterial | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const materialsQuery = useQuery({
    queryKey: ['materials', 'admin'],
    queryFn: fetchAdminMaterials,
  })

  async function invalidateMaterials() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['materials'] }),
      queryClient.invalidateQueries({ queryKey: ['listing-references'] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (values: AdminMaterialFormValues) => {
      if (editingMaterial) {
        return updateAdminMaterial({
          materialId: editingMaterial.id,
          values,
        })
      }

      return createAdminMaterial(values)
    },
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível salvar o material.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: editingMaterial ? 'Material atualizado com sucesso.' : 'Material criado com sucesso.',
        tone: 'success',
      })
      setEditingMaterial(null)
      setIsFormModalOpen(false)
      await invalidateMaterials()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminMaterial,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível excluir o material.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Material removido com sucesso.',
        tone: 'warning',
      })
      setEditingMaterial(null)
      await invalidateMaterials()
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (material: AdminListingMaterial) =>
      updateAdminMaterial({
        materialId: material.id,
        values: {
          isActive: !material.isActive,
          name: material.name,
          slug: material.slug,
        },
      }),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível atualizar o status do material.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Status do material atualizado com sucesso.',
        tone: 'success',
      })
      await invalidateMaterials()
    },
  })

  const materials = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data])
  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return materials.filter((material) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? material.isActive
            : !material.isActive
      const haystack = `${material.name} ${material.slug}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [materials, query, statusFilter])

  const paginatedMaterials = useMemo(
    () => filteredMaterials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMaterials, page],
  )

  const stats = useMemo(
    () => ({
      active: materials.filter((material) => material.isActive).length,
      pending: materials.filter((material) => material.pendingListings > 0).length,
      total: materials.length,
      withListings: materials.filter((material) => material.totalListings > 0).length,
    }),
    [materials],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              onClick={() => {
                setEditingMaterial(null)
                setFeedback(null)
                setIsFormModalOpen(true)
              }}
              type="button"
            >
              <Plus className="size-4" />
              Novo material
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.pricing}>Preços</Link>
            </Button>
          </>
        }
        description="Materiais centrais do domínio, usados em anúncios, filtros e referências comerciais."
        eyebrow="Admin / materiais"
        title="Gestão de materiais"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Ativos" value={stats.active} />
        <AdminStatCard label="Com anúncios" value={stats.withListings} />
        <AdminStatCard label="Com pendências" value={stats.pending} />
      </div>

      {feedback ? (
        <div
          className={
            feedback.tone === 'error'
              ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm'
              : feedback.tone === 'warning'
                ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm'
                : 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm'
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-6">
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
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              onChange={(event) => {
                setPage(1)
                setQuery(event.target.value)
              }}
              placeholder="Buscar por nome ou slug"
              value={query}
            />
            <Select
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value as typeof statusFilter)
              }}
              value={statusFilter}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </Select>
          </div>
        </AdminFilterCard>

        <AdminDataTable
            columns={[
              {
                header: 'Material',
                cell: (material) => (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{material.name}</p>
                    <p className="text-xs text-muted-foreground">{material.slug}</p>
                  </div>
                ),
              },
              {
                header: 'Status',
                cell: (material) => (
                  <AdminStatusBadge tone={material.isActive ? 'success' : 'neutral'}>
                    {material.isActive ? 'Ativo' : 'Inativo'}
                  </AdminStatusBadge>
                ),
              },
              {
                header: 'Uso',
                cell: (material) => (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{material.totalListings} anúncios</p>
                    <p>{material.approvedListings} aprovados</p>
                    <p>{material.pendingListings} pendentes</p>
                  </div>
                ),
              },
              {
                header: 'Atualizado',
                cell: (material) => <span className="text-sm text-muted-foreground">{formatDate(material.updatedAt)}</span>,
              },
              {
                header: 'Ações',
                className: 'w-[260px] text-right',
                cell: (material) => (
                  <AdminRowActions
                    actions={[
                      {
                        icon: Pencil,
                        label: 'Editar',
                        onClick: () => {
                          setEditingMaterial(material)
                          setFeedback(null)
                          setIsFormModalOpen(true)
                        },
                      },
                      {
                        label: material.isActive ? 'Inativar' : 'Reativar',
                        onClick: () => toggleActiveMutation.mutate(material),
                        variant: 'outline',
                      },
                      {
                        icon: Trash2,
                        label: 'Excluir',
                        onClick: () => {
                          if (
                            window.confirm(
                              'Excluir este material só é permitido quando não houver anúncios vinculados. Deseja continuar?',
                            )
                          ) {
                            deleteMutation.mutate(material.id)
                          }
                        },
                        variant: 'destructive',
                      },
                    ]}
                  />
                ),
              },
            ]}
            data={paginatedMaterials}
            emptyDescription="Nenhum material corresponde aos filtros atuais."
            emptyTitle="Sem materiais neste recorte"
            errorMessage="Não foi possível carregar os materiais."
            getRowKey={(material) => material.id}
            isError={materialsQuery.isError}
            isLoading={materialsQuery.isLoading}
          />

        <AdminPagination
          currentPage={page}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredMaterials.length}
        />
      </div>

      {isFormModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de material"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!saveMutation.isPending) {
                setIsFormModalOpen(false)
              }
            }}
            type="button"
          />
          <div className="relative w-full max-w-2xl rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <p className="text-sm font-semibold text-foreground">
              {editingMaterial ? 'Editar material' : 'Novo material'}
            </p>
            <div className="mt-4">
              <AdminMaterialForm
                defaultValues={editingMaterial ? materialToFormValues(editingMaterial) : emptyMaterialValues}
                isPending={saveMutation.isPending}
                onCancel={() => {
                  setEditingMaterial(null)
                  setIsFormModalOpen(false)
                }}
                onSubmit={(values) => saveMutation.mutate(values)}
                submitLabel={editingMaterial ? 'Atualizar material' : 'Criar material'}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
