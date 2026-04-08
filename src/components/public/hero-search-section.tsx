import { ArrowUpRight, MapPinned, Search, ShieldCheck, TrendingUp, Wrench } from 'lucide-react'
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

const quickSearches = ['cobre', 'alumínio', 'prensa', 'sucata ferrosa', 'empilhadeira']

const trustItems = [
  {
    icon: ShieldCheck,
    text: 'Anúncios moderados antes da publicação',
  },
  {
    icon: Wrench,
    text: 'Sucatas, metais e maquinários no mesmo portal',
  },
  {
    icon: TrendingUp,
    text: 'Referência pública de preços para leitura de mercado',
  },
]

const regions = ['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste']

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
    <section className="-mx-4 overflow-hidden border-y border-[#dce5dc] bg-[linear-gradient(180deg,#f5f8f4_0%,#eef4ef_38%,#f8faf7_100%)] md:-mx-6 lg:-mx-8">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,99,69,0.18),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(16,54,39,0.18),transparent_24%),linear-gradient(90deg,rgba(11,39,28,0)_0%,rgba(11,39,28,0.04)_48%,rgba(11,39,28,0.12)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(180deg,rgba(19,54,40,0.94),rgba(12,34,25,0.98))] lg:block" />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:34px_34px] lg:block" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-10 md:px-6 md:py-12 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:px-8 lg:py-16">
          <div className="space-y-8 lg:pr-12">
            <div className="space-y-5">
              <Badge className="rounded-full border-emerald-800/12 bg-emerald-800/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-950" variant="outline">
                Portal especializado em sucatas, metais e maquinários
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-4xl font-display text-4xl leading-[0.92] tracking-[-0.045em] text-slate-950 sm:text-[3.3rem] lg:text-[4.4rem]">
                  O marketplace para buscar e anunciar sucatas, metais e equipamentos industriais.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-700 lg:text-[17px]">
                  A Zap Sucatas conecta compradores e anunciantes em um catálogo moderado, com busca rápida,
                  páginas comerciais robustas e leitura de mercado orientada ao setor.
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 rounded-[1.75rem] bg-white/92 p-3 shadow-[0_22px_48px_-30px_rgba(19,33,23,0.32)] ring-1 ring-[#dce5dc] backdrop-blur-sm md:p-4 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-16 rounded-[1.25rem] border-0 bg-[#f9fbf8] pl-14 pr-5 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-700/25"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Busque por material, sucata, máquina, lote ou cidade"
                    value={query}
                  />
                </div>
                <Button className="h-16 rounded-[1.25rem] px-7 text-base font-semibold" type="submit">
                  Explorar anúncios
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Buscas rápidas
                </span>
                {quickSearches.map((term) => (
                  <button
                    key={term}
                    className="rounded-full bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-[#dce5dc] transition hover:bg-emerald-800/8 hover:text-emerald-950"
                    onClick={() => handleQuickSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-12 rounded-full px-6">
                <Link to={paths.public.listings}>Explorar catálogo</Link>
              </Button>
              <Button asChild className="h-12 rounded-full px-6" variant="outline">
                <Link to={paths.auth.register}>
                  Anunciar agora
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 border-t border-[#d9e3da] pt-5 sm:grid-cols-3">
              {trustItems.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-800/10 text-emerald-900">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(19,54,40,0.96),rgba(12,34,25,0.98))] p-6 text-white shadow-[0_30px_72px_-36px_rgba(12,34,25,0.9)] lg:mt-0 lg:min-h-[520px] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="space-y-8 lg:ml-auto lg:flex lg:h-full lg:max-w-[420px] lg:flex-col lg:justify-between lg:py-2">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/72">
                  Mercado vivo
                </p>
                <p className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.35rem]">
                  Um portal pensado para girar estoque, lotes e oportunidades reais do setor.
                </p>
                <p className="text-sm leading-7 text-emerald-50/76">
                  Menos vitrine institucional. Mais busca, catálogo ativo, negociação e presença nacional.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <span
                      key={region}
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm text-white/86 backdrop-blur-sm"
                    >
                      <MapPinned className="size-3.5 text-emerald-300" />
                      {region}
                    </span>
                  ))}
                </div>

                <div className="space-y-3 border-t border-white/12 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/72">
                    O que você encontra aqui
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-white/88">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      <span>Metais ferrosos e não ferrosos</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/88">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      <span>Máquinas, equipamentos e lotes industriais</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/88">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      <span>Referência pública de preços para leitura comercial</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
