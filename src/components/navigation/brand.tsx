import { MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'

type BrandProps = {
  subtitle: string
}

export function Brand({ subtitle }: BrandProps) {
  return (
    <Link className="inline-flex items-center gap-3" to={paths.public.home}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <MessageCircleMore className="size-5" />
      </div>
      <div>
        <p className="font-display text-xl tracking-tight text-foreground">Zap Sucatas</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </Link>
  )
}
