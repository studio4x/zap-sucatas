import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchAdminCategories } from '@/domains/categories/api'

const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminCategoriesPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>('all')
  const [page, setPage] = useState(1)

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: fetchAdminCategories,
  })

  const categories = categoriesQuery.data ?? []
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return categories.filter((category) => {
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
  }, [categories, query, statusFilter])
  const paginatedCategories = useMemo(
    () => filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredCategories, page],
  )

  const stats = useMemo(
    () => ({
      active: categories.filter((category) => category.isActive).length,
      pending: categories.filter((category) => category.pendingListings > 0).length,
      total: categories.length,
      withListings: categories.filter((category) => category.totalListings > 0).length,
    }),
    [categories],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.categories}>Categorias publicas</Link>
            </Button>
          </>
        }
        description="Base taxonomica que sustenta o catalogo, filtros publicos e organizacao editorial do marketplace."
        eyebrow="Admin / categorias"
        title="Gestao de categorias"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Ativas" value={stats.active} />
        <AdminStatCard label="Com anuncios" value={stats.withListings} />
        <AdminStatCard label="Com pendencias" value={stats.pending} />
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
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por nome, slug ou descricao"
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
            className: 'w-[90px]',
            cell: (category) => <span className="font-medium text-foreground">{category.sortOrder}</span>,
          },
          {
            header: 'Categoria',
            cell: (category) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.description ?? 'Sem descricao'}</p>
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
                <p>{category.totalListings} anuncios</p>
                <p>{category.approvedListings} aprovados</p>
                <p>{category.pendingListings} pendentes</p>
              </div>
            ),
          },
          {
            header: 'Atualizado',
            cell: (category) => <span className="text-sm text-muted-foreground">{formatDate(category.updatedAt)}</span>,
          },
        ]}
        data={paginatedCategories}
        emptyDescription="Nenhuma categoria corresponde aos filtros atuais."
        emptyTitle="Sem categorias neste recorte"
        errorMessage="Nao foi possivel carregar as categorias."
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
    </section>
  )
}
