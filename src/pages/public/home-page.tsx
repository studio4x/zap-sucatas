import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Battery,
  CircleEllipsis,
  CircleHelp,
  Clock3,
  Factory,
  Handshake,
  MapPin,
  Newspaper,
  Recycle,
  ScanSearch,
  Search,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BlogPostCard } from '@/components/public/blog-post-card'
import { FaqSection } from '@/components/public/faq-section'
import { HeroSearchSection } from '@/components/public/hero-search-section'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicBlogPosts } from '@/domains/blog/api'
import { fetchPublicCategories } from '@/domains/categories/api'
import type { PublicListingCategory } from '@/domains/categories/types'
import { fetchFeaturedPublicListings } from '@/domains/listings/api'
import type { Listing } from '@/domains/listings/types'
import { formatListingDate } from '@/domains/listings/utils'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import { formatPricingDate, formatPricingNumber } from '@/domains/pricing/utils'

const faqItems = [
  {
    answer:
      'Você cria sua conta, monta o anúncio com informações comerciais e envia para revisão. Depois da aprovação, o anúncio entra no catálogo público.',
    question: 'Como funciona para anunciar na Zap Sucatas?',
  },
  {
    answer:
      'A busca pública ajuda a filtrar por categoria, material e localização. Cada detalhe de anúncio organiza fotos, descrição, atributos técnicos e perguntas.',
    question: 'Como encontro um lote ou material específico?',
  },
  {
    answer:
      'A tabela pública mostra referências manuais e histórico consolidado de metais, ajudando na leitura comercial do mercado.',
    question: 'A tabela de preços serve como referência de mercado?',
  },
]

const processSteps = [
  {
    description: 'Encontre as melhores ofertas ou anuncie seu estoque com fotos e detalhes técnicos.',
    icon: Search,
    title: 'Busque ou publique',
  },
  {
    description: 'Nossa equipe valida anúncios e perfis para reforçar segurança e qualidade nas negociações.',
    icon: ShieldCheck,
    title: 'Moderação',
  },
  {
    description: 'Conecte-se diretamente com compradores e vendedores e avance na negociação com agilidade.',
    icon: Handshake,
    title: 'Negociação',
  },
]

const categoryIconMap: Record<string, typeof Factory> = {
  baterias: Battery,
  eletronicos: ScanSearch,
  equipamentos: Wrench,
  'equipamentos-industriais': Factory,
  maquinarios: Factory,
  plastico: Recycle,
}

const marketCards = [
  {
    accentClassName: 'text-emerald-300',
    code: 'CU',
    label: 'Cobre LME',
  },
  {
    accentClassName: 'text-emerald-200',
    code: 'AL',
    label: 'Alumínio',
  },
] as const

function getCategoryIcon(category: PublicListingCategory) {
  const normalizedSlug = category.slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return categoryIconMap[normalizedSlug] ?? CircleEllipsis
}

function getListingHref(listing: Listing) {
  return listing.slug ? paths.public.listingDetails(listing.slug) : paths.public.listings
}

function getListingImage(listing: Listing) {
  return listing.images[0]?.publicUrl ?? null
}

function renderMarketBars(barHeights: number[]) {
  return (
    <div className="mt-5 flex h-14 items-end gap-1.5">
      {barHeights.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="block flex-1 rounded-full bg-white/75"
          style={{ height: `${height}px`, opacity: 0.42 + index * 0.08 }}
        />
      ))}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'public'],
    queryFn: fetchPublicCategories,
  })

  const featuredListingsQuery = useQuery({
    queryKey: ['listings', 'public', 'featured-home'],
    queryFn: () => fetchFeaturedPublicListings(4),
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
    .slice(0, 5)

  const featuredListings = featuredListingsQuery.data?.slice(0, 4) ?? []
  const latestPricingEntries = pricingQuery.data?.manualEntries.slice(0, 2) ?? []

  return (
    <div className="space-y-20 pb-6 lg:space-y-24">
      <HeroSearchSection onSearchSubmit={handleHeroSearch} query={query} setQuery={setQuery} />

      <section className="rounded-[2.5rem] bg-secondary/35 px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.2rem]">
              Como o Zap Sucatas funciona
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Um processo simples e transparente para transformar resíduos em receita ou matéria-prima.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon

              return (
                <Card
                  key={step.title}
                  className="relative rounded-[2rem] border-border/80 bg-white/96 text-center shadow-[0_20px_40px_-32px_rgba(19,33,23,0.25)]"
                >
                  <span className="absolute -left-3 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <CardContent className="flex flex-col items-center gap-5 p-8">
                    <span className="inline-flex size-16 items-center justify-center rounded-[1.35rem] bg-accent/75 text-primary">
                      <Icon className="size-7" />
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-display text-[1.75rem] tracking-tight text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.15rem]">
            Categorias estratégicas
          </h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Explore por tipo de material industrial.
          </p>
        </div>

        {highlightedCategories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {highlightedCategories.map((category) => {
              const Icon = getCategoryIcon(category)

              return (
                <Link
                  key={category.id}
                  className="group block"
                  to={paths.public.categoryDetails(category.slug)}
                >
                  <Card className="h-full rounded-[1.7rem] border-border/80 bg-white transition duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_32px_-26px_rgba(19,33,23,0.28)]">
                    <CardContent className="flex flex-col items-center gap-4 p-5 text-center">
                      <span className="inline-flex size-14 items-center justify-center rounded-full bg-background text-primary transition group-hover:bg-accent/75">
                        <Icon className="size-5" />
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-display text-lg tracking-tight text-foreground">{category.name}</h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {category.approvedListings} anúncios
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}

            <Card className="rounded-[1.7rem] border-dashed border-border bg-secondary/30">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-white text-muted-foreground">
                  <CircleEllipsis className="size-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-lg tracking-tight text-foreground">Mais setores</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Carregando...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <PublicEmptyState
            description="As categorias principais aparecerão aqui assim que o catálogo público estiver mais preenchido."
            title="Categorias em preparação"
          />
        )}
      </section>

      <section className="-mx-4 rounded-[2.6rem] bg-white px-4 py-16 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.15rem]">
                Anúncios em destaque
              </h2>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                Leitura rápida dos anúncios e lotes mais relevantes do portal.
              </p>
            </div>

            <Button asChild className="self-start rounded-full px-5" variant="ghost">
              <Link to={paths.public.listings}>
                Ver todos
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featuredListings.map((listing) => {
                const imageUrl = getListingImage(listing)

                return (
                  <Link
                    key={listing.id}
                    className="group block"
                    to={getListingHref(listing)}
                  >
                    <Card className="h-full overflow-hidden rounded-[1.7rem] border-border/80 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_-24px_rgba(19,33,23,0.28)]">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(160deg,#edf4ee_0%,#e0ebe1_100%)]">
                        {imageUrl ? (
                          <img
                            alt={listing.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            src={imageUrl}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Imagem em atualização
                          </div>
                        )}

                        {listing.isFeatured ? (
                          <Badge className="absolute left-3 top-3 border-white/70 bg-white/92 text-foreground" variant="outline">
                            Premium
                          </Badge>
                        ) : null}
                      </div>

                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 text-primary" />
                          <span>
                            {listing.city}, {listing.state}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="line-clamp-2 font-display text-xl tracking-tight text-foreground">
                            {listing.title}
                          </h3>
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {listing.summary || listing.description}
                          </p>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-foreground">
                              {listing.priceLabel ?? 'Sob consulta'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatListingDate(listing.publishedAt)}
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:gap-3">
                            Ver anúncio
                            <ArrowRight className="size-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <PublicEmptyState
              description="Assim que houver anúncios publicados, esta vitrine vai destacar os lotes mais relevantes do portal."
              title="O catálogo público ainda está ganhando volume"
            />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.6rem] bg-[linear-gradient(135deg,#166246_0%,#0f5038_100%)] px-6 py-8 text-white shadow-[0_28px_70px_-42px_rgba(12,60,44,0.8)] md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit border-white/10 bg-white/10 text-white" variant="outline">
              Atualizado em {formatPricingDate(pricingQuery.data?.latestQuotedDate ?? null)}
            </Badge>

            <div className="space-y-3">
              <h2 className="font-display text-3xl tracking-tight text-white sm:text-[2.3rem]">
                Inteligência de mercado
              </h2>
              <p className="max-w-xl text-sm leading-7 text-emerald-50/82 sm:text-base">
                Acompanhe as tendências de preço das principais commodities e referências públicas do mercado de sucata.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-white !text-[#0f5038] hover:bg-white/90" style={{ color: '#0f5038' }}>
                <Link to={paths.public.pricing}>Ver relatório completo</Link>
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-emerald-50/88">
                <Clock3 className="size-4" />
                {latestPricingEntries.length > 0 ? `${latestPricingEntries.length} referências manuais ativas` : 'Novas referências em breve'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {marketCards.map((card, index) => (
              <div
                key={card.code}
                className="rounded-[1.9rem] border border-white/12 bg-white/8 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/86">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {typeof pricingQuery.data?.latestValues[card.code] === 'number'
                        ? formatPricingNumber(pricingQuery.data.latestValues[card.code] ?? 0, 2)
                        : '--'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${card.accentClassName}`}>
                    <TrendingUp className="size-4" />
                    Referência
                  </span>
                </div>
                {renderMarketBars(index === 0 ? [10, 15, 20, 28, 34, 46] : [34, 28, 24, 18, 15, 12])}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.15rem]">
              Conteúdo especializado
            </h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Insights sobre reciclagem, mercado industrial e gestão de resíduos.
            </p>
          </div>

          <Button asChild className="self-start rounded-full px-5" variant="outline">
            <Link to={paths.public.blog}>Ver conteúdo</Link>
          </Button>
        </div>

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
        title="Perguntas frequentes"
      />

      <section className="rounded-[2.6rem] border border-primary/10 bg-accent/55 px-6 py-14 text-center md:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.15rem]">
              Pronto para digitalizar suas negociações?
            </h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Junte-se a empresas que já compram e vendem sucata com mais clareza comercial e operação estruturada.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl px-6">
              <Link to={paths.auth.register}>Criar conta e anunciar</Link>
            </Button>
            <Button asChild className="rounded-xl px-6" variant="outline">
              <Link to={paths.public.support}>
                <CircleHelp className="size-4" />
                Falar com suporte
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
