import { useQuery } from '@tanstack/react-query'
import { BookOpenText } from 'lucide-react'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { fetchPublicBlogPosts } from '@/domains/blog/api'

export function BlogPage() {
  const blogQuery = useQuery({
    queryKey: ['blog', 'public'],
    queryFn: fetchPublicBlogPosts,
  })

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Conteúdo editorial para fortalecer autoridade, SEO e leitura de mercado sobre sucatas, metais, reciclagem e equipamentos."
        eyebrow="Blog"
        title="Conteúdo setorial da Zap Sucatas"
      />

      {blogQuery.isLoading ? (
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 text-sm text-muted-foreground">
          Carregando artigos...
        </div>
      ) : null}

      {blogQuery.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blogQuery.data.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <PublicEmptyState
          description="Assim que os primeiros artigos forem publicados, esta área vai apoiar SEO, confiança e leitura de mercado."
          icon={BookOpenText}
          title="Blog em preparação"
        />
      )}
    </div>
  )
}
