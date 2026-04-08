import { supabase } from '@/integrations/supabase/client'
import type { AdminBlogPost, BlogPost, BlogPostStatus, PublicBlogPost } from '@/domains/blog/types'

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
  title: string
  updated_at: string
  blog_categories?: { name: string | null } | null
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    authorUserId: row.author_user_id,
    categoryId: row.category_id,
    content: row.content,
    coverImagePath: row.cover_image_path,
    createdAt: row.created_at,
    excerpt: row.excerpt,
    id: row.id,
    publishedAt: row.published_at,
    seoDescription: row.seo_description,
    seoTitle: row.seo_title,
    slug: row.slug,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  }
}

export async function fetchAdminBlogPosts() {
  const { data, error } = await ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, blog_categories(name)',
    )
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => {
    const post = mapBlogPost(row as BlogPostRow)

    return {
      ...post,
      categoryName: (row as BlogPostRow).blog_categories?.name ?? null,
    } satisfies AdminBlogPost
  })
}

function mapPublicBlogPost(row: BlogPostRow): PublicBlogPost {
  return {
    ...mapBlogPost(row),
    categoryName: row.blog_categories?.name ?? null,
  }
}

export async function fetchPublicBlogPosts() {
  const { data, error } = await ensureSupabase()
    .from('blog_posts')
    .select(
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, blog_categories(name)',
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
      'id, category_id, author_user_id, title, slug, excerpt, content, cover_image_path, seo_title, seo_description, status, published_at, created_at, updated_at, blog_categories(name)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    throw error ?? new Error('Post não encontrado.')
  }

  return mapPublicBlogPost(data as BlogPostRow)
}
