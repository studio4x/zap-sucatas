import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpenText } from 'lucide-react'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchPublicBlogPosts } from '@/domains/blog/api'

export function BlogPage() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')

  const blogQuery = useQuery({
    queryKey: ['blog', 'public'],
    queryFn: fetchPublicBlogPosts,
  })

  const posts = useMemo(() => blogQuery.data ?? [], [blogQuery.data])

  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.categoryName).filter((value): value is string => Boolean(value)))).sort(),
    [posts],
  )

  const topTags = useMemo(() => {
    const counts = new Map<string, number>()

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 8)
      .map(([tag]) => tag)
  }, [posts])

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        (post.excerpt ?? '').toLowerCase().includes(normalizedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

      const matchesCategory =
        categoryFilter === 'all' || post.categoryName === categoryFilter

      const matchesTag =
        tagFilter === 'all' || post.tags.includes(tagFilter)

      return matchesQuery && matchesCategory && matchesTag
    })
  }, [categoryFilter, posts, query, tagFilter])

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Conteúdo editorial para fortalecer autoridade, SEO e leitura de mercado sobre sucatas, metais e recicláveis."
        eyebrow="Blog"
        title="Conteudo setorial da Zap Sucatas"
      />

      <section className="space-y-5 rounded-[2rem] border border-border bg-card/75 p-5 shadow-sm md:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por tema, material, operacao ou tag editorial"
            value={query}
          />
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            {filteredPosts.length} artigo(s) neste recorte
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Categorias editoriais
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCategoryFilter('all')} type="button" variant={categoryFilter === 'all' ? 'default' : 'outline'}>
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  type="button"
                  variant={categoryFilter === category ? 'default' : 'outline'}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {topTags.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Tags em destaque
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTagFilter('all')} type="button" variant={tagFilter === 'all' ? 'default' : 'outline'}>
                Todas
              </Button>
              {topTags.map((tag) => (
                <Button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  type="button"
                  variant={tagFilter === tag ? 'default' : 'outline'}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
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
          title={posts.length > 0 ? 'Sem artigos neste recorte' : 'Blog em preparacao'}
        />
      )}
    </div>
  )
}
