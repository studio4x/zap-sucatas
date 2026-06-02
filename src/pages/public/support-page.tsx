import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, LifeBuoy, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { SupportTicketModal } from '@/components/support/support-ticket-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchSupportConfig } from '@/domains/support/api'
import { useAuth } from '@/hooks/use-auth'
import { defaultSupportConfig, getSupportCategoryMeta, supportFaqItems } from '@/lib/support-sla'

export function SupportPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'account' | 'general' | 'payment' | 'technical'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const configQuery = useQuery({
    queryKey: ['support', 'config', 'public-page'],
    queryFn: fetchSupportConfig,
  })

  const config = configQuery.data ?? defaultSupportConfig
  const filteredFaq = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return supportFaqItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' ? true : item.category === activeCategory
      const haystack = `${item.question} ${item.answer}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-[2.25rem] border border-border bg-white px-5 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-[1.6rem] bg-primary text-primary-foreground shadow-sm">
            <LifeBuoy className="size-7" />
          </div>
          <div className="space-y-3">
            <h1 className="font-display text-4xl leading-[0.95] tracking-[-0.05em] text-foreground sm:text-[3.7rem]">Como podemos ajudar?</h1>
            <p className="mx-auto max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Consulte o SLA público, filtre as perguntas frequentes e abra um chamado quando precisar de apoio operacional da equipe da Zap Sucatas.
            </p>
          </div>
          <div className="relative mx-auto max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input className="h-14 w-full rounded-[1.35rem] border border-input bg-background pl-12 pr-4 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por pergunta ou resposta" value={query} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="rounded-[1.8rem] border-border/80">
          <CardContent className="space-y-3 p-4">
            <button className={`w-full rounded-[1rem] px-4 py-3 text-left text-sm font-medium transition ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} onClick={() => setActiveCategory('all')} type="button">Todas as categorias</button>
            {config.categories.map((category) => (
              <button className={`w-full rounded-[1rem] px-4 py-3 text-left text-sm font-medium transition ${activeCategory === category.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} key={category.key} onClick={() => setActiveCategory(category.key)} type="button">{category.label}</button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredFaq.map((item) => (
            <details className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm" key={item.id}>
              <summary className="cursor-pointer list-none pr-4 text-base font-semibold text-foreground">{item.question}</summary>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.answer}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{getSupportCategoryMeta(config, item.category).label}</p>
            </details>
          ))}

          {filteredFaq.length === 0 ? (
            <Card className="rounded-[1.8rem] border-dashed border-border">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <CircleHelp className="size-10 text-muted-foreground/60" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum resultado encontrado</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Ajuste a busca ou abra um chamado para falar com a equipe operacional.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <Card className="overflow-hidden rounded-[2rem] border-border/80">
        <CardContent className="grid gap-5 px-6 py-7 md:grid-cols-[8px_minmax(0,1fr)_auto] md:items-center md:px-8">
          <div className="hidden rounded-full bg-primary md:block" />
          <div>
            <h2 className="font-display text-3xl tracking-tight text-foreground">Ainda precisa de ajuda?</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Abra um chamado com contexto, urgência e anexos. O histórico fica disponível na area autenticada.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setIsModalOpen(true)} type="button">Abrir um chamado</Button>
            {user?.profileId ? <Button asChild type="button" variant="outline"><Link to={paths.app.support}>Ver histórico de chamados</Link></Button> : null}
          </div>
        </CardContent>
      </Card>

      <SupportTicketModal initialStep="form" onOpenChange={setIsModalOpen} open={isModalOpen} />
    </div>
  )
}