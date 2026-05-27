import { Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ListingSidebarCard } from '@/components/public/listing-sidebar-card'

type SellerCardProps = {
  contactName: string | null
  contactPhone: string | null
  contactPhoneIsWhatsapp: boolean
  listingTitle: string
  publishedAtLabel: string
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

function buildWhatsappUrl(phone: string, listingTitle: string) {
  const digits = toPhoneDigits(phone)
  if (!digits) {
    return '#'
  }
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  const message = `Olá! Tenho interesse no anúncio "${listingTitle}" da Zap Sucatas.`
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .1 5.37.1 11.95c0 2.1.55 4.16 1.6 5.98L0 24l6.23-1.64a11.9 11.9 0 0 0 5.7 1.45h.01c6.58 0 11.95-5.37 11.95-11.96 0-3.19-1.24-6.19-3.37-8.37Zm-8.58 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.7.97.99-3.6-.24-.37a9.87 9.87 0 0 1-1.51-5.23c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 0 1 2.91 7.03c0 5.49-4.46 9.95-9.95 9.95Zm5.45-7.44c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.75-1.66-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.48.71.3 1.27.48 1.7.61.71.23 1.35.2 1.85.12.57-.08 1.8-.73 2.06-1.44.25-.71.25-1.31.17-1.44-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  )
}

export function SellerCard({
  contactName,
  contactPhone,
  contactPhoneIsWhatsapp,
  listingTitle,
  publishedAtLabel,
}: SellerCardProps) {
  return (
    <ListingSidebarCard title="Anunciante">
      <div className="flex items-center gap-4 rounded-[1.4rem] border border-border bg-white p-4">
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
        <a
          className="inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
          href={
            contactPhoneIsWhatsapp
              ? buildWhatsappUrl(contactPhone, listingTitle)
              : `tel:${contactPhone}`
          }
          rel={contactPhoneIsWhatsapp ? 'noopener noreferrer' : undefined}
          target={contactPhoneIsWhatsapp ? '_blank' : undefined}
        >
          {contactPhoneIsWhatsapp ? (
            <WhatsAppIcon className="size-4 text-primary" />
          ) : (
            <Phone className="size-4 text-primary" />
          )}
          {contactPhone}
        </a>
      ) : null}
    </ListingSidebarCard>
  )
}
