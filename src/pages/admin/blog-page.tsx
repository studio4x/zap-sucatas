import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { paths } from '@/app/paths'
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
import { fetchAdminBlogPosts } from '@/domains/blog/api'

const PAGE_SIZE = 10

function getStatusMeta(status: 'archived' | 'draft' | 'published') {
  switch (status) {
    case 'published':
      return { label: 'Publicado', tone: 'success' as const }
    case 'draft':
      return { label: 'Rascunho', tone: 'neutral' as const }
    default:
      return { label: 'Arquivado', tone: 'warning' as const }
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Não publicado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminBlogPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'archived' | 'draft' | 'published'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)

  const blogQuery = useQuery({
    queryKey: ['blog', 'admin'],
    queryFn: fetchAdminBlogPosts,
  })

  const posts = blogQuery.data ?? []
  const categoryOptions = useMemo(
    () => ['all', ...new Set(posts.map((post) => post.categoryName).filter(Boolean))],
    [posts],
  )
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesStatus = statusFilter === 'all' ? true : post.status === statusFilter
      const matchesCategory = categoryFilter === 'all' ? true : post.categoryName === categoryFilter
      const haystack = `${post.title} ${post.slug} ${post.excerpt ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesCategory && matchesQuery
    })
  }, [categoryFilter, posts, query, statusFilter])
  const paginatedPosts = useMemo(
    () => filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPosts, page],
  )

  const stats = useMemo(
    () => ({
      archived: posts.filter((post) => post.status === 'archived').length,
      drafts: posts.filter((post) => post.status === 'draft').length,
      published: posts.filter((post) => post.status === 'published').length,
      total: posts.length,
    }),
    [posts],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.public.blog}>Blog público</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.settings}>Configurações</Link>
            </Button>
          </>
        }
        description="Painel editorial do MVP com foco em status, slug, categoria e publicação."
        eyebrow="Admin / blog"
        title="Gestão do blog"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Rascunhos" value={stats.drafts} />
        <AdminStatCard label="Publicados" value={stats.published} />
        <AdminStatCard label="Arquivados" value={stats.archived} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setStatusFilter('all')
              setCategoryFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por título, slug ou excerpt"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as typeof statusFilter)
            }}
            value={statusFilter}
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunhos</option>
            <option value="published">Publicados</option>
            <option value="archived">Arquivados</option>
          </Select>
          <Select
            onChange={(event) => {
              setPage(1)
              setCategoryFilter(event.target.value)
            }}
            value={categoryFilter}
          >
            {categoryOptions.map((category) => (
              <option key={category ?? 'all'} value={category ?? 'all'}>
                {category ?? 'Todas as categorias'}
              </option>
            ))}
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Post',
            cell: (post) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.excerpt ?? 'Sem excerpt'}</p>
              </div>
            ),
          },
          {
            header: 'Categoria',
            cell: (post) => <span className="text-sm text-muted-foreground">{post.categoryName ?? 'Sem categoria'}</span>,
          },
          {
            header: 'Status',
            cell: (post) => (
              <AdminStatusBadge tone={getStatusMeta(post.status).tone}>
                {getStatusMeta(post.status).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Publicação',
            cell: (post) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{formatDate(post.publishedAt)}</p>
                <p>Atualizado em {formatDate(post.updatedAt)}</p>
              </div>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[150px] text-right',
            cell: (post) => (
              <AdminRowActions
                actions={
                  post.status === 'published'
                    ? [
                        {
                          icon: Eye,
                          label: 'Público',
                          to: `/blog/${post.slug}`,
                          variant: 'ghost',
                        },
                      ]
                    : []
                }
              />
            ),
          },
        ]}
        data={paginatedPosts}
        emptyDescription="Nenhum post corresponde ao recorte atual."
        emptyTitle="Sem posts neste filtro"
        errorMessage="Não foi possível carregar os posts do blog."
        getRowKey={(post) => post.id}
        isError={blogQuery.isError}
        isLoading={blogQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredPosts.length}
      />
    </section>
  )
}
