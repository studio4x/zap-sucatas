import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Factory, ShieldCheck, Waypoints } from 'lucide-react'
import { CtaBanner } from '@/components/public/cta-banner'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Card, CardContent } from '@/components/ui/card'
import { paths } from '@/app/paths'
import { fetchSystemSettings } from '@/domains/settings/api'

const pillars = [
  {
    description: 'Portal focado em sucatas, metais, reciclagem e maquinários, sem dispersar o produto para segmentos genéricos.',
    icon: Factory,
    title: 'Especialização setorial',
  },
  {
    description: 'A plataforma combina catálogo público, páginas de anúncio detalhadas, blog e leitura de preços para apoiar a negociação.',
    icon: Waypoints,
    title: 'Produto orientado a mercado',
  },
  {
    description: 'A moderação dos anúncios ajuda a elevar confiança, reduzir ruído e organizar melhor a experiência do portal.',
    icon: ShieldCheck,
    title: 'Confiança operacional',
  },
]

export function AboutPage() {
  const settingsQuery = useQuery({
    queryKey: ['system-settings', 'public-about'],
    queryFn: fetchSystemSettings,
  })

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="A Zap Sucatas nasce para elevar a experiência digital do mercado de sucatas e maquinários, unindo descoberta, confiança comercial e leitura operacional."
        eyebrow="Sobre a plataforma"
        title="Um portal comercial construído para o mercado industrial"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {pillars.map(({ description, icon: Icon, title }) => (
          <Card key={title} className="border-border/80">
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

      <Card className="border-border/80">
        <CardContent className="space-y-5 p-6 md:p-8">
          <p className="text-base leading-8 text-foreground/90">
            Mais do que uma página institucional, a Zap Sucatas foi desenhada como um produto
            comercial: busca pública, categorias, páginas de anúncio robustas, perguntas, conteúdo
            editorial e leitura de preços convivem no mesmo ecossistema.
          </p>
          <p className="text-base leading-8 text-foreground/90">
            O objetivo é tornar a negociação mais clara, previsível e confiável para quem compra e
            para quem vende. A interface pública prioriza catálogo vivo, navegação rápida e CTA
            constante para anunciar.
          </p>
          {settingsQuery.data ? (
            <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-5 text-sm leading-7 text-muted-foreground">
              <p className="font-semibold text-foreground">Contato operacional atual</p>
              <p className="mt-2">
                {settingsQuery.data.supportEmail ?? 'E-mail em atualização'} ·{' '}
                {settingsQuery.data.supportPhone ?? 'Telefone em atualização'}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CtaBanner
        actionLabel="Criar conta"
        actionTo={paths.auth.register}
        description="Se você movimenta sucatas, metais ou equipamentos, publique seus anúncios em uma plataforma desenhada para descoberta comercial."
        secondaryAction={
          <div className="inline-flex items-center gap-2 text-sm text-white/80">
            <CheckCircle2 className="size-4" />
            Catálogo moderado e navegação orientada a mercado
          </div>
        }
        title="Quer anunciar em um ambiente mais organizado e confiável?"
      />
    </div>
  )
}
