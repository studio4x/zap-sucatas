import { supabase } from '@/integrations/supabase/client'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
import type {
  AdminBlogCategory,
  AdminBlogPost,
  BlogCategory,
  BlogPost,
  BlogPostStatus,
  PublicBlogPost,
} from '@/domains/blog/types'
import type {
  BlogCategoryFormValues,
  BlogPostFormValues,
} from '@/domains/blog/schemas'
import {
  blogContentToPlainText,
  createBlogContentDocument,
  estimateBlogReadTime,
  formatBlogTagsInput,
  parseBlogTagsInput,
  slugifyBlogValue,
} from '@/domains/blog/utils'

const BLOG_MEDIA_BUCKET = 'blog-media'

type BlogCategoryRow = {
  created_at: string
  id: string
  name: string
  slug: string
  updated_at: string
}

type BlogPostRow = {
  author_user_id: string | null
  category_id: string | null
  content: unknown
  cover_image_path: string | null
  created_at: string
  excerpt: string | null
  id: string
  published_at: string | null
  seo_description: string | null
  seo_title: string | null
  slug: string
  status: BlogPostStatus
  tags: string[] | null
  title: string
  updated_at: string
  blog_categories?: { name: string | null } | null
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function resolveBlogCoverImageUrl(storagePath: string | null) {
  if (!storagePath) {
    return null
  }

  if (/^https?:\/\//i.test(storagePath)) {
    return storagePath
  }

  const { data } = ensureSupabase().storage.from(BLOG_MEDIA_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function mapBlogCategory(row: BlogCategoryRow): BlogCategory {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    slug: row.slug,
    updatedAt: row.updated_at,
  }
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    authorUserId: row.author_user_id,
    categoryId: row.category_id,
    content: row.content,
    coverImagePath: row.cover_image_path,
    coverImageUrl: resolveBlogCoverImageUrl(row.cover_image_path),
    createdAt: row.created_at,
    estimatedReadTime: estimateBlogReadTime(row.content),
    excerpt: row.excerpt,
    id: row.id,
    publishedAt: row.published_at,
    seoDescription: row.seo_description,
    seoTitle: row.seo_title,
    slug: row.slug,
    status: row.status,
    tags: row.tags ?? [],
    title: row.title,
    updatedAt: row.updated_at,
  }
}

function mapAdminBlogPost(row: BlogPostRow): AdminBlogPost {
  return {
    ...mapBlogPost(row),
    categoryName: row.blog_categories?.name ?? null,
  }
}

function mapPublicBlogPost(row: BlogPostRow): PublicBlogPost {
  return {
    ...mapBlogPost(row),
    categoryName: row.blog_categories?.name ?? null,
  }
}

function normalizeBlogCategoryId(value: string) {
  return value.trim() || null
}

function buildBlogPostPayload(input: {
  authorProfileId: string
  existingPost?: AdminBlogPost | null
  values: BlogPostFormValues
}) {
  const { existingPost, values } = input
  const nextStatus = values.status
  const nextSlug = slugifyBlogValue(values.slug || values.title)

  if (!nextSlug) {
    throw new Error('Não foi possível gerar um slug válido para o post.')
  }

  const publishedAt =
    nextStatus === 'published'
      ? existingPost?.publishedAt ?? new Date().toISOString()
      : nextStatus === 'draft'
        ? null
        : existingPost?.publishedAt ?? null

  return {
    author_user_id: input.authorProfileId,
    category_id: normalizeBlogCategoryId(values.categoryId),
    content: createBlogContentDocument(values.contentText),
    excerpt: values.excerpt.trim(),
    published_at: publishedAt,
    seo_description: values.seoDescription.trim() || null,
    seo_title: values.seoTitle.trim() || null,
    slug: nextSlug,
    status: nextStatus,
    tags: parseBlogTagsInput(values.tagsText),
    title: values.title.trim(),
  }
}

async function uploadBlogCoverImage(input: {
  authUserId: string
  file: File
  postId: string
}) {
  const extension = input.file.name.includes('.') ? input.file.name.split('.').pop() : 'jpg'
  const baseName = input.file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .toLowerCase()
  const storagePath = `posts/${input.authUserId}/${input.postId}/${Date.now()}-${baseName}.${extension}`

  const { error: uploadError } = await ensureSupabase()
    .storage
    .from(BLOG_MEDIA_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  return storagePath
}

async function removeBlogCoverImage(storagePath: string | null) {
  if (!storagePath || /^https?:\/\//i.test(storagePath)) {
    return
  }

  const { error } = await ensureSupabase().storage.from(BLOG_MEDIA_BUCKET).remove([storagePath])

  if (error) {
    throw error
  }
}

export function createEmptyBlogCategoryFormValues(): BlogCategoryFormValues {
  return {
    name: '',
    slug: '',
  }
}

export function createEmptyBlogPostFormValues(): BlogPostFormValues {
  return {
    categoryId: '',
    contentText: '',
    excerpt: '',
    seoDescription: '',
    seoTitle: '',
    slug: '',
    status: 'draft',
    tagsText: '',
    title: '',
  }
}

export function blogPostToFormValues(post: AdminBlogPost): BlogPostFormValues {
  return {
    categoryId: post.categoryId ?? '',
    contentText: blogContentToPlainText(post.content),
    excerpt: post.excerpt ?? '',
    seoDescription: post.seoDescription ?? '',
    seoTitle: post.seoTitle ?? '',
    slug: post.slug,
    status: post.status,
    tagsText: formatBlogTagsInput(post.tags),
    title: post.title,
  }
}

export function blogCategoryToFormValues(category: AdminBlogCategory): BlogCategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
  }
}

export async function fetchAdminBlogCategories() {
  const client = ensureSupabase()
  const [{ data: categories, error: categoriesError }, { data: posts, error: postsError }] =
    await Promise.all([
      client.from('blog_categories').select('id, name, slug, created_at, updated_at').order('name', { ascending: true }),
      client.from('blog_posts').select('category_id, status'),
    ])

  if (categoriesError) {
    throw categoriesError
  }

  if (postsError) {
    throw postsError
  }

  const counts = new Map<string, { postCount: number; publishedPostCount: number }>()

  ;((posts ?? []) as Array<{ category_id: string | null; status: BlogPostStatus }>).forEach((row) => {
    if (!row.category_id) {
      return
    }

    const current = counts.get(row.category_id) ?? { postCount: 0, publishedPostCount: 0 }
    current.postCount += 1
    if (row.status === 'published') {
      current.publishedPostCount += 1
    }
    counts.set(row.category_id, current)
  })

  return (categories ?? []).map((row) => {
    const category = mapBlogCategory(row as BlogCategoryRow)
    const current = counts.get(category.id) ?? { postCount: 0, publishedPostCount: 0 }

    return {
      ...category,
      postCount: current.postCount,
      publishedPostCount: current.publishedPostCount,
    } satisfies AdminBlogCategory
  })
}

export async function upsertBlogCategory(input: {
  existingCategory?: AdminBlogCategory | null
  values: BlogCategoryFormValues
}) {
  const payload = {
    name: input.values.name.trim(),
    slug: slugifyBlogValue(input.values.slug || input.values.name),
  }

  if (!payload.slug) {
    throw new Error('Não foi possível gerar um slug válido para a categoria.')
  }

  const query = input.existingCategory
    ? ensureSupabase().from('blog_categories').update(payload).eq('id', input.existingCategory.id)
    : ensureSupabase().from('blog_categories').insert(payload)

  const { data, error } = await query.select('id, name, slug, created_at, updated_at').single()

  if (error || !data) {
    throw error ?? new Error('Falha ao salvar a categoria editorial.')
  }

  return mapBlogCategory(data as BlogCategoryRow)
}

export async function deleteBlogCategory(category: AdminBlogCategory) {
  if (category.postCount > 0) {
    throw new Error('Remova ou recategorize os posts vinculados antes de excluir esta categoria.')
  }

  const { error } = await ensureSupabase().from('blog_categories').delete().eq('id', category.id)

  if (error) {
    throw error
  }
}

export async function fetchAdminBlogPosts() {
  const { data, error } = await ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
    )
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapAdminBlogPost(row as BlogPostRow))
}

export async function fetchAdminBlogStats() {
  const client = ensureSupabase()
  const [
    { count: totalCount, error: totalError },
    { count: draftCount, error: draftError },
    { count: publishedCount, error: publishedError },
    { count: archivedCount, error: archivedError },
  ] = await Promise.all([
    client.from('blog_posts').select('id', { count: 'exact', head: true }),
    client.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    client.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    client.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
  ])

  if (totalError || draftError || publishedError || archivedError) {
    throw totalError ?? draftError ?? publishedError ?? archivedError ?? new Error('Falha ao carregar os indicadores editoriais.')
  }

  return {
    archived: archivedCount ?? 0,
    drafts: draftCount ?? 0,
    published: publishedCount ?? 0,
    total: totalCount ?? 0,
  }
}

export async function fetchAdminBlogPostsPage(input: {
  categoryId?: string
  page: number
  pageSize: number
  query?: string
  status?: 'all' | BlogPostStatus
}): Promise<PaginatedResult<AdminBlogPost>> {
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status)
  }

  if (input.categoryId && input.categoryId !== 'all') {
    query = query.eq('category_id', input.categoryId)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    query = query.or(`title.ilike.${search},slug.ilike.${search},excerpt.ilike.${search}`)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    items: (data ?? []).map((row) => mapAdminBlogPost(row as BlogPostRow)),
    totalCount: count ?? 0,
  }
}

export async function saveAdminBlogPost(input: {
  authUserId: string
  authorProfileId: string
  coverFile?: File | null
  existingPost?: AdminBlogPost | null
  values: BlogPostFormValues
}) {
  const payload = buildBlogPostPayload({
    authorProfileId: input.authorProfileId,
    existingPost: input.existingPost,
    values: input.values,
  })

  const query = input.existingPost
    ? ensureSupabase().from('blog_posts').update(payload).eq('id', input.existingPost.id)
    : ensureSupabase().from('blog_posts').insert(payload)

  const { data, error } = await query
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Falha ao salvar o post.')
  }

  let nextRow = data as BlogPostRow

  if (input.coverFile) {
    const nextStoragePath = await uploadBlogCoverImage({
      authUserId: input.authUserId,
      file: input.coverFile,
      postId: nextRow.id,
    })

    if (input.existingPost?.coverImagePath && input.existingPost.coverImagePath !== nextStoragePath) {
      await removeBlogCoverImage(input.existingPost.coverImagePath)
    }

    const { data: updatedData, error: updateError } = await ensureSupabase()
      .from('blog_posts')
      .update({ cover_image_path: nextStoragePath })
      .eq('id', nextRow.id)
      .select(
        'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
      )
      .single()

    if (updateError || !updatedData) {
      throw updateError ?? new Error('Falha ao atualizar a capa do post.')
    }

    nextRow = updatedData as BlogPostRow
  }

  return mapAdminBlogPost(nextRow)
}

export async function deleteBlogPost(post: AdminBlogPost) {
  if (post.coverImagePath) {
    await removeBlogCoverImage(post.coverImagePath)
  }

  const { error } = await ensureSupabase().from('blog_posts').delete().eq('id', post.id)

  if (error) {
    throw error
  }
}

export async function fetchPublicBlogPosts() {
  const { data, error } = await ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapPublicBlogPost(row as BlogPostRow))
}

export async function fetchPublicBlogPostBySlug(slug: string) {
  const { data, error } = await ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, tags, blog_categories(name)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    throw error ?? new Error('Post não encontrado.')
  }

  return mapPublicBlogPost(data as BlogPostRow)
}
