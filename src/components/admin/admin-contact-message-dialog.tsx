import type { ContactMessage, ContactMessageStatus } from '@/domains/contact/types'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusMeta(status: ContactMessageStatus) {
  switch (status) {
    case 'new':
      return { label: 'Nova', tone: 'warning' as const }
    case 'read':
      return { label: 'Lida', tone: 'info' as const }
    default:
      return { label: 'Resolvida', tone: 'success' as const }
  }
}

type AdminContactMessageDialogProps = {
  isPending?: boolean
  message: ContactMessage | null
  onChangeStatus: (status: ContactMessageStatus) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function AdminContactMessageDialog({
  isPending = false,
  message,
  onChangeStatus,
  onOpenChange,
  open,
}: AdminContactMessageDialogProps) {
  if (!open || !message) {
    return null
  }

  const statusMeta = getStatusMeta(message.status)

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <button
        aria-label="Fechar detalhe da mensagem"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => {
          if (!isPending) {
            onOpenChange(false)
          }
        }}
        type="button"
      />

      <div className="relative w-full max-w-3xl rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Contato / detalhe
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {message.subject}
              </h2>
              <p className="text-sm text-muted-foreground">
                Recebida em {formatDateTime(message.createdAt)}
              </p>
            </div>
          </div>
          <AdminStatusBadge tone={statusMeta.tone}>{statusMeta.label}</AdminStatusBadge>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.7fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Mensagem</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {message.message}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isPending || message.status === 'read'}
                onClick={() => onChangeStatus('read')}
                type="button"
                variant="outline"
              >
                Marcar como lida
              </Button>
              <Button
                disabled={isPending || message.status === 'resolved'}
                onClick={() => onChangeStatus('resolved')}
                type="button"
              >
                Marcar como resolvida
              </Button>
              <Button
                disabled={isPending || message.status === 'new'}
                onClick={() => onChangeStatus('new')}
                type="button"
                variant="outline"
              >
                Reabrir
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-muted/15 p-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Remetente
              </p>
              <p className="text-sm font-medium text-foreground">{message.fullName}</p>
              <p className="text-sm text-muted-foreground">{message.email}</p>
              <p className="text-sm text-muted-foreground">{message.phone ?? 'Sem telefone informado'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Origem
              </p>
              <p className="text-sm text-muted-foreground">{message.source}</p>
              <p className="text-sm text-muted-foreground">
                Perfil vinculado: {message.profileId ?? 'visitante anonimo'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Telemetria
              </p>
              <p className="text-sm text-muted-foreground">IP: {message.requestIp ?? 'não registrado'}</p>
              <p className="break-all text-sm text-muted-foreground">
                User-Agent: {message.userAgent ?? 'não registrado'}
              </p>
            </div>

            <div className="pt-2">
              <Button disabled={isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}