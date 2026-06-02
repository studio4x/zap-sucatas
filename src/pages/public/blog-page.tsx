import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpenText } from 'lucide-react'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { Input } from '@/components/ui/input'
import { fetchPublicBlogPosts } from '@/domains/blog/api'

export function BlogPage() {
  const [query, setQuery] = useState('')

  const blogQuery = useQuery({
    queryKey: ['blog', 'public'],
    queryFn: fetchPublicBlogPosts,
  })

  const posts = useMemo(() => blogQuery.data ?? [], [blogQuery.data])

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        (post.excerpt ?? '').toLowerCase().includes(normalizedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

      return matchesQuery
    })
  }, [posts, query])

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-[2rem] border border-border bg-card/75 p-5 shadow-sm md:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">Blog</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Conteúdo setorial da Zap Sucatas
            </h1>
            <p className="max-w-3xl text-xl leading-8 text-muted-foreground">
              Conteúdo editorial para fortalecer autoridade, SEO e leitura de mercado sobre sucatas, metais e recicláveis.
            </p>
          </div>
          <div className="space-y-3 lg:justify-self-end lg:w-full">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground lg:text-right">
              {filteredPosts.length} artigo(s) neste recorte
            </div>
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por tema, material, operação ou tag editorial"
            value={query}
          />
          </div>
        </div>
      </section>

      {blogQuery.isLoading ? (
        <div className="rounded-[2rem] border border-border bg-card/85 p-6 text-sm text-muted-foreground">
          Carregando artigos...
        </div>
      ) : null}

      {filteredPosts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <PublicEmptyState
          description={
            posts.length > 0
              ? 'Nenhum artigo corresponde aos filtros atuais. Ajuste a busca ou limpe os recortes.'
              : 'Assim que os primeiros artigos forem publicados, esta area vai apoiar SEO, confianca e leitura de mercado.'
          }
          icon={BookOpenText}
          title={posts.length > 0 ? 'Sem artigos neste recorte' : 'Blog em preparação'}
        />
      )}
    </div>
  )
}