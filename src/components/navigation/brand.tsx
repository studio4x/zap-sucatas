import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { fetchVisualSettings } from '@/domains/settings/api'
import { cn } from '@/lib/utils'

type BrandProps = {
  subtitle: string
  layout?: 'inline' | 'stacked'
  tone?: 'default' | 'inverse'
}

export function Brand({ subtitle, layout = 'inline', tone = 'default' }: BrandProps) {
  const isInverse = tone === 'inverse'
  const [logoLoadError, setLogoLoadError] = useState(false)
  const visualSettingsQuery = useQuery({
    queryKey: ['visual-settings', 'brand'],
    queryFn: fetchVisualSettings,
    staleTime: 60_000,
  })

  const logo = isInverse
    ? visualSettingsQuery.data?.logoLight
    : visualSettingsQuery.data?.logoDark

  useEffect(() => {
    setLogoLoadError(false)
  }, [logo?.publicUrl])

  const isStacked = layout === 'stacked'

  return (
    <Link
      className={cn('inline-flex min-w-0 gap-3', isStacked ? 'flex-col items-start' : 'items-center')}
      to={paths.public.home}
    >
      {!logo || logoLoadError ? (
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-2xl shadow-sm',
            isInverse ? 'bg-white text-[#163a2d]' : 'bg-primary text-primary-foreground',
          )}
        >
          <MessageCircleMore className="size-5" />
        </div>
      ) : (
        <div className="flex min-h-11 min-w-20 items-center">
          <img
            alt="Zap Sucatas"
            className="h-10 w-auto max-w-[180px] object-contain"
            onError={() => setLogoLoadError(true)}
            src={logo.publicUrl}
          />
        </div>
      )}
      <div className="min-w-0">
        {!logo || logoLoadError ? (
          <p
            className={cn(
              'font-display text-xl tracking-tight',
              isInverse ? 'text-white' : 'text-foreground',
            )}
          >
            Zap Sucatas
          </p>
        ) : null}
        <p className={cn('hidden text-sm leading-tight lg:block', isInverse ? 'text-white/72' : 'text-muted-foreground')}>
          {subtitle}
        </p>
      </div>
    </Link>
  )
}
