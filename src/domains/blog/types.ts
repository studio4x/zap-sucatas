export type BlogPostStatus = 'archived' | 'draft' | 'published'

export type BlogCategory = {
  createdAt: string
  id: string
  name: string
  slug: string
  updatedAt: string
}

export type BlogPost = {
  authorUserId: string | null
  categoryId: string | null
  content: unknown
  coverImagePath: string | null
  coverImageUrl: string | null
  createdAt: string
  estimatedReadTime: number
  excerpt: string | null
  id: string
  publishedAt: string | null
  seoDescription: string | null
  seoTitle: string | null
  slug: string
  status: BlogPostStatus
  tags: string[]
  title: string
  updatedAt: string
}

export type AdminBlogPost = BlogPost & {
  categoryName: string | null
}

export type PublicBlogPost = BlogPost & {
  categoryName: string | null
}

export type AdminBlogCategory = BlogCategory & {
  postCount: number
  publishedPostCount: number
}

export type BlogPostStatusMeta = {
  label: string
  value: BlogPostStatus
}
