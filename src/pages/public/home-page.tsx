import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CircleHelp, Newspaper } from 'lucide-react'
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

const faqItems = [
  {
    answer:
      'Voce cria sua conta, monta o anuncio com informacoes comerciais e envia para revisao. Depois da aprovacao, o anuncio entra no catalogo publico.',
    question: 'Como funciona para anunciar na Zap Sucatas?',
  },
  {
    answer:
      'A busca publica ajuda a filtrar por categoria, material e localizacao. Cada detalhe de anuncio organiza fotos, descricao, atributos tecnicos e perguntas.',
    question: 'Como encontro um lote ou equipamento especifico?',
  },
  {
    answer:
      'A tabela publica mostra referencias manuais e historico consolidado de metais, ajudando na leitura comercial do mercado.',
    question: 'A tabela de precos serve como referencia de mercado?',
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

  const latestPricingEntries = pricingQuery.data?.manualEntries.slice(0, 4) ?? []

  const marketStrip = useMemo(
    () => [
      {
        label: 'Categorias ativas',
        value: categoriesQuery.data?.length ?? 0,
      },
      {
        label: 'Destaques na vitrine',
        value: featuredListingsQuery.data?.length ?? 0,
      },
      {
        label: 'Serie publica de metais',
        value: pricingSeriesCatalog.length,
      },
      {
        label: 'Artigos publicados',
        value: blogQuery.data?.length ?? 0,
      },
    ],
    [blogQuery.data?.length, categoriesQuery.data?.length, featuredListingsQuery.data?.length],
  )

  return (
    <div className="space-y-12 lg:space-y-16">
      <HeroSearchSection onSearchSubmit={handleHeroSearch} query={query} setQuery={setQuery} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {marketStrip.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.7rem] border border-[#d8e3d8] bg-[linear-gradient(180deg,#fbfdfb_0%,#f4f8f3_100%)] px-5 py-5 shadow-[0_22px_48px_-42px_rgba(19,33,23,0.26)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[2.2rem] border border-[#d8e3d8] bg-[linear-gradient(180deg,#f8fbf7_0%,#f2f6f1_100%)]">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              description="A area publica foi desenhada para responder rapido o que voce encontra aqui, como buscar e por que confiar no portal."
              eyebrow="Posicionamento"
              title="Uma estrutura comercial pensada para o mercado de sucatas"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Busca protagonista</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                O catalogo parte de uma busca forte e filtros orientados ao trabalho real de compra e venda.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Catalogo vivo</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Categorias, anuncios e detalhe comercial foram organizados para leitura rapida e navegacao previsivel.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/80 bg-white/88 p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Confianca operacional</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Moderacao, tabela de precos e conteudo editorial reforcam a percepcao de mercado real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {highlightedCategories.length > 0 ? (
        <CategoryHighlights categories={highlightedCategories} />
      ) : (
        <PublicEmptyState
          description="As categorias principais aparecerao aqui assim que o catalogo publico estiver mais preenchido."
          title="Categorias em preparacao"
        />
      )}

      {featuredListingsQuery.data?.length ? (
        <FeaturedListingsSection
          description="Leitura rapida de anuncios moderados para quem quer encontrar sucatas, metais e equipamentos com mais contexto."
          eyebrow="Catalogo"
          listings={featuredListingsQuery.data}
          title="Anuncios recentes e em destaque"
        />
      ) : (
        <PublicEmptyState
          description="Assim que houver anuncios publicados, esta vitrine vai destacar os lotes e equipamentos mais relevantes do portal."
          title="O catalogo publico ainda esta ganhando volume"
        />
      )}

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <PublicSectionHeading
            actions={
              <Button asChild variant="outline">
                <Link to={paths.public.pricing}>Abrir tabela completa</Link>
              </Button>
            }
            description="Acompanhe rapidamente a leitura diaria dos metais e as referencias comerciais publicadas pela operacao."
            eyebrow="Precos"
            title="Ferramenta publica de mercado"
          />

          <Card className="rounded-[1.95rem] border-[#d8e3d8] bg-white shadow-[0_22px_50px_-42px_rgba(19,33,23,0.26)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              {pricingSeriesCatalog.slice(0, 4).map((series) => (
                <div key={series.code} className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fafcf9_0%,#f4f8f3_100%)] p-4">
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

        <Card className="rounded-[1.95rem] border-[#d8e3d8] bg-[linear-gradient(180deg,#173629_0%,#0d241a_100%)] text-white shadow-[0_30px_70px_-40px_rgba(12,34,25,0.9)]">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Badge className="border-white/16 bg-white/8 text-white" variant="outline">
                Atualizacao mais recente
              </Badge>
              <h2 className="font-display text-3xl tracking-tight text-white">
                {formatPricingDate(pricingQuery.data?.latestQuotedDate ?? null)}
              </h2>
              <p className="text-sm leading-7 text-emerald-50/76">
                Ultima consolidacao disponivel do historico publico de precos.
              </p>
            </div>

            <div className="grid gap-3">
              {latestPricingEntries.length > 0 ? (
                latestPricingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{entry.materialName}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-50/66">
                        {entry.regionName ?? 'Brasil'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-white">{entry.priceLabel}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-emerald-50/76">
                  As referencias manuais aparecerao aqui assim que forem publicadas no modulo de precos.
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
                Ver conteudo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
          description="Conteudo editorial para fortalecer confianca, SEO e leitura de mercado no segmento de sucatas e maquinarios."
          eyebrow="Conteudo"
          title="Blog e inteligencia setorial"
        />

        {blogQuery.data?.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {blogQuery.data.slice(0, 3).map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <PublicEmptyState
            description="O blog aparecera aqui com artigos sobre mercado, reciclagem, metais e operacao comercial."
            icon={Newspaper}
            title="Conteudo editorial em preparacao"
          />
        )}
      </section>

      <FaqSection
        description="Respostas objetivas para quem quer entender o funcionamento do portal e negociar com mais confianca."
        items={faqItems}
        title="Perguntas frequentes sobre o portal"
      />

      <CtaBanner
        actionLabel="Criar conta e anunciar"
        actionTo={paths.auth.register}
        description="Publique lotes, sucatas ou maquinarios em uma plataforma construida para o mercado industrial e preparada para operacao real."
        secondaryAction={
          <Button asChild className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" variant="outline">
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
