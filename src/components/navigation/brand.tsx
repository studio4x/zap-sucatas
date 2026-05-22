import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { fetchVisualSettings } from '@/domains/settings/api'
import { cn } from '@/lib/utils'

type BrandProps = {
  hideSubtitle?: boolean
  layout?: 'inline' | 'stacked'
  logoScalePercent?: number
  subtitle: string
  tone?: 'default' | 'inverse'
}

export function Brand({ hideSubtitle = false, subtitle, layout = 'inline', logoScalePercent = 100, tone = 'default' }: BrandProps) {
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
  const clampedLogoScale = Math.max(60, Math.min(220, logoScalePercent))
  const stackedLogoHeight = 56 * (clampedLogoScale / 100)
  const stackedLogoMaxWidth = 270 * (clampedLogoScale / 100)
  const stackedLogoMinHeight = 58 * (clampedLogoScale / 100)

  return (
    <Link
      className={cn('inline-flex min-w-0 gap-3', isStacked ? 'flex-col items-start gap-0.5' : 'items-center')}
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
        <div
          className={cn('flex min-w-20 items-center', isStacked ? 'min-h-16' : 'min-h-11')}
          style={isStacked ? { minHeight: `${stackedLogoMinHeight}px` } : undefined}
        >
          <img
            alt="Zap Sucatas"
            className={cn('w-auto object-contain', isStacked ? '' : 'h-10 max-w-[180px]')}
            onError={() => setLogoLoadError(true)}
            src={logo.publicUrl}
            style={
              isStacked
                ? { height: `${stackedLogoHeight}px`, marginLeft: '-10px', maxWidth: `${stackedLogoMaxWidth}px` }
                : undefined
            }
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
        <p className={cn('hidden leading-tight lg:block', isStacked ? 'text-xs' : 'text-sm', isInverse ? 'text-white/72' : 'text-muted-foreground', hideSubtitle && 'lg:hidden')}>
          {subtitle}
        </p>
      </div>
    </Link>
  )
}
