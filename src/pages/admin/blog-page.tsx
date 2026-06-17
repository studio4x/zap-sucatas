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
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { ConfirmActionDialog } from '@/components/shared/confirm-action-dialog'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  blogCategoryToFormValues,
  blogPostToFormValues,
  createEmptyBlogCategoryFormValues,
  createEmptyBlogPostFormValues,
  deleteBlogCategory,
  deleteBlogPost,
  fetchAdminBlogCategories,
  fetchAdminBlogPostsPage,
  saveAdminBlogPost,
  upsertBlogCategory,
} from '@/domains/blog/api'
import type { BlogCategoryFormValues, BlogPostFormValues } from '@/domains/blog/schemas'
import type { AdminBlogCategory, AdminBlogPost, BlogPostStatus } from '@/domains/blog/types'
import { fetchSystemSettings, updateBlogVisibilityEnabled } from '@/domains/settings/api'
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
    return 'Não publicado'
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
  const [activeTab, setActiveTab] = useState<'categories' | 'posts'>('posts')
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null)
  const [editingCategory, setEditingCategory] = useState<AdminBlogCategory | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
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
  const systemSettingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const invalidateBlog = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['blog'] })])
  }
  const invalidateSystemSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['system-settings'] })
  }

  const saveCategoryMutation = useMutation({
    mutationFn: async (values: BlogCategoryFormValues) =>
      upsertBlogCategory({
        existingCategory: editingCategory,
        values,
      }),
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível salvar a categoria.')
    },
    onSuccess: async () => {
      setSuccessFeedback(
        editingCategory
          ? 'Categoria editorial atualizada com sucesso.'
          : 'Categoria editorial criada com sucesso.',
      )
      setEditingCategory(null)
      setIsCategoryModalOpen(false)
      await invalidateBlog()
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteBlogCategory,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível remover a categoria.')
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
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível salvar o post.')
    },
    onSuccess: async (savedPost) => {
      setSuccessFeedback(
        editingPost
          ? `Post "${savedPost.title}" atualizado com sucesso.`
          : `Post "${savedPost.title}" criado com sucesso.`,
      )
      setEditingPost(null)
      setIsPostModalOpen(false)
      await invalidateBlog()
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: deleteBlogPost,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível remover o post.')
    },
    onSuccess: async () => {
      setSuccessFeedback('Post removido com sucesso.')
      setEditingPost(null)
      setPostPendingRemoval(null)
      await invalidateBlog()
    },
  })

  const toggleBlogMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const current = systemSettingsQuery.data
      if (!current) {
        throw new Error('Configurações do sistema indisponíveis para atualizar o status do blog.')
      }

      return updateBlogVisibilityEnabled({
        enabled,
        id: current.id,
      })
    },
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível atualizar o status do blog.')
    },
    onSuccess: async (updated) => {
      setSuccessFeedback(updated.blogEnabled ? 'Blog ativado com sucesso.' : 'Blog desativado com sucesso.')
      await invalidateSystemSettings()
    },
  })

  const posts = useMemo(() => blogQuery.data?.items ?? [], [blogQuery.data])
  const totalCount = blogQuery.data?.totalCount ?? 0
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

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
                setIsPostModalOpen(true)
              }}
              type="button"
            >
              <Plus className="size-4" />
              Novo post
            </Button>
            <Button
              onClick={() => {
                clearFeedback()
                setEditingCategory(null)
                setIsCategoryModalOpen(true)
              }}
              type="button"
              variant="outline"
            >
              <Plus className="size-4" />
              Nova categoria
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.public.blog}>Blog público</Link>
            </Button>
          </>
        }
        description="Painel editorial do MVP com foco em criação, edição, categorias, status e publicação."
        eyebrow="Administração / blog"
        title="Gestão do blog"
      />

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Visibilidade pública do blog</p>
            <p className="text-sm text-muted-foreground">
              Quando desativado, links de blog somem do site e as rotas públicas redirecionam para a home.
            </p>
          </div>
          <Switch
            checked={systemSettingsQuery.data?.blogEnabled ?? true}
            disabled={toggleBlogMutation.isPending || systemSettingsQuery.isLoading}
            onCheckedChange={(checked) => {
              clearFeedback()
              toggleBlogMutation.mutate(checked)
            }}
          />
        </div>
      </div>

      <div className="inline-flex gap-2 rounded-2xl border border-border/70 bg-muted/20 p-1">
        <Button
          onClick={() => setActiveTab('posts')}
          size="sm"
          type="button"
          variant={activeTab === 'posts' ? 'default' : 'ghost'}
        >
          Posts
        </Button>
        <Button
          onClick={() => setActiveTab('categories')}
          size="sm"
          type="button"
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
        >
          Categorias
        </Button>
      </div>

      {activeTab === 'posts' ? (
        <>
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
            header: 'Tags',
            cell: (post) => (
              <div className="flex flex-wrap gap-2">
                {post.tags.length > 0 ? (
                  post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary/70 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Sem tags</span>
                )}
                {post.tags.length > 3 ? (
                  <span className="inline-flex items-center rounded-full bg-secondary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    +{post.tags.length - 3}
                  </span>
                ) : null}
              </div>
            ),
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
                    onClick: () => {
                      setEditingPost(post)
                      setIsPostModalOpen(true)
                    },
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
                  ...(post.status === 'draft'
                    ? [
                        {
                          icon: Eye,
                          label: 'Pré-visualizar',
                          to: paths.public.blogPostPreview(post.id),
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
        errorMessage="Não foi possível carregar os posts do blog."
        getRowKey={(post) => post.id}
        isError={blogQuery.isError || categoriesQuery.isError}
        isLoading={blogQuery.isLoading || categoriesQuery.isLoading}
          />

          <AdminPagination
            currentPage={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={totalCount}
          />
        </>
      ) : (
        <AdminDataTable
          columns={[
            {
              header: 'Categoria',
              cell: (category) => (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                </div>
              ),
            },
            {
              header: 'Uso',
              cell: (category) => (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{category.postCount} posts</p>
                  <p>{category.publishedPostCount} publicados</p>
                </div>
              ),
            },
            {
              header: 'Ações',
              className: 'w-[220px] text-right',
              cell: (category) => (
                <AdminRowActions
                  actions={[
                    {
                      icon: Pencil,
                      label: 'Editar',
                      onClick: () => {
                        setEditingCategory(category)
                        setIsCategoryModalOpen(true)
                      },
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
              ),
            },
          ]}
          data={categories}
          emptyDescription="Nenhuma categoria editorial cadastrada ainda."
          emptyTitle="Sem categorias editoriais"
          errorMessage="Não foi possível carregar as categorias."
          getRowKey={(category) => category.id}
          isError={categoriesQuery.isError}
          isLoading={categoriesQuery.isLoading}
        />
      )}

      {isPostModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de post"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!savePostMutation.isPending) setIsPostModalOpen(false)
            }}
            type="button"
          />
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <AdminBlogPostForm
              key={editingPost?.id ?? 'new-blog-post'}
              categories={categories}
              defaultValues={postDefaultValues}
              existingPost={editingPost}
              isPending={savePostMutation.isPending}
              onCancel={() => {
                setEditingPost(null)
                setIsPostModalOpen(false)
              }}
              onSubmit={(values, coverFile) => savePostMutation.mutate({ coverFile, values })}
              submitLabel={editingPost ? 'Atualizar post' : 'Criar post'}
            />
          </div>
        </div>
      ) : null}

      {isCategoryModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <button
            aria-label="Fechar modal de categoria editorial"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => {
              if (!saveCategoryMutation.isPending) setIsCategoryModalOpen(false)
            }}
            type="button"
          />
          <div className="relative w-full max-w-2xl rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <AdminBlogCategoryForm
              defaultValues={categoryDefaultValues}
              isPending={saveCategoryMutation.isPending}
              onCancel={() => {
                setEditingCategory(null)
                setIsCategoryModalOpen(false)
              }}
              onSubmit={(values) => saveCategoryMutation.mutate(values)}
              submitLabel={editingCategory ? 'Atualizar categoria' : 'Criar categoria'}
            />
          </div>
        </div>
      ) : null}

      <ConfirmActionDialog
        confirmLabel="Excluir categoria"
        description={
          categoryPendingRemoval
            ? `Excluir a categoria "${categoryPendingRemoval.name}"? Essa ação so e segura quando não houver posts vinculados.`
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
            ? `Excluir o post "${postPendingRemoval.title}"? Essa ação remove o conteúdo editorial do sistema.`
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
