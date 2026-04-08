import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicBlogPost } from '@/domains/blog/types'

function formatBlogDate(value: string | null) {
  if (!value) {
    return 'Em atualização'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

type BlogPostCardProps = {
  post: PublicBlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Card className="h-full overflow-hidden border-border/80">
      {post.coverImageUrl ? (
        <img
          alt={`Capa do artigo ${post.title}`}
          className="h-48 w-full object-cover"
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
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-2xl tracking-tight text-foreground">{post.title}</h3>
          <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
            {post.excerpt ?? 'Conteúdo editorial da Zap Sucatas sobre sucatas, metais e mercado industrial.'}
          </p>
        </div>

        <div className="mt-auto">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
            to={paths.public.blogPost(post.slug)}
          >
            Ler artigo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
