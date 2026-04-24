import { Search, ShieldCheck, TrendingUp, Wrench } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type HeroSearchSectionProps = {
  onSearchSubmit: (query: string) => void
  query: string
  setQuery: (value: string) => void
}

const quickSearches = ['cobre', 'alumínio', 'sucata ferrosa', 'prensa', 'empilhadeira']

const trustItems = [
  'Anúncios moderados antes da publicação',
  'Catálogo especializado no mercado de sucatas',
  'Tabela de preços e conteúdo para leitura de mercado',
]

const marketSignals = [
  {
    icon: ShieldCheck,
    title: 'Operação moderada',
    text: 'Mais confiança para navegar e negociar no portal.',
  },
  {
    icon: Wrench,
    title: 'Recorte industrial real',
    text: 'Sucatas, metais e recicláveis em um fluxo comercial especializado.',
  },
  {
    icon: TrendingUp,
    title: 'Leitura de mercado',
    text: 'Preço, conteúdo e catálogo integrados na descoberta.',
  },
]

export function HeroSearchSection({
  onSearchSubmit,
  query,
  setQuery,
}: HeroSearchSectionProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchSubmit(query)
  }

  function handleQuickSearch(term: string) {
    setQuery(term)
    onSearchSubmit(term)
  }

  return (
    <section className="-mx-4 overflow-hidden border-y border-[#dce5dc] bg-[linear-gradient(180deg,#f6f8f3_0%,#f1f5ef_60%,#f8faf7_100%)] md:-mx-6 lg:-mx-8">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(31,99,69,0.1),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(18,54,39,0.06),transparent_24%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(19,54,40,0.16),transparent)]" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-16 text-center md:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-5">
              <Badge className="rounded-full border-emerald-800/12 bg-emerald-800/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-950" variant="outline">
                  Marketplace especializado em sucatas
              </Badge>

              <div className="space-y-4">
                <h1 className="mx-auto max-w-3xl font-display text-4xl leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-[3.2rem] lg:text-[4.25rem]">
                  Compre e venda sucatas com inteligência.
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                  Conectamos geradores de resíduos industriais a compradores qualificados em um marketplace transparente e eficiente para o mercado de sucatas.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-full bg-white/95 p-2 shadow-[0_20px_50px_-36px_rgba(19,33,23,0.28)] ring-1 ring-[#dce5dc] backdrop-blur-sm sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-14 rounded-full border-0 bg-transparent pl-14 pr-5 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="O que você está procurando hoje?"
                    value={query}
                  />
                </div>
                <Button className="h-12 rounded-full px-7 text-sm font-semibold sm:h-11" type="submit">
                  Buscar
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="h-11 rounded-xl px-6">
                  <Link to={paths.public.listings}>Explorar anúncios</Link>
                </Button>
                <Button asChild className="h-11 rounded-xl border-accent bg-accent/80 px-6 text-primary hover:bg-accent" variant="outline">
                  <Link to={paths.auth.register}>Anunciar agora</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Buscas rápidas
                </span>
                {quickSearches.map((term) => (
                  <button
                    key={term}
                    className="rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-[#dce5dc] transition hover:bg-emerald-800/8 hover:text-emerald-950"
                    onClick={() => handleQuickSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm text-slate-600">
              {marketSignals.map(({ icon: Icon, title }) => (
                <div key={title} className="inline-flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <span>{title}</span>
                </div>
              ))}
              {trustItems.slice(0, 1).map((item) => (
                <div key={item} className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
