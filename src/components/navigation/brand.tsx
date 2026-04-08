import { MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { cn } from '@/lib/utils'

type BrandProps = {
  subtitle: string
  tone?: 'default' | 'inverse'
}

export function Brand({ subtitle, tone = 'default' }: BrandProps) {
  const isInverse = tone === 'inverse'

  return (
    <Link className="inline-flex items-center gap-3" to={paths.public.home}>
      <div
        className={cn(
          'flex size-11 items-center justify-center rounded-2xl shadow-sm',
          isInverse ? 'bg-white text-[#163a2d]' : 'bg-primary text-primary-foreground',
        )}
      >
        <MessageCircleMore className="size-5" />
      </div>
      <div>
        <p
          className={cn(
            'font-display text-xl tracking-tight',
            isInverse ? 'text-white' : 'text-foreground',
          )}
        >
          Zap Sucatas
        </p>
        <p className={cn('text-sm', isInverse ? 'text-white/72' : 'text-muted-foreground')}>
          {subtitle}
        </p>
      </div>
    </Link>
  )
}
