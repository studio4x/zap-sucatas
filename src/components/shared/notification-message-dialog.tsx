import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NotificationDetailRow = {
  label: string
  value: ReactNode
}

type NotificationMessageDialogProps = {
  actions?: ReactNode
  badgeLabel?: string
  badgeTone?: string
  body: string
  createdAt: string
  details?: NotificationDetailRow[]
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export function NotificationMessageDialog({
  actions,
  badgeLabel,
  badgeTone = 'border-border bg-background text-muted-foreground',
  body,
  createdAt,
  details = [],
  onOpenChange,
  open,
  title,
}: NotificationMessageDialogProps) {
  if (!open) {
    return null
  }

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt))

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto px-4 py-4 sm:items-center">
      <button
        aria-label="Fechar mensagem"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => onOpenChange(false)}
        type="button"
      />

      <div className="relative flex w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Mensagem da sua conta
            </p>
            <div className="space-y-1">
              <h2 className="break-words text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">Recebida em {formattedDate}</p>
            </div>
          </div>

          {badgeLabel ? (
            <span className={cn('inline-flex max-w-full rounded-full border px-3 py-1 text-xs font-semibold', badgeTone)}>
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">O que a mensagem diz</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Leia o conteúdo completo abaixo, em uma linguagem mais direta.
                </p>
                <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
              </div>

              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            <div className="min-w-0 space-y-4 rounded-xl border border-border bg-muted/15 p-4">
              <p className="text-sm font-medium text-foreground">Informações úteis</p>
              {details.map((detail) => (
                <div className="space-y-1" key={detail.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {detail.label}
                  </p>
                  <div className="break-words text-sm text-foreground">{detail.value}</div>
                </div>
              ))}

              <div className="pt-2">
                <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                  Fechar mensagem
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
