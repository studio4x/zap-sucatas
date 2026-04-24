import { Paperclip } from 'lucide-react'

export function TicketAttachment({ attachmentName, attachmentUrl }: { attachmentName: string | null; attachmentUrl: string | null }) {
  if (!attachmentUrl) {
    return null
  }

  return (
    <a
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
      href={attachmentUrl}
      rel="noreferrer"
      target="_blank"
    >
      <Paperclip className="size-3.5" />
      {attachmentName ?? 'Abrir anexo'}
    </a>
  )
}
