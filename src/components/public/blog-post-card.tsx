import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicBlogPost } from '@/domains/blog/types'

function formatBlogDate(value: string | null) {
  if (!value) {
    return 'Em atualizacao'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

type BlogPostCardProps = {
  post: PublicBlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const visibleTags = post.tags.slice(0, 2)

  return (
    <Link className="group block h-full" to={paths.public.blogPost(post.slug)}>
      <Card className="h-full overflow-hidden border-border/80 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_-36px_rgba(19,33,23,0.35)]">
        {post.coverImageUrl ? (
          <img
            alt={`Capa do artigo ${post.title}`}
            className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            src={post.coverImageUrl}
          />
        ) : (
          <div className="h-48 bg-[linear-gradient(160deg,rgba(22,98,70,0.16),rgba(19,33,23,0.06))]" />
        )}
        <CardContent className="flex h-full flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            {post.categoryName ? <Badge variant="outline">{post.categoryName}</Badge> : null}
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock3 className="size-4" />
              {post.estimatedReadTime} min de leitura
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-2xl tracking-tight text-foreground transition group-hover:text-primary">
              {post.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
              {post.excerpt ?? 'Conteudo editorial da Zap Sucatas sobre sucatas, metais e mercado industrial.'}
            </p>
          </div>

          {visibleTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <Badge key={tag} className="bg-secondary/60 text-foreground" variant="secondary">
                  #{tag}
                </Badge>
              ))}
              {post.tags.length > visibleTags.length ? (
                <Badge className="bg-secondary/40 text-muted-foreground" variant="secondary">
                  +{post.tags.length - visibleTags.length}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:gap-3">
            Ler artigo
            <ArrowRight className="size-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
