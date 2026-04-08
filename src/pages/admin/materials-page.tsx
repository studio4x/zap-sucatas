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
import { fetchAdminMaterials } from '@/domains/categories/api'

const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminMaterialsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'inactive'>('all')
  const [page, setPage] = useState(1)

  const materialsQuery = useQuery({
    queryKey: ['materials', 'admin'],
    queryFn: fetchAdminMaterials,
  })

  const materials = materialsQuery.data ?? []
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
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anúncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.pricing}>Precos</Link>
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
    </section>
  )
}
