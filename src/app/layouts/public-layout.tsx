import { ChartNoAxesColumn, ShieldCheck, UserRound } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { SiteFooter } from '@/components/public/site-footer'
import { SiteHeader } from '@/components/public/site-header'

const highlights = [
  {
    title: 'Area publica',
    description: 'Home comercial, catalogo, conteudo e rotas institucionais.',
    icon: UserRound,
  },
  {
    title: 'Dashboard',
    description: 'Jornada do anunciante com anuncios, perguntas e configuracoes.',
    icon: ChartNoAxesColumn,
  },
  {
    title: 'Admin',
    description: 'Backoffice para moderacao, catalogo, blog, precos e auditoria.',
    icon: ShieldCheck,
  },
]

export function PublicLayout() {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background/85 shadow-[0_24px_80px_rgba(17,24,39,0.12)] backdrop-blur">
        <SiteHeader />

        <main className="flex-1 px-6 py-8 lg:px-8 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="min-w-0">
              <Outlet />
            </div>

            <aside className="grid gap-4 self-start">
              {highlights.map(({ description, icon: Icon, title }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display text-lg text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </aside>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
