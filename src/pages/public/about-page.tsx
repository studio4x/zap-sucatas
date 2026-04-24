import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Factory, ShieldCheck, Waypoints } from 'lucide-react'
import { paths } from '@/app/paths'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Card, CardContent } from '@/components/ui/card'
import { fetchSystemSettings } from '@/domains/settings/api'

const pillars = [
  {
    description: 'Portal focado em sucatas, metais e recicláveis, sem dispersar o produto para segmentos genéricos.',
    icon: Factory,
    title: 'Especializacao setorial',
  },
  {
    description: 'A plataforma combina catalogo publico, paginas de anuncio detalhadas, blog e leitura de precos para apoiar a negociacao.',
    icon: Waypoints,
    title: 'Produto orientado a mercado',
  },
  {
    description: 'A moderacao dos anuncios ajuda a elevar confianca, reduzir ruido e organizar melhor a experiencia do portal.',
    icon: ShieldCheck,
    title: 'Confianca operacional',
  },
]

export function AboutPage() {
  const settingsQuery = useQuery({
    queryKey: ['system-settings', 'public-about'],
    queryFn: fetchSystemSettings,
  })

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="overflow-hidden rounded-[2.2rem] border border-[#d8e3d8] bg-[linear-gradient(180deg,#f8fbf7_0%,#f2f6f1_100%)]">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <PublicSectionHeading
              description="A Zap Sucatas nasce para elevar a experiência digital do mercado de sucatas, unindo descoberta, confiança comercial e leitura operacional."
              eyebrow="Sobre a plataforma"
              title="Um portal comercial construido para o mercado industrial"
            />
          </div>

          <Card className="rounded-[1.8rem] border-[#d8e3d8] bg-[linear-gradient(180deg,#173629_0%,#0d241a_100%)] text-white shadow-[0_30px_70px_-40px_rgba(12,34,25,0.9)]">
            <CardContent className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/72">
                Direcao do produto
              </p>
              <p className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">
                Menos site institucional. Mais estrutura de marketplace real para o setor.
              </p>
              <p className="text-sm leading-7 text-emerald-50/78">
                Busca, catalogo, detalhe de anuncio, conteudo e precos convivem no mesmo ecossistema comercial.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {pillars.map(({ description, icon: Icon, title }) => (
          <Card key={title} className="rounded-[1.85rem] border-border/80">
            <CardContent className="space-y-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.95rem] border-border/80">
        <CardContent className="space-y-5 p-6 md:p-8">
          <p className="text-base leading-8 text-foreground/90">
            Mais do que uma pagina institucional, a Zap Sucatas foi desenhada como um produto comercial: busca publica, categorias, paginas de anuncio robustas, perguntas, conteudo editorial e leitura de precos convivem no mesmo ecossistema.
          </p>
          <p className="text-base leading-8 text-foreground/90">
            O objetivo e tornar a negociacao mais clara, previsivel e confiavel para quem compra e para quem vende. A interface publica prioriza catalogo vivo, navegacao rapida e CTA constante para anunciar.
          </p>
          {settingsQuery.data ? (
            <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-5 text-sm leading-7 text-muted-foreground">
              <p className="font-semibold text-foreground">Contato operacional atual</p>
              <p className="mt-2">
                {settingsQuery.data.supportEmail ?? 'E-mail em atualizacao'} ·{' '}
                {settingsQuery.data.supportPhone ?? 'Telefone em atualizacao'}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CtaBanner
        actionLabel="Criar conta"
        actionTo={paths.auth.register}
        description="Se você movimenta sucatas e metais, publique seus anúncios em uma plataforma desenhada para descoberta comercial."
        secondaryAction={
          <div className="inline-flex items-center gap-2 text-sm text-white/80">
            <CheckCircle2 className="size-4" />
            Catalogo moderado e navegacao orientada a mercado
          </div>
        }
        title="Quer anunciar em um ambiente mais organizado e confiavel?"
      />
    </div>
  )
}
