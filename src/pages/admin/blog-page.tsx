import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
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
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { OperationFeedback } from '@/components/shared/operation-feedback'
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
  fetchAdminBlogPostsPage,
  fetchAdminBlogStats,
  saveAdminBlogPost,
  upsertBlogCategory,
} from '@/domains/blog/api'
import type { BlogCategoryFormValues, BlogPostFormValues } from '@/domains/blog/schemas'
import type { AdminBlogCategory, AdminBlogPost, BlogPostStatus } from '@/domains/blog/types'
import { useAuth } from '@/hooks/use-auth'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

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
    return 'Nao publicado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function AdminBlogPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null)
  const [editingCategory, setEditingCategory] = useState<AdminBlogCategory | null>(null)
  const [postPendingRemoval, setPostPendingRemoval] = useState<AdminBlogPost | null>(null)
  const [categoryPendingRemoval, setCategoryPendingRemoval] = useState<AdminBlogCategory | null>(null)

  const blogQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['blog', 'admin', 'page', { categoryFilter, page, query, statusFilter }],
    queryFn: () =>
      fetchAdminBlogPostsPage({
        categoryId: categoryFilter,
        page,
        pageSize: PAGE_SIZE,
        query,
        status: statusFilter,
      }),
  })
  const categoriesQuery = useQuery({
    queryKey: ['blog', 'admin', 'categories'],
    queryFn: fetchAdminBlogCategories,
  })
  const statsQuery = useQuery({
    queryKey: ['blog', 'admin', 'stats'],
    queryFn: fetchAdminBlogStats,
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
    onError: (error) => {
      setErrorFeedback(error, 'Nao foi possivel salvar a categoria.')
    },
    onSuccess: async () => {
      setSuccessFeedback(
        editingCategory
          ? 'Categoria editorial atualizada com sucesso.'
          : 'Categoria editorial criada com sucesso.',
      )
      setEditingCategory(null)
      await invalidateBlog()
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteBlogCategory,
    onError: (error) => {
      setErrorFeedback(error, 'Nao foi possivel remover a categoria.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Categoria editorial removida com sucesso.')
      setCategoryPendingRemoval(null)
      setEditingCategory(null)
      await invalidateBlog()
    },
  })

  const savePostMutation = useMutation({
    mutationFn: async (input: { coverFile: File | null; values: BlogPostFormValues }) => {
      if (!user?.id || !user.profileId) {
        throw new Error('Sessao administrativa invalida para publicacao editorial.')
      }

      return saveAdminBlogPost({
        authUserId: user.id,
        authorProfileId: user.profileId,
        coverFile: input.coverFile,
        existingPost: editingPost,
        values: input.values,
      })
    },
    onError: (error) => {
      setErrorFeedback(error, 'Nao foi possivel salvar o post.')
    },
    onSuccess: async (savedPost) => {
      setSuccessFeedback(
        editingPost
          ? `Post "${savedPost.title}" atualizado com sucesso.`
          : `Post "${savedPost.title}" criado com sucesso.`,
      )
      setEditingPost(savedPost)
      await invalidateBlog()
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: deleteBlogPost,
    onError: (error) => {
      setErrorFeedback(error, 'Nao foi possivel remover o post.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Post removido com sucesso.')
      setEditingPost(null)
      setPostPendingRemoval(null)
      await invalidateBlog()
    },
  })

  const posts = blogQuery.data?.items ?? []
  const totalCount = blogQuery.data?.totalCount ?? 0
  const categories = categoriesQuery.data ?? []
  const stats = statsQuery.data ?? {
    archived: 0,
    drafts: 0,
    published: 0,
    total: 0,
  }

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
                clearFeedback()
                setEditingPost(null)
              }}
              type="button"
            >
              <Plus className="size-4" />
              Novo post
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.blog}>Blog publico</Link>
            </Button>
          </>
        }
        description="Painel editorial do MVP com foco em criacao, edicao, categorias, status e publicacao."
        eyebrow="Admin / blog"
        title="Gestao do blog"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Rascunhos" value={stats.drafts} />
        <AdminStatCard label="Publicados" value={stats.published} />
        <AdminStatCard label="Arquivados" value={stats.archived} />
        <AdminStatCard label="Categorias" value={categories.length} />
      </div>

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

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
                  <div key={category.id} className="rounded-2xl border border-border/70 px-4 py-4">
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
                            onClick: () => setCategoryPendingRemoval(category),
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
              clearFeedback()
              setCategoryFilter('all')
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
        description="Filtre o dataset editorial por termo, status e categoria antes de agir sobre os posts."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por titulo, slug ou resumo"
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
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
            header: 'Publicacao',
            cell: (post) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{formatDate(post.publishedAt)}</p>
                <p>Atualizado em {formatDate(post.updatedAt)}</p>
              </div>
            ),
          },
          {
            header: 'Acoes',
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
                          label: 'Publico',
                          to: paths.public.blogPost(post.slug),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                  {
                    disabled: deletePostMutation.isPending,
                    icon: Trash2,
                    label: 'Excluir',
                    onClick: () => setPostPendingRemoval(post),
                    variant: 'destructive',
                  },
                ]}
              />
            ),
          },
        ]}
        data={posts}
        emptyDescription="Nenhum post corresponde ao recorte atual."
        emptyTitle="Sem posts neste filtro"
        errorMessage="Nao foi possivel carregar os posts do blog."
        getRowKey={(post) => post.id}
        isError={blogQuery.isError || categoriesQuery.isError || statsQuery.isError}
        isLoading={blogQuery.isLoading || categoriesQuery.isLoading || statsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <ConfirmActionDialog
        confirmLabel="Excluir categoria"
        description={
          categoryPendingRemoval
            ? `Excluir a categoria "${categoryPendingRemoval.name}"? Essa acao so e segura quando nao houver posts vinculados.`
            : ''
        }
        isPending={deleteCategoryMutation.isPending}
        onConfirm={() => {
          if (categoryPendingRemoval) {
            deleteCategoryMutation.mutate(categoryPendingRemoval)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryPendingRemoval(null)
          }
        }}
        open={Boolean(categoryPendingRemoval)}
        title="Confirmar exclusao"
        tone="danger"
      />

      <ConfirmActionDialog
        confirmLabel="Excluir post"
        description={
          postPendingRemoval
            ? `Excluir o post "${postPendingRemoval.title}"? Essa acao remove o conteudo editorial do sistema.`
            : ''
        }
        isPending={deletePostMutation.isPending}
        onConfirm={() => {
          if (postPendingRemoval) {
            deletePostMutation.mutate(postPendingRemoval)
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPostPendingRemoval(null)
          }
        }}
        open={Boolean(postPendingRemoval)}
        title="Confirmar exclusao"
        tone="danger"
      />
    </section>
  )
}
