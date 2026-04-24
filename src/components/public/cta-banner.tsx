import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

type CtaBannerProps = {
  actionLabel: string
  actionTo: string
  description: string
  secondaryAction?: ReactNode
  title: string
}

export function CtaBanner({
  actionLabel,
  actionTo,
  description,
  secondaryAction,
  title,
}: CtaBannerProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(135deg,rgba(22,98,70,0.98),rgba(12,60,44,0.96))] text-primary-foreground shadow-[0_24px_60px_-28px_rgba(12,60,44,0.75)]">
      <div className="grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/75">
            Anunciar na plataforma
          </p>
          <h3 className="font-display text-3xl tracking-tight md:text-4xl">{title}</h3>
          <p className="max-w-2xl text-sm leading-7 text-primary-foreground/86">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild className="bg-white !text-[#0f3a29] hover:bg-white/90" style={{ color: '#0f3a29' }}>
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
          {secondaryAction}
        </div>
      </div>
    </section>
  )
}
