import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Battery,
  CircleEllipsis,
  Factory,
  Handshake,
  MapPin,
  Recycle,
  ScanSearch,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import ctaHandshakeBg from '@/assets/home-bg/cta-handshake-bg.png'
import howItWorksBg from '@/assets/home-bg/how-it-works-bg.jpg'
import { FaqSection } from '@/components/public/faq-section'
import { HeroSearchSection } from '@/components/public/hero-search-section'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPublicCategories } from '@/domains/categories/api'
import type { PublicListingCategory } from '@/domains/categories/types'
import { fetchFeaturedPublicListings } from '@/domains/listings/api'
import type { Listing } from '@/domains/listings/types'
import { formatListingDate } from '@/domains/listings/utils'
import { fetchPublicPricingPageData } from '@/domains/pricing/api'
import { formatPricingDate } from '@/domains/pricing/utils'

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

  function handleHeroSearch(nextQuery: string) {
    const trimmed = nextQuery.trim()
    navigate(trimmed ? `${paths.public.listings}?q=${encodeURIComponent(trimmed)}` : paths.public.listings)
  }

  const highlightedCategories = (categoriesQuery.data ?? [])
    .slice()
    .sort((left, right) => right.approvedListings - left.approvedListings)
    .slice(0, 5)

  const featuredListings = featuredListingsQuery.data?.slice(0, 4) ?? []
  const copperDailyRows = (pricingQuery.data?.historyRows ?? [])
    .filter((row) => row.rowType === 'daily' && typeof row.values.CU === 'number')
    .slice(0, 2)
  const latestCopperDaily = copperDailyRows[0]?.values.CU
  const previousCopperDaily = copperDailyRows[1]?.values.CU

  const copperWeeklyRows = (pricingQuery.data?.historyRows ?? [])
    .filter((row) => row.rowType === 'weekly_average' && typeof row.values.CU === 'number')
    .slice(0, 2)
  const latestCopperWeekly = copperWeeklyRows[0]?.values.CU
  const previousCopperWeekly = copperWeeklyRows[1]?.values.CU

  const copperMonthlyRows = (pricingQuery.data?.historyRows ?? [])
    .filter((row) => row.rowType === 'monthly_average' && typeof row.values.CU === 'number')
    .slice(0, 2)
  const latestCopperMonthly = copperMonthlyRows[0]?.values.CU
  const previousCopperMonthly = copperMonthlyRows[1]?.values.CU

  function formatVariation(current?: number, previous?: number) {
    if (typeof current !== 'number' || typeof previous !== 'number' || previous === 0) {
      return '--'
    }

    const percentage = ((current - previous) / previous) * 100
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(2)}%`
  }

  return (
    <div className="space-y-[3em] pb-6 lg:space-y-[3em]">
      <HeroSearchSection onSearchSubmit={handleHeroSearch} query={query} setQuery={setQuery} />

      <section className="-mx-4 rounded-[2.6rem] border border-border/70 bg-white px-4 py-16 shadow-[0_28px_70px_-42px_rgba(12,60,44,0.14)] md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
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
                      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(160deg,#f0f8ed_0%,#d6ebd1_100%)]">
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

      <section className="space-y-8 rounded-[2.6rem] border border-border/70 bg-white px-5 py-8 shadow-[0_24px_60px_-40px_rgba(12,60,44,0.12)] sm:px-8 lg:px-10 lg:py-10">
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

            <Button
              asChild
              className="h-full min-h-[170px] rounded-[1.7rem] border border-dashed border-border bg-secondary/30 text-foreground hover:bg-secondary/50"
              variant="ghost"
            >
              <Link to={paths.public.categories}>
                Ver todas as categorias
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <PublicEmptyState
            description="As categorias principais aparecerão aqui assim que o catálogo público estiver mais preenchido."
            title="Categorias em preparação"
          />
        )}
      </section>

      <section
        className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-white px-5 py-14 sm:px-8 lg:px-12"
        style={{ backgroundImage: `url(${howItWorksBg})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-5xl space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="font-display text-3xl tracking-tight text-white sm:text-[2.2rem]">
              Como o Zap Sucatas funciona
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
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
                    <span className="inline-flex size-16 items-center justify-center rounded-[1.35rem] bg-primary text-white">
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

      <section className="overflow-hidden rounded-[2.6rem] border border-border/70 bg-white px-6 py-8 text-foreground shadow-[0_28px_70px_-42px_rgba(12,60,44,0.14)] md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit border-primary/15 bg-primary/5 text-primary" variant="outline">
              Atualizado em {formatPricingDate(pricingQuery.data?.latestQuotedDate ?? null)}
            </Badge>

            <div className="space-y-3">
              <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-[2.3rem]">
                Preços LME
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Resumo rápido das variações do cobre para orientar leitura de mercado e negociação.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary !text-white hover:bg-primary/90" style={{ color: '#ffffff' }}>
                <Link to={paths.public.pricing}>Ver relatório completo</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.9rem] border border-border bg-background p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground/80">Variação diária do cobre</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatVariation(latestCopperDaily, previousCopperDaily)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Comparativo do último dia útil</p>
            </div>
            <div className="rounded-[1.9rem] border border-border bg-background p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground/80">Variação semanal do cobre</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatVariation(latestCopperWeekly, previousCopperWeekly)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Comparativo da média semanal</p>
            </div>
            <div className="rounded-[1.9rem] border border-border bg-background p-5 shadow-sm">
              <p className="text-sm font-medium text-foreground/80">Variação mensal do cobre</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatVariation(latestCopperMonthly, previousCopperMonthly)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Comparativo da média mensal</p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection
        description="Respostas objetivas para quem quer entender o funcionamento do portal e negociar com mais confiança."
        items={faqItems}
        title="Perguntas frequentes"
      />
      <div className="-mt-14 flex justify-center">
        <Button asChild className="rounded-xl px-6" variant="outline">
          <Link to={paths.public.support}>Ir para suporte</Link>
        </Button>
      </div>

      <section
        className="relative overflow-hidden rounded-[2.6rem] border border-primary/10 bg-accent/55 px-6 py-14 text-center shadow-[0_24px_60px_-42px_rgba(12,60,44,0.18)] md:px-10"
        style={{ backgroundImage: `url(${ctaHandshakeBg})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,40,31,0.74)_5%,rgba(16,44,34,0.56)_45%,rgba(16,44,34,0.45)_100%)]" />
        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-3xl tracking-tight text-white sm:text-[2.15rem]">
              Pronto para digitalizar suas negociações?
            </h2>
            <p className="text-sm leading-7 text-emerald-50 sm:text-base">
              Junte-se a empresas que já compram e vendem sucata com mais clareza comercial e operação estruturada.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl px-6">
              <Link to={paths.auth.register}>Criar conta e anunciar</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
