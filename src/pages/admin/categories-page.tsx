import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminCategoryForm } from '@/components/admin/admin-category-form'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  reorderAdminCategories,
  updateAdminCategory,
} from '@/domains/categories/api'
import type { AdminCategoryFormValues } from '@/domains/categories/schemas'
import type { AdminListingCategory } from '@/domains/categories/types'

const PAGE_SIZE = 10

type FeedbackState = {
  message: string
  tone: 'error' | 'success' | 'warning'
}

const emptyCategoryValues: AdminCategoryFormValues = {
  description: '',
  isActive: true,
  name: '',
  parentId: '',
  slug: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function categoryToFormValues(category: AdminListingCategory): AdminCategoryFormValues {
  return {
    description: category.description ?? '',
    isActive: category.isActive,
    name: category.name,
    parentId: category.parentId ?? '',
    slug: category.slug,
  }
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [editingCategory, setEditingCategory] = useState<AdminListingCategory | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: fetchAdminCategories,
  })

  async function invalidateCategories() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
      queryClient.invalidateQueries({ queryKey: ['listing-references'] }),
      queryClient.invalidateQueries({ queryKey: ['listings', 'public'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (values: AdminCategoryFormValues) => {
      if (editingCategory) {
        return updateAdminCategory({
          categoryId: editingCategory.id,
          values,
        })
      }

      return createAdminCategory(values)
    },
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível salvar a categoria.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: editingCategory ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.',
        tone: 'success',
      })
      setEditingCategory(null)
      setIsFormModalOpen(false)
      await invalidateCategories()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível excluir a categoria.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Categoria removida com sucesso.',
        tone: 'warning',
      })
      setEditingCategory(null)
      await invalidateCategories()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: reorderAdminCategories,
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível reordenar as categorias.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Ordem das categorias atualizada com sucesso.',
        tone: 'success',
      })
      await invalidateCategories()
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (category: AdminListingCategory) =>
      updateAdminCategory({
        categoryId: category.id,
        values: {
          description: category.description ?? '',
          isActive: !category.isActive,
          name: category.name,
          parentId: category.parentId ?? '',
          slug: category.slug,
        },
      }),
    onError: (error) => {
      setFeedback({
        message: error instanceof Error ? error.message : 'Não foi possível atualizar o status da categoria.',
        tone: 'error',
      })
    },
    onSuccess: async () => {
      setFeedback({
        message: 'Status da categoria atualizado com sucesso.',
        tone: 'success',
      })
      await invalidateCategories()
    },
  })

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.depth > 0),
    [categories],
  )
  const categoriesByParent = useMemo(() => {
    return visibleCategories.reduce<Record<string, AdminListingCategory[]>>((accumulator, category) => {
      const key = category.parentId ?? '__root__'
      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(category)
      return accumulator
    }, {})
  }, [visibleCategories])
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return visibleCategories.filter((category) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? category.isActive
            : !category.isActive
      const haystack = `${category.name} ${category.slug} ${category.description ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [query, statusFilter, visibleCategories])

  const paginatedCategories = useMemo(
    () => filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCategories, page],
  )

  const stats = useMemo(
    () => ({
      active: visibleCategories.filter((category) => category.isActive).length,
      pending: visibleCategories.filter((category) => category.pendingListings > 0).length,
      total: visibleCategories.length,
      withListings: visibleCategories.filter((category) => category.totalListings > 0).length,
    }),
    [visibleCategories],
  )

  const isBusy =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending ||
    toggleActiveMutation.isPending

  function handleMove(categoryId: string, direction: 'down' | 'up') {
    const category = categories.find((item) => item.id === categoryId)

    if (!category) {
      return
    }

    const siblingIds = (categoriesByParent[category.parentId ?? '__root__'] ?? [])
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'pt-BR'))
      .map((item) => item.id)

    const currentIndex = siblingIds.indexOf(categoryId)

    if (currentIndex < 0) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= siblingIds.length) {
      return
    }

    const orderedIds = siblingIds.slice()
    const [movedId] = orderedIds.splice(currentIndex, 1)
    orderedIds.splice(targetIndex, 0, movedId)
    reorderMutation.mutate({
      orderedIds,
      parentId: category.parentId,
    })
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              onClick={() => {
                setEditingCategory(null)
                setFeedback(null)
                setIsFormModalOpen(true)
              }}
              type="button"
            >
              <Plus className="size-4" />
              Nova categoria
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.categories}>Categorias públicas</Link>
            </Button>
          </>
        }
        description="Base taxonômica que sustenta o catálogo, filtros públicos e organização editorial do marketplace."
        eyebrow="Administração / categorias"
        title="Gestão de categorias"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Ativas" value={stats.active} />
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
              placeholder="Buscar por nome, slug ou descrição"
              value={query}
            />
            <Select
              onChange={(event) => {
                setPage(1)
                setStatusFilter(event.target.value as typeof statusFilter)
              }}
              value={statusFilter}
            >
              <option value="all">Todas</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </Select>
          </div>
        </AdminFilterCard>

        <AdminDataTable
          columns={[
            {
              header: 'Ordem',
              className: 'w-[120px]',
              cell: (category) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{category.sortOrder}</span>
                  {(() => {
                    const siblingIds = (categoriesByParent[category.parentId ?? '__root__'] ?? [])
                      .slice()
                      .sort(
                        (left, right) =>
                          left.sortOrder - right.sortOrder ||
                          left.name.localeCompare(right.name, 'pt-BR'),
                      )
                      .map((item) => item.id)

                    return (
                      <div className="flex gap-1">
                        <Button
                          disabled={isBusy || siblingIds[0] === category.id}
                          onClick={() => handleMove(category.id, 'up')}
                          size="icon"
                          type="button"
                          variant="outline"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          disabled={isBusy || siblingIds[siblingIds.length - 1] === category.id}
                          onClick={() => handleMove(category.id, 'down')}
                          size="icon"
                          type="button"
                          variant="outline"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              ),
            },
            {
              header: 'Categoria',
              cell: (category) => (
                <div className="space-y-1">
                  <p
                    className="font-medium text-foreground"
                    style={{ paddingLeft: `${category.depth * 16}px` }}
                  >
                    {category.pathLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">{category.description ?? 'Sem descrição'}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {category.parentId ? 'Subcategoria' : 'Categoria principal'}
                  </p>
                </div>
              ),
            },
            {
              header: 'Slug',
              cell: (category) => <span className="text-sm text-muted-foreground">{category.slug}</span>,
            },
            {
              header: 'Status',
              cell: (category) => (
                <AdminStatusBadge tone={category.isActive ? 'success' : 'neutral'}>
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </AdminStatusBadge>
              ),
            },
            {
              header: 'Uso',
              cell: (category) => (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{category.totalListings} anúncios</p>
                  <p>{category.approvedListings} aprovados</p>
                  <p>{category.pendingListings} pendentes</p>
                </div>
              ),
            },
            {
              header: 'Atualizado',
              cell: (category) => (
                <span className="text-sm text-muted-foreground">{formatDate(category.updatedAt)}</span>
              ),
            },
            {
              header: 'Ações',
              className: 'w-[280px] text-right',
              cell: (category) => (
                <AdminRowActions
                  actions={[
                    {
                      icon: Pencil,
                      label: 'Editar',
                      onClick: () => {
                        setEditingCategory(category)
                        setFeedback(null)
                        setIsFormModalOpen(true)
                      },
                    },
                    {
                      label: category.isActive ? 'Inativar' : 'Reativar',
                      onClick: () => toggleActiveMutation.mutate(category),
                      variant: 'outline',
                    },
                    {
                      icon: Trash2,
                      label: 'Excluir',
                      onClick: () => {
                        if (
                          window.confirm(
                            'Excluir esta categoria só é permitido quando não houver anúncios vinculados nem subcategorias. Deseja continuar?',
                          )
                        ) {
                          deleteMutation.mutate(category.id)
                        }
                      },
                      variant: 'destructive',
                    },
                  ]}
                />
              ),
            },
          ]}
          data={paginatedCategories}
          emptyDescription="Nenhuma categoria corresponde aos filtros atuais."
          emptyTitle="Sem categorias neste recorte"
          errorMessage="Não foi possível carregar as categorias."
          getRowKey={(category) => category.id}
          isError={categoriesQuery.isError}
          isLoading={categoriesQuery.isLoading}
        />

        <AdminPagination
          currentPage={page}
          onPageChange={setPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredCategories.length}
        />
      </div>

      {isFormModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de categoria"
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
              {editingCategory ? 'Editar categoria' : 'Nova categoria'}
            </p>
            <div className="mt-4">
              <AdminCategoryForm
                defaultValues={editingCategory ? categoryToFormValues(editingCategory) : emptyCategoryValues}
                categories={categories}
                currentCategoryId={editingCategory?.id ?? null}
                isPending={saveMutation.isPending}
                onCancel={() => {
                  setEditingCategory(null)
                  setIsFormModalOpen(false)
                }}
                onSubmit={(values) => saveMutation.mutate(values)}
                submitLabel={editingCategory ? 'Atualizar categoria' : 'Criar categoria'}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

