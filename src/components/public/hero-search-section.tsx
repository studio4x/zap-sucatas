import { ChevronRight, MapPinned, Search, ShieldCheck, Tractor, TrendingUp, Wrench } from 'lucide-react'
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

const quickSearches = ['cobre', 'alumínio', 'prensa enfardadeira', 'sucata ferrosa', 'empilhadeira']

const marketSignals = [
  {
    icon: ShieldCheck,
    label: 'Anúncios moderados',
    value: 'Mais confiança para negociar',
  },
  {
    icon: Wrench,
    label: 'Categorias especializadas',
    value: 'Sucatas, metais e maquinários',
  },
  {
    icon: TrendingUp,
    label: 'Leitura de mercado',
    value: 'Tabela pública de preços',
  },
]

const marketBoardItems = [
  'Metais ferrosos e não ferrosos',
  'Equipamentos industriais e lotes',
  'Compra, venda e giro de estoque',
]

const regionalFootprint = ['Sudeste', 'Sul', 'Centro-Oeste', 'Nordeste']

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
    <section className="relative overflow-hidden rounded-[2.5rem] border border-[#d7e0d8] bg-[linear-gradient(135deg,#f7faf7_0%,#eef3ef_42%,#f9fbf8_100%)] shadow-[0_40px_110px_-52px_rgba(19,33,23,0.42)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,110,72,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(11,83,59,0.12),transparent_32%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[linear-gradient(180deg,rgba(17,53,39,0.96),rgba(11,35,26,0.92))] lg:block" />
      <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-[linear-gradient(90deg,rgba(12,39,28,0),rgba(12,39,28,0.24)_18%,rgba(12,39,28,0.12)_100%)] lg:block" />
      <div className="absolute right-[6%] top-[10%] hidden h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl lg:block" />
      <div className="absolute bottom-[8%] right-[16%] hidden h-32 w-32 rounded-full bg-white/10 blur-3xl lg:block" />

      <div className="relative grid gap-8 px-5 py-6 sm:px-6 sm:py-8 md:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:px-10 lg:py-10 xl:px-12 xl:py-12">
        <div className="space-y-7">
          <div className="space-y-5">
            <Badge className="rounded-full border-emerald-700/15 bg-emerald-700/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-900" variant="outline">
              Marketplace nacional de sucatas, metais e maquinários
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-4xl leading-[0.95] tracking-[-0.04em] text-slate-950 sm:text-[3.25rem] lg:text-[4.2rem]">
                Encontre e anuncie sucatas, metais e equipamentos com cara de mercado real.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-700 lg:text-[17px]">
                A Zap Sucatas reúne compradores e anunciantes em um portal especializado, com catálogo moderado,
                busca rápida por material e região e páginas de anúncio construídas para negociação comercial.
              </p>
            </div>
          </div>

          <form
            className="overflow-hidden rounded-[2rem] border border-[#d8e3db] bg-white/96 shadow-[0_24px_54px_-28px_rgba(19,33,23,0.38)]"
            onSubmit={handleSubmit}
          >
            <div className="border-b border-[#e5ece6] px-5 py-4 sm:px-6">
              <p className="text-sm font-semibold text-slate-950">Comece pela busca principal do portal</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Pesquise por material, sucata, lote, máquina, cidade ou operação que você precisa destravar agora.
              </p>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-16 rounded-[1.4rem] border border-[#d8e3db] bg-[#fbfcfb] pl-14 pr-5 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-700/25"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ex.: cobre mel, sucata ferrosa, empilhadeira, prensa, São Paulo"
                    value={query}
                  />
                </div>
                <Button className="h-16 rounded-[1.4rem] px-7 text-base font-semibold" type="submit">
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
                    className="inline-flex items-center rounded-full border border-[#d8e3db] bg-[#f7faf7] px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-700/25 hover:bg-emerald-700/6 hover:text-emerald-900"
                    onClick={() => handleQuickSearch(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#e5ece6] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2.5">
                  {marketSignals.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-3 rounded-full border border-[#dfe8e0] bg-[#f8fbf8] px-3.5 py-2.5"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-800">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
                        <span className="text-sm font-medium text-slate-900">{value}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <Button asChild className="h-12 rounded-full px-5" variant="outline">
                  <Link to={paths.auth.register}>
                    Anunciar agora
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="relative overflow-hidden rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(17,53,39,0.96),rgba(11,35,26,0.92))] p-5 text-white shadow-[0_34px_72px_-34px_rgba(11,35,26,0.95)] sm:p-6 lg:min-h-[540px]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.05))]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/82">
                <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5">Catálogo ativo</span>
                <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1.5">Negociação especializada</span>
              </div>

              <div className="space-y-4">
                <p className="max-w-md text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[2.2rem]">
                  Um portal feito para girar estoque, lotes e oportunidades do mercado industrial.
                </p>
                <p className="max-w-md text-sm leading-7 text-emerald-50/78 sm:text-[15px]">
                  Quem compra encontra volume e contexto. Quem anuncia ganha uma vitrine especializada, com foco em busca,
                  descoberta e contato comercial.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/74">Sinais de confiança</p>
                <div className="mt-3 space-y-3">
                  {marketBoardItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white/88">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/74">Cobertura comercial</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {regionalFootprint.map((region) => (
                    <span
                      key={region}
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/10 px-3 py-2 text-sm text-white/86"
                    >
                      <MapPinned className="size-3.5 text-emerald-300" />
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.45rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/74">Busca central</p>
                <p className="mt-2 text-sm leading-6 text-white/88">O portal foi desenhado para começar pela procura certa.</p>
              </div>
              <div className="rounded-[1.45rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/74">Mercado técnico</p>
                <p className="mt-2 text-sm leading-6 text-white/88">Sucatas, metais, equipamentos e leitura operacional no mesmo fluxo.</p>
              </div>
              <div className="rounded-[1.45rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/74">Anuncie melhor</p>
                <p className="mt-2 text-sm leading-6 text-white/88">Páginas robustas para apresentar lotes, máquinas e oportunidades reais.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5 text-sm text-white/80">
              <span className="inline-flex items-center gap-2 font-medium text-white">
                <Tractor className="size-4 text-emerald-300" />
                Maquinários e equipamentos
              </span>
              <span className="inline-flex items-center gap-2 font-medium text-white">
                <TrendingUp className="size-4 text-emerald-300" />
                Referência pública de preços
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
