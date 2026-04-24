import { cn } from '@/lib/utils'

type AdminStatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

const toneMap: Record<AdminStatusTone, string> = {
  danger: 'border-[#f0c4bd] bg-[#fff1ee] text-[#a53c2f]',
  info: 'border-[#bfd7cc] bg-[#edf5f0] text-[#2f6a54]',
  neutral: 'border-[#d8dfd4] bg-[#eef2ec] text-[#4c5b51]',
  success: 'border-[#b8d8c7] bg-[#eaf5ef] text-[#1f6d4b]',
  warning: 'border-[#ead4a4] bg-[#fff7e8] text-[#8f6512]',
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
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium',
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
