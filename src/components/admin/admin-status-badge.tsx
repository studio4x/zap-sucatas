import { cn } from '@/lib/utils'

type AdminStatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

const toneMap: Record<AdminStatusTone, string> = {
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
}

type AdminStatusBadgeProps = {
  children: string
  className?: string
  tone?: AdminStatusTone
}

export function AdminStatusBadge({
  children,
  className,
  tone = 'neutral',
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
