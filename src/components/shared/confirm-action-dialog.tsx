import { Button } from '@/components/ui/button'

type ConfirmActionDialogProps = {
  cancelLabel?: string
  confirmLabel?: string
  description: string
  isPending?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
  tone?: 'danger' | 'default'
}

export function ConfirmActionDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  description,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = 'danger',
}: ConfirmActionDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <button
        aria-label="Fechar confirmação"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => {
          if (!isPending) {
            onOpenChange(false)
          }
        }}
        type="button"
      />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant={tone === 'danger' ? 'destructive' : 'default'}
          >
            {isPending ? 'Processando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
