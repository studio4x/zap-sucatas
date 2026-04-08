import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminBlogCategoryForm } from '@/components/admin/admin-blog-category-form'
import { AdminBlogPostForm } from '@/components/admin/admin-blog-post-form'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  blogCategoryToFormValues,
  blogPostToFormValues,
  createEmptyBlogCategoryFormValues,
  createEmptyBlogPostFormValues,
  deleteBlogCategory,
  deleteBlogPost,
  fetchAdminBlogCategories,
  fetchAdminBlogPosts,
  saveAdminBlogPost,
  upsertBlogCategory,
} from '@/domains/blog/api'
import type { BlogCategoryFormValues, BlogPostFormValues } from '@/domains/blog/schemas'
import type { AdminBlogCategory, AdminBlogPost, BlogPostStatus } from '@/domains/blog/types'
import { useAuth } from '@/hooks/use-auth'

const PAGE_SIZE = 10

function getStatusMeta(status: BlogPostStatus) {
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
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null)
  const [editingCategory, setEditingCategory] = useState<AdminBlogCategory | null>(null)

  const blogQuery = useQuery({
    queryKey: ['blog', 'admin'],
    queryFn: fetchAdminBlogPosts,
  })
  const categoriesQuery = useQuery({
    queryKey: ['blog', 'admin', 'categories'],
    queryFn: fetchAdminBlogCategories,
  })

  const invalidateBlog = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['blog'] })])
  }

  const saveCategoryMutation = useMutation({
    mutationFn: async (values: BlogCategoryFormValues) =>
      upsertBlogCategory({
        existingCategory: editingCategory,
        values,
      }),
    onSuccess: async () => {
      setFeedback(editingCategory ? 'Categoria editorial atualizada com sucesso.' : 'Categoria editorial criada com sucesso.')
      setEditingCategory(null)
      await invalidateBlog()
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar a categoria.')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteBlogCategory,
    onSuccess: async () => {
      setFeedback('Categoria editorial removida com sucesso.')
      setEditingCategory(null)
      await invalidateBlog()
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível remover a categoria.')
    },
  })

  const savePostMutation = useMutation({
    mutationFn: async (input: { coverFile: File | null; values: BlogPostFormValues }) => {
      if (!user?.id || !user.profileId) {
        throw new Error('Sessão administrativa inválida para publicação editorial.')
      }

      return saveAdminBlogPost({
        authUserId: user.id,
        authorProfileId: user.profileId,
        coverFile: input.coverFile,
        existingPost: editingPost,
        values: input.values,
      })
    },
    onSuccess: async (savedPost) => {
      setFeedback(
        editingPost
          ? `Post "${savedPost.title}" atualizado com sucesso.`
          : `Post "${savedPost.title}" criado com sucesso.`,
      )
      setEditingPost(savedPost)
      await invalidateBlog()
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar o post.')
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: async () => {
      setFeedback('Post removido com sucesso.')
      setEditingPost(null)
      await invalidateBlog()
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível remover o post.')
    },
  })

  const posts = blogQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const categoryOptions = useMemo(
    () => ['all', ...categories.map((category) => category.name)],
    [categories],
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
      categories: categories.length,
      drafts: posts.filter((post) => post.status === 'draft').length,
      published: posts.filter((post) => post.status === 'published').length,
      total: posts.length,
    }),
    [categories.length, posts],
  )

  const categoryDefaultValues = useMemo(
    () => (editingCategory ? blogCategoryToFormValues(editingCategory) : createEmptyBlogCategoryFormValues()),
    [editingCategory],
  )
  const postDefaultValues = useMemo(
    () => (editingPost ? blogPostToFormValues(editingPost) : createEmptyBlogPostFormValues()),
    [editingPost],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button
              onClick={() => {
                setEditingPost(null)
                setFeedback(null)
              }}
              type="button"
            >
              <Plus className="size-4" />
              Novo post
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.blog}>Blog público</Link>
            </Button>
          </>
        }
        description="Painel editorial do MVP com foco em criação, edição, categorias, status e publicação."
        eyebrow="Admin / blog"
        title="Gestão do blog"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Rascunhos" value={stats.drafts} />
        <AdminStatCard label="Publicados" value={stats.published} />
        <AdminStatCard label="Arquivados" value={stats.archived} />
        <AdminStatCard label="Categorias" value={stats.categories} />
      </div>

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <AdminBlogPostForm
          categories={categories}
          defaultValues={postDefaultValues}
          existingPost={editingPost}
          isPending={savePostMutation.isPending}
          onCancel={
            editingPost
              ? () => {
                  setEditingPost(null)
                }
              : undefined
          }
          onSubmit={(values, coverFile) => savePostMutation.mutate({ coverFile, values })}
          submitLabel={editingPost ? 'Atualizar post' : 'Criar post'}
        />

        <div className="space-y-6">
          <AdminBlogCategoryForm
            defaultValues={categoryDefaultValues}
            isPending={saveCategoryMutation.isPending}
            onCancel={
              editingCategory
                ? () => {
                    setEditingCategory(null)
                  }
                : undefined
            }
            onSubmit={(values) => saveCategoryMutation.mutate(values)}
            submitLabel={editingCategory ? 'Atualizar categoria' : 'Criar categoria'}
          />

          <Card>
            <CardHeader>
              <CardTitle>Categorias editoriais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoriesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando categorias...</p>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-border/70 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.slug}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.postCount} posts, {category.publishedPostCount} publicados
                        </p>
                      </div>
                      <AdminRowActions
                        actions={[
                          {
                            icon: Pencil,
                            label: 'Editar',
                            onClick: () => setEditingCategory(category),
                            variant: 'outline',
                          },
                          {
                            disabled: deleteCategoryMutation.isPending || category.postCount > 0,
                            icon: Trash2,
                            label: 'Excluir',
                            onClick: () => {
                              if (
                                window.confirm(
                                  `Excluir a categoria "${category.name}"? Esta ação só é permitida sem posts vinculados.`,
                                )
                              ) {
                                deleteCategoryMutation.mutate(category)
                              }
                            },
                            variant: 'destructive',
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma categoria editorial cadastrada ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setStatusFilter('all')
              setCategoryFilter('all')
              setFeedback(null)
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtre o dataset editorial por termo, status e categoria antes de agir sobre os posts."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por título, slug ou resumo"
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
            <option value="all">Todas as categorias</option>
            {categoryOptions
              .filter((category) => category !== 'all')
              .map((category) => (
                <option key={category} value={category}>
                  {category}
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
                <p className="text-xs text-muted-foreground">{post.excerpt ?? 'Sem resumo editorial.'}</p>
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
            className: 'w-[240px] text-right',
            cell: (post) => (
              <AdminRowActions
                actions={[
                  {
                    icon: Pencil,
                    label: 'Editar',
                    onClick: () => setEditingPost(post),
                    variant: 'outline',
                  },
                  ...(post.status === 'published'
                    ? [
                        {
                          icon: Eye,
                          label: 'Público',
                          to: paths.public.blogPost(post.slug),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                  {
                    disabled: deletePostMutation.isPending,
                    icon: Trash2,
                    label: 'Excluir',
                    onClick: () => {
                      if (window.confirm(`Excluir o post "${post.title}"? Esta ação é irreversível.`)) {
                        deletePostMutation.mutate(post)
                      }
                    },
                    variant: 'destructive',
                  },
                ]}
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
