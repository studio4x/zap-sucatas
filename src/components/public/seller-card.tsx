import { Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ListingSidebarCard } from '@/components/public/listing-sidebar-card'

type SellerCardProps = {
  contactName: string | null
  contactPhone: string | null
  publishedAtLabel: string
}

export function SellerCard({
  contactName,
  contactPhone,
  publishedAtLabel,
}: SellerCardProps) {
  return (
    <ListingSidebarCard title="Anunciante">
      <div className="flex items-center gap-4 rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fbfcfa_0%,#eef5ef_100%)] p-4">
        <div className="flex size-14 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
          <UserRound className="size-6" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{contactName ?? 'Zap Sucatas'}</p>
          <p className="text-sm text-muted-foreground">Publicado em {publishedAtLabel}</p>
        </div>
      </div>

      <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
        <ShieldCheck className="mr-2 size-3.5" />
        Anuncio moderado pela plataforma
      </Badge>

      <p className="text-sm leading-7 text-muted-foreground">
        Esta pagina organiza dados comerciais, atributos tecnicos e perguntas publicas para apoiar uma negociacao mais segura e objetiva.
      </p>

      {contactPhone ? (
        <div className="inline-flex items-center gap-2 font-medium text-foreground">
          <Phone className="size-4 text-primary" />
          {contactPhone}
        </div>
      ) : null}
    </ListingSidebarCard>
  )
}
