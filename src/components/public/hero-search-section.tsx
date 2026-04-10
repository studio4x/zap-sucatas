import { ArrowUpRight, Search, ShieldCheck, TrendingUp, Wrench } from 'lucide-react'
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

const quickSearches = ['cobre', 'aluminio', 'sucata ferrosa', 'prensa', 'empilhadeira']

const trustItems = [
  'Anuncios moderados antes da publicacao',
  'Catalogo especializado em sucatas, metais e maquinarios',
  'Tabela de precos e conteudo para leitura de mercado',
]

const marketSignals = [
  {
    icon: ShieldCheck,
    title: 'Operacao moderada',
    text: 'Mais confianca para navegar e negociar no portal.',
  },
  {
    icon: Wrench,
    title: 'Recorte industrial real',
    text: 'Metais, lotes, sucatas e equipamentos no mesmo fluxo comercial.',
  },
  {
    icon: TrendingUp,
    title: 'Leitura de mercado',
    text: 'Preco, conteudo e catalogo integrados na descoberta.',
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
    <section className="-mx-4 overflow-hidden border-y border-[#dce5dc] bg-[linear-gradient(180deg,#f4f8f3_0%,#eef4ef_54%,#f8faf7_100%)] md:-mx-6 lg:-mx-8">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(31,99,69,0.18),transparent_28%),radial-gradient(circle_at_100%_12%,rgba(18,54,39,0.18),transparent_22%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(19,54,40,0.16),transparent)]" />

        <div className="relative mx-auto max-w-[1440px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,0.88fr)] lg:items-end">
            <div className="space-y-7">
              <div className="space-y-5">
                <Badge className="rounded-full border-emerald-800/12 bg-emerald-800/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-950" variant="outline">
                  Marketplace especializado em sucatas, metais e maquinarios
                </Badge>

                <div className="space-y-4">
                  <h1 className="max-w-5xl font-display text-4xl leading-[0.92] tracking-[-0.05em] text-slate-950 sm:text-[3.4rem] lg:text-[4.9rem]">
                    Busque lotes, sucatas e equipamentos em um portal comercial feito para o setor.
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-slate-700 lg:text-[17px]">
                    A Zap Sucatas conecta compradores e anunciantes em um catalogo moderado, com busca protagonista, paginas de anuncio fortes e sinais reais de mercado.
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3 rounded-[1.85rem] bg-white/92 p-3 shadow-[0_28px_60px_-40px_rgba(19,33,23,0.3)] ring-1 ring-[#dce5dc] backdrop-blur-sm md:p-4 xl:flex-row xl:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-16 rounded-[1.25rem] border-0 bg-[#f9fbf8] pl-14 pr-5 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-700/25"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Busque por material, sucata, maquina, lote ou cidade"
                      value={query}
                    />
                  </div>
                  <Button className="h-16 rounded-[1.25rem] px-7 text-base font-semibold" type="submit">
                    Explorar anuncios
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Buscas rapidas
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
                  <Link to={paths.public.listings}>Explorar catalogo</Link>
                </Button>
                <Button asChild className="h-12 rounded-full px-6" variant="outline">
                  <Link to={paths.auth.register}>
                    Anunciar agora
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-[#d5e0d5] bg-white/78 p-5 shadow-[0_24px_56px_-44px_rgba(19,33,23,0.28)] backdrop-blur-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
                  Sinais de confianca
                </p>
                <p className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-foreground">
                  Menos vitrine institucional. Mais catalogo vivo, busca e operacao comercial.
                </p>
              </div>

              <div className="grid gap-3">
                {marketSignals.map(({ icon: Icon, text, title }) => (
                  <div key={title} className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fbfdfb_0%,#f3f7f2_100%)] p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{title}</p>
                        <p className="text-sm leading-7 text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/80 pt-4">
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
