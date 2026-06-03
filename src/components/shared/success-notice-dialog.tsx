import { Button } from '@/components/ui/button'

type SuccessNoticeDialogProps = {
  actionLabel?: string
  description: string
  onAction: () => void
  open: boolean
  title: string
}

export function SuccessNoticeDialog({
  actionLabel = 'Continuar',
  description,
  onAction,
  open,
  title,
}: SuccessNoticeDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/45" />
      <div
        aria-modal="true"
        className="relative w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl"
        role="dialog"
      >
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>

        <div className="mt-6 flex justify-end">
          <Button onClick={onAction} type="button">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
