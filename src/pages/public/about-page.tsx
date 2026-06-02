import { CheckCircle2, Eye, Gem, Target } from 'lucide-react'
import { paths } from '@/app/paths'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import quemSomosImage from '@/assets/about/quem-somos.png'

const principles = [
  {
    description:
      'Comercializar sucatas com excelencia operacional, elevando transparência, previsibilidade e confianca na negociação.',
    icon: Target,
    title: 'Missao',
  },
  {
    description:
      'Ser referência nacional em marketplace de sucatas, conectando vendedores e compradores com inteligencia de mercado.',
    icon: Eye,
    title: 'Visao',
  },
  {
    description:
      'Etica, transparência, comprometimento, sustentabilidade e foco no cliente em cada interação da plataforma.',
    icon: Gem,
    title: 'Valores',
  },
]

const highlights = [
  { label: 'Metais reciclados (ton)', value: '500.000+' },
  { label: 'Anos de atuação no setor', value: '20+' },
  { label: 'Parceiros satisfeitos', value: '2.500+' },
]

export function AboutPage() {
  return (
    <div className="space-y-10 lg:space-y-12">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <img
          alt="Patio industrial com separação de sucatas e operação de reciclagem"
          className="h-[420px] w-full object-cover md:h-[560px]"
          src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1800&q=80"
        />
        <div className="absolute inset-0 bg-[#05220f]/62" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="px-6 md:px-10">
            <div className="mx-auto max-w-3xl space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/85">
                Sobre a plataforma
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-6xl">
                Transformando o futuro da reciclagem com comércio digital inteligente
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-white/88 md:text-lg">
                A Zap Sucatas une experiencia setorial, tecnologia e leitura de mercado para tornar a negociação de
                sucatas mais clara, rápida e confiavel.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="overflow-hidden rounded-[2rem] shadow-[0_26px_60px_-42px_rgba(19,33,23,0.35)]">
          <img
            alt="Equipe operacional em patio de reciclagem e classificação de metais"
            className="h-[420px] w-full object-cover"
            src={quemSomosImage}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">Quem somos</h2>
          <p className="text-base leading-8 text-foreground/90">
            A Zap Sucatas nasce para elevar a experiencia digital do mercado de sucatas, metais e reciclaveis. O foco
            e claro: menos portal generico, mais estrutura comercial real para o setor.
          </p>
          <p className="text-base leading-8 text-foreground/90">
            A plataforma combina catálogo público, páginas de anúncio detalhadas, conteúdo editorial e leitura de
            preços para apoiar decisão de compra e venda em um unico ecossistema.
          </p>
          <p className="text-base font-semibold leading-8 text-primary">
            Nossa paixao e transformar residuos em oportunidade com transparência e eficiencia operacional.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
          Missao, visao e valores
        </h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {principles.map(({ description, icon: Icon, title }) => (
            <Card key={title} className="rounded-[1.7rem] border-0 bg-card shadow-[0_22px_50px_-38px_rgba(19,33,23,0.34)]">
              <CardContent className="space-y-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-[#0b2a18] px-6 py-10 text-white shadow-[0_34px_70px_-44px_rgba(6,20,12,0.75)] md:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          {highlights.map((item) => (
            <div className="text-center" key={item.label}>
              <p className="text-4xl font-semibold tracking-[-0.03em] text-[#a0f790] md:text-5xl">{item.value}</p>
              <p className="mt-2 text-sm text-white/80 md:text-base">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(22,98,70,0.98),rgba(12,60,44,0.96))] text-primary-foreground shadow-[0_24px_60px_-28px_rgba(12,60,44,0.75)]">
        <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/75">
              Anunciar na plataforma
            </p>
            <h3 className="font-display text-3xl tracking-tight md:text-4xl">
              Faça parte da mudança no mercado de sucatas
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-primary-foreground/86">
              Se você movimenta sucatas e metais, publique anúncios em um ambiente com descoberta comercial e leitura
              de mercado.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="size-4" />
              Plataforma especializada, moderada e orientada a resultado
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              asChild
              className="h-14 min-w-[220px] rounded-2xl bg-white px-10 text-base font-semibold !text-[#0f3a29] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)] hover:bg-white/92"
              style={{ color: '#0f3a29' }}
            >
              <Link to={paths.auth.register}>Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}