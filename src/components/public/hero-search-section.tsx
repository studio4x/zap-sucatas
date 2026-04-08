import { Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
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

const trustItems = [
  {
    icon: ShieldCheck,
    label: 'Anúncios moderados',
  },
  {
    icon: Wrench,
    label: 'Sucatas e maquinários',
  },
  {
    icon: Sparkles,
    label: 'Busca rápida de mercado',
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

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card/90 shadow-[0_30px_80px_-40px_rgba(19,33,23,0.28)]">
      <div className="grid gap-10 px-6 py-8 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-12">
        <div className="space-y-7">
          <div className="space-y-4">
            <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
              Portal especializado em sucatas e maquinários
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-4xl tracking-tight text-foreground md:text-5xl xl:text-6xl">
                Encontre sucatas, metais e equipamentos com leitura de mercado real.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                A Zap Sucatas conecta compradores e anunciantes em um catálogo moderado, com
                descoberta rápida, páginas de anúncio robustas e referência diária de preços.
              </p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-background/90 p-3 shadow-sm md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-14 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busque por material, sucata, maquinário ou cidade"
                  value={query}
                />
              </div>
              <Button className="h-14 px-6 text-base" type="submit">
                Buscar anúncios
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Exemplos:</span>
              <button className="font-medium text-foreground hover:text-primary" onClick={() => onSearchSubmit('cobre')} type="button">
                cobre
              </button>
              <button className="font-medium text-foreground hover:text-primary" onClick={() => onSearchSubmit('alumínio')} type="button">
                alumínio
              </button>
              <button className="font-medium text-foreground hover:text-primary" onClick={() => onSearchSubmit('prensa')} type="button">
                prensa
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={paths.public.listings}>Explorar catálogo</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={paths.auth.register}>Quero anunciar</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {trustItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,rgba(245,248,244,0.95),rgba(255,255,255,0.95))] p-5"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
            </div>
          ))}
          <div className="rounded-[1.75rem] border border-border bg-[#163a2d] p-5 text-white shadow-[0_18px_40px_-24px_rgba(22,58,45,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              Mercado vivo
            </p>
            <p className="mt-4 text-3xl font-semibold">Catálogo ativo e leitura operacional.</p>
            <p className="mt-4 text-sm leading-7 text-white/78">
              Busca pública, perguntas, páginas de conversão e referência de preços reunidas no
              mesmo produto.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
