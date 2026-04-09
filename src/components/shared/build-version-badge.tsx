import { BUILD_VERSION } from '@/lib/build-version'
import { cn } from '@/lib/utils'

type BuildVersionBadgeProps = {
  className?: string
  tone?: 'dark' | 'light'
}

export function BuildVersionBadge({
  className,
  tone = 'light',
}: BuildVersionBadgeProps) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium uppercase tracking-[0.12em]',
        tone === 'dark' ? 'text-white/48' : 'text-muted-foreground/80',
        className,
      )}
    >
      Build {BUILD_VERSION}
    </span>
  )
}
