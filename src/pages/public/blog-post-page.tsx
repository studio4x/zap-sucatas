import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicBlogPostBySlug, fetchPublicBlogPosts } from '@/domains/blog/api'
import { blogContentHasHtml, blogContentToPlainText, extractBlogParagraphs } from '@/domains/blog/utils'

function formatBlogDate(value: string | null) {
  if (!value) {
    return 'Em atualizacao'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(value))
}

export function BlogPostPage() {
  const { slug = '' } = useParams()

  const postQuery = useQuery({
    queryKey: ['blog', 'public', slug],
    queryFn: () => fetchPublicBlogPostBySlug(slug),
    enabled: Boolean(slug),
  })

  const relatedPostsQuery = useQuery({
    queryKey: ['blog', 'public', 'related', slug],
    queryFn: fetchPublicBlogPosts,
  })

  const relatedPosts = useMemo(() => {
    if (!postQuery.data) {
      return []
    }

    const currentPost = postQuery.data
    return (relatedPostsQuery.data ?? [])
      .filter((item) => item.id !== currentPost.id)
      .map((item) => {
        const sharedTags = item.tags.filter((tag) => currentPost.tags.includes(tag)).length
        const sameCategory = item.categoryId && item.categoryId === currentPost.categoryId ? 2 : 0
        return {
          item,
          score: sameCategory + sharedTags,
        }
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        return right.item.publishedAt?.localeCompare(left.item.publishedAt ?? '') ?? 0
      })
      .slice(0, 3)
      .map(({ item }) => item)
  }, [postQuery.data, relatedPostsQuery.data])

  if (postQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando artigo...
        </CardContent>
      </Card>
    )
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Nao foi possivel carregar o artigo solicitado.
        </CardContent>
      </Card>
    )
  }

  const post = postQuery.data
  const paragraphs = extractBlogParagraphs(post.content)
  const rawContent = blogContentToPlainText(post.content)
  const contentIsHtml = blogContentHasHtml(post.content)
  const articleCategory = post.categoryName ?? 'Notícias'

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden">
        {post.coverImageUrl ? (
          <img
            alt={`Capa do artigo ${post.title}`}
            className="h-[360px] w-full object-cover md:h-[500px]"
            src={post.coverImageUrl}
          />
        ) : (
          <div className="h-[360px] w-full bg-[linear-gradient(160deg,#2d3f2f,#1f2f20)] md:h-[500px]" />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-6 text-center">
            <Badge className="bg-white/20 text-white backdrop-blur-sm" variant="secondary">
              {articleCategory}
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-7xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
              <span>{formatBlogDate(post.publishedAt)}</span>
              <span>•</span>
              <span>Por ZapSucatas</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {post.estimatedReadTime} min</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl px-2">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground" to={paths.public.blog}>
          <ArrowLeft className="size-4" />
          Voltar ao blog
        </Link>
      </div>

      <Card className="mx-auto w-full max-w-4xl border-none bg-transparent shadow-none">
        <CardContent className="space-y-6 px-4 py-6 md:px-10 md:py-10">
          {post.excerpt ? <p className="text-xl leading-9 text-foreground/90">{post.excerpt}</p> : null}
          {contentIsHtml ? (
            <article className="prose prose-zinc max-w-none text-foreground/90 prose-p:leading-8 prose-li:leading-8">
              <div dangerouslySetInnerHTML={{ __html: rawContent }} />
            </article>
          ) : (
            (paragraphs.length > 0 ? paragraphs : [post.excerpt ?? 'Conteudo em atualizacao.']).map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 32)}-${index}`} className="text-base leading-8 text-foreground/90">
                {paragraph}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      {relatedPosts.length > 0 ? (
        <section className="space-y-6">
          <PublicSectionHeading
            description="Mais conteudo editorial para aprofundar a leitura de mercado e operacao do segmento."
            eyebrow="Relacionados"
            title="Continue a leitura"
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {relatedPosts.map((item) => (
              <BlogPostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
