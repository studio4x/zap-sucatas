import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, CircleHelp, Newspaper, ShieldCheck, TrendingUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { CategoryHighlights } from '@/components/public/category-highlights'
import { CtaBanner } from '@/components/public/cta-banner'
import { FaqSection } from '@/components/public/faq-section'
import { FeaturedListingsSection } from '@/components/public/featured-listings-section'
import { HeroSearchSection } from '@/components/public/hero-search-section'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicBlogPosts } from '@/domains/blog/api'
import { fetchPublicCategories } from '@/domains/categories/api'
import { fetchFeaturedPublicListings } from '@/domains/listings/api'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import { formatPricingDate, formatPricingNumber, pricingSeriesCatalog } from '@/domains/pricing/utils'

const trustBlocks = [
  {
    description: 'Todos os anúncios públicos passam por moderação antes de entrar no catálogo.',
    icon: ShieldCheck,
    title: 'Confiança comercial',
  },
  {
    description: 'Busca rápida por categoria, material, cidade e estado em um catálogo setorial.',
    icon: CheckCircle2,
    title: 'Descoberta orientada a tarefa',
  },
  {
    description: 'Tabela de preços, blog e páginas de anúncio ajudam a negociar com mais contexto.',
    icon: TrendingUp,
    title: 'Leitura de mercado',
  },
]

const faqItems = [
  {
    answer:
      'Você cria sua conta, monta o anúncio com informações comerciais e envia para revisão. Depois da aprovação, o anúncio entra no catálogo público.',
    question: 'Como funciona para anunciar na Zap Sucatas?',
  },
  {
    answer:
      'A busca pública ajuda a filtrar por categoria, material e localização. Cada detalhe de anúncio organiza fotos, descrição, atributos técnicos e perguntas.',
    question: 'Como encontro um lote ou equipamento específico?',
  },
  {
    answer:
      'O módulo público mostra histórico consolidado de metais e referências manuais publicadas pela operação, o que ajuda na leitura comercial do mercado.',
    question: 'A tabela de preços serve como referência de mercado?',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'public'],
    queryFn: fetchPublicCategories,
  })

  const featuredListingsQuery = useQuery({
    queryKey: ['listings', 'public', 'featured-home'],
    queryFn: () => fetchFeaturedPublicListings(6),
  })

  const pricingQuery = useQuery({
    queryKey: ['pricing', 'public', 'home'],
    queryFn: fetchPublicPricingPageData,
  })

  const blogQuery = useQuery({
    queryKey: ['blog', 'public', 'home'],
    queryFn: fetchPublicBlogPosts,
  })

  function handleHeroSearch(nextQuery: string) {
    const trimmed = nextQuery.trim()
    navigate(trimmed ? `${paths.public.listings}?q=${encodeURIComponent(trimmed)}` : paths.public.listings)
  }

  const highlightedCategories = (categoriesQuery.data ?? [])
    .slice()
    .sort((left, right) => right.approvedListings - left.approvedListings)
    .slice(0, 4)

  const latestPricingEntries =
    pricingQuery.data?.manualEntries.slice(0, 4) ??
    []

  return (
    <div className="space-y-12 lg:space-y-16">
      <HeroSearchSection onSearchSubmit={handleHeroSearch} query={query} setQuery={setQuery} />

      <section className="grid gap-4 md:grid-cols-3">
        {trustBlocks.map(({ description, icon: Icon, title }) => (
          <Card key={title} className="border-border/80">
            <CardContent className="space-y-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {highlightedCategories.length > 0 ? (
        <CategoryHighlights categories={highlightedCategories} />
      ) : (
        <PublicEmptyState
          description="As categorias principais aparecerão aqui assim que o catálogo público estiver mais preenchido."
          title="Categorias em preparação"
        />
      )}

      {featuredListingsQuery.data?.length ? (
        <FeaturedListingsSection
          description="Leitura rápida de anúncios moderados para quem quer encontrar sucatas, metais e equipamentos com mais contexto."
          eyebrow="Catálogo"
          listings={featuredListingsQuery.data}
          title="Anúncios recentes e em destaque"
        />
      ) : (
        <PublicEmptyState
          description="Assim que houver anúncios publicados, esta vitrine vai destacar os lotes e equipamentos mais relevantes do portal."
          title="O catálogo público ainda está ganhando volume"
        />
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <PublicSectionHeading
            actions={
              <Button asChild variant="outline">
                <Link to={paths.public.pricing}>Abrir tabela completa</Link>
              </Button>
            }
            description="Acompanhe rapidamente a leitura diária dos metais e as referências comerciais publicadas pela operação."
            eyebrow="Preços"
            title="Ferramenta pública de mercado"
          />

          <Card className="border-border/80">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              {pricingSeriesCatalog.slice(0, 4).map((series) => (
                <div key={series.code} className="rounded-[1.5rem] border border-border bg-secondary/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {series.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold text-foreground">
                    {typeof pricingQuery.data?.latestValues[series.code] === 'number'
                      ? formatPricingNumber(pricingQuery.data.latestValues[series.code] ?? 0, 2)
                      : '-'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
                Atualização mais recente
              </Badge>
              <h2 className="font-display text-3xl tracking-tight text-foreground">
                {formatPricingDate(pricingQuery.data?.latestQuotedDate ?? null)}
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Última consolidação disponível do histórico público de preços.
              </p>
            </div>

            <div className="grid gap-3">
              {latestPricingEntries.length > 0 ? (
                latestPricingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-border bg-background/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{entry.materialName}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {entry.regionName ?? 'Brasil'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{entry.priceLabel}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  As referências manuais aparecerão aqui assim que forem publicadas no módulo de
                  preços.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <PublicSectionHeading
          actions={
            <Button asChild variant="outline">
              <Link to={paths.public.blog}>
                Ver conteúdo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          description="Conteúdo editorial para fortalecer confiança, SEO e leitura de mercado no segmento de sucatas e maquinários."
          eyebrow="Conteúdo"
          title="Blog e inteligência setorial"
        />

        {blogQuery.data?.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {blogQuery.data.slice(0, 3).map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <PublicEmptyState
            description="O blog aparecerá aqui com artigos sobre mercado, reciclagem, metais e operação comercial."
            icon={Newspaper}
            title="Conteúdo editorial em preparação"
          />
        )}
      </section>

      <FaqSection
        description="Respostas objetivas para quem quer entender o funcionamento do portal e negociar com mais confiança."
        items={faqItems}
        title="Perguntas frequentes sobre o portal"
      />

      <CtaBanner
        actionLabel="Criar conta e anunciar"
        actionTo={paths.auth.register}
        description="Publique lotes, sucatas ou maquinários em uma plataforma construída para o mercado industrial e preparada para operação real."
        secondaryAction={
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link to={paths.public.contact}>
              <CircleHelp className="size-4" />
              Falar com a equipe
            </Link>
          </Button>
        }
        title="Transforme estoque parado em oportunidade comercial com visibilidade de mercado."
      />
    </div>
  )
}
