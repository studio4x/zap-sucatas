import { useQuery } from '@tanstack/react-query'
import { Mail, Phone } from 'lucide-react'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Card, CardContent } from '@/components/ui/card'
import { fetchSystemSettings } from '@/domains/settings/api'

export function ContactPage() {
  const settingsQuery = useQuery({
    queryKey: ['system-settings', 'public-contact'],
    queryFn: fetchSystemSettings,
  })

  const supportEmail = settingsQuery.data?.supportEmail ?? 'faleconosco@zapsucatas.com.br'
  const supportPhone = settingsQuery.data?.supportPhone ?? '(em atualização)'

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Fale com a equipe da Zap Sucatas para dúvidas comerciais, suporte de plataforma e orientação sobre publicação de anúncios."
        eyebrow="Contato"
        title="Canal direto com a operação"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardContent className="space-y-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">E-mail comercial</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Use este canal para dúvidas sobre anúncios, operação do portal e oportunidades
              comerciais.
            </p>
            <a className="text-base font-semibold text-primary" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Telefone de suporte</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Contato rápido para encaminhamento comercial e orientação sobre o uso da plataforma.
            </p>
            <a className="text-base font-semibold text-primary" href={`tel:${supportPhone}`}>
              {supportPhone}
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardContent className="space-y-4 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">Como podemos ajudar?</h2>
          <p className="text-base leading-8 text-foreground/90">
            A Zap Sucatas está estruturada para funcionar como portal comercial especializado. Se
            você precisa de ajuda para anunciar, entender a moderação, consultar preços ou entrar
            em contato com a operação, este é o ponto de partida.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
