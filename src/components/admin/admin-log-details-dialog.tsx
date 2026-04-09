import type { AdminLogEvent } from '@/domains/logs/types'
import { Button } from '@/components/ui/button'

type AdminLogDetailsDialogProps = {
  log: AdminLogEvent | null
  onOpenChange: (open: boolean) => void
  open: boolean
}

function formatJson(value: unknown) {
  if (value == null) {
    return 'Sem dados adicionais.'
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return 'Nao foi possivel serializar este contexto.'
  }
}

export function AdminLogDetailsDialog({
  log,
  onOpenChange,
  open,
}: AdminLogDetailsDialogProps) {
  if (!open || !log) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{log.label}</h2>
            <p className="text-sm text-muted-foreground">{log.secondaryLabel}</p>
          </div>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Fechar
          </Button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tipo
              </p>
              <p className="text-sm text-foreground">
                {log.kind === 'audit' ? 'Auditoria' : 'Integracao'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Registrado em
              </p>
              <p className="text-sm text-foreground">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(log.createdAt))}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ator
              </p>
              <p className="text-sm text-foreground">
                {log.actorName ?? log.actorUserId ?? 'Nao identificado'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Entidade
              </p>
              <p className="text-sm text-foreground">
                {log.entityType ?? 'Nao aplicavel'}
                {log.entityId ? ` / ${log.entityId}` : ''}
              </p>
            </div>
          </div>

          {log.detail ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Resumo
              </p>
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                {log.detail}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Antes
              </p>
              <pre className="min-h-[180px] overflow-auto rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-6 text-foreground">
                {formatJson(log.beforeData)}
              </pre>
            </div>
            <div className="space-y-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Depois
              </p>
              <pre className="min-h-[180px] overflow-auto rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-6 text-foreground">
                {formatJson(log.afterData)}
              </pre>
            </div>
            <div className="space-y-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Payload
              </p>
              <pre className="min-h-[180px] overflow-auto rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-6 text-foreground">
                {formatJson(log.payload)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
