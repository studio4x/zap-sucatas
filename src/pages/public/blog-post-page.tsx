import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicBlogPostBySlug, fetchPublicBlogPosts } from '@/domains/blog/api'
import { extractBlogParagraphs } from '@/domains/blog/utils'

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

  return (
    <div className="space-y-8 lg:space-y-10">
      <Button asChild variant="outline">
        <Link to={paths.public.blog}>
          <ArrowLeft className="size-4" />
          Voltar ao blog
        </Link>
      </Button>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-card/90">
        {post.coverImageUrl ? (
          <img
            alt={`Capa do artigo ${post.title}`}
            className="h-72 w-full object-cover"
            src={post.coverImageUrl}
          />
        ) : (
          <div className="h-72 bg-[linear-gradient(160deg,rgba(22,98,70,0.18),rgba(19,33,23,0.06))]" />
        )}
        <div className="space-y-5 px-6 py-8 md:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.categoryName ? <Badge variant="outline">{post.categoryName}</Badge> : null}
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              {post.estimatedReadTime} min de leitura
            </span>
          </div>
          <PublicSectionHeading
            description={post.excerpt ?? 'Conteudo editorial da Zap Sucatas para leitura setorial e reforco de autoridade.'}
            eyebrow="Artigo"
            title={post.title}
          />
          {post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} className="bg-secondary/60 text-foreground" variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="space-y-6 p-6 md:p-8">
          {(paragraphs.length > 0 ? paragraphs : [post.excerpt ?? 'Conteudo em atualizacao.']).map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 32)}-${index}`} className="text-base leading-8 text-foreground/90">
              {paragraph}
            </p>
          ))}
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
