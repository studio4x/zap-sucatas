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
      <div className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-secondary/45 p-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{contactName ?? 'Anunciante verificado'}</p>
          <p className="text-sm text-muted-foreground">Publicado em {publishedAtLabel}</p>
        </div>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground">
        <Badge variant="outline" className="border-primary/15 bg-primary/5 text-primary">
          <ShieldCheck className="mr-2 size-3.5" />
          Anúncio moderado pela plataforma
        </Badge>
        <p>
          Use a página para entender o lote, validar informações e entrar em contato de forma mais
          segura.
        </p>
        {contactPhone ? (
          <div className="inline-flex items-center gap-2 font-medium text-foreground">
            <Phone className="size-4 text-primary" />
            {contactPhone}
          </div>
        ) : null}
      </div>
    </ListingSidebarCard>
  )
}
