import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip, Send } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { TicketAttachment } from '@/components/support/ticket-attachment'
import { TicketSlaBadge } from '@/components/support/ticket-sla-badge'
import { TicketStatusBadge } from '@/components/support/ticket-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { fetchSupportConfig, fetchSupportTicketDetail, sendSupportMessage, updateSupportTicketStatus, uploadSupportAttachment } from '@/domains/support/api'
import type { SupportMessage, SupportTicketDetail } from '@/domains/support/types'
import { useAuth } from '@/hooks/use-auth'
import { defaultSupportConfig, formatBusinessHours, formatSupportDate, formatSupportDateTime, getSupportCategoryMeta, supportStatusOptions } from '@/lib/support-sla'
import { supabase } from '@/integrations/supabase/client'

type SupportMessageRealtimeRow = {
  attachment_name: string | null
  attachment_url: string | null
  created_at: string
  id: string
  message: string
  sender_display_name: string | null
  sender_id: string
  ticket_id: string
}

function buildLocalSupportMessage(input: {
  attachmentName: string | null
  attachmentUrl: string | null
  createdAt: string
  id: string
  isAdmin: boolean
  message: string
  senderDisplayName: string | null
  senderId: string
  ticketId: string
  viewerFullName: string | null
}) : SupportMessage {
  return {
    attachmentName: input.attachmentName,
    attachmentUrl: input.attachmentUrl,
    createdAt: input.createdAt,
    id: input.id,
    message: input.message,
    senderEmail: null,
    senderId: input.senderId,
    senderName: input.isAdmin ? input.senderDisplayName ?? input.viewerFullName ?? 'Equipe de suporte' : input.viewerFullName ?? 'Usuário',
    senderRole: input.isAdmin ? 'admin' : 'user',
    ticketId: input.ticketId,
  }
}

function buildRealtimeSupportMessage(input: {
  isAdmin: boolean
  row: SupportMessageRealtimeRow
  ticketUserEmail: string | null
  ticketUserFullName: string | null
  ticketResponderName: string | null
  viewerEmail: string
  viewerFullName: string | null
  viewerProfileId: string | null
}): SupportMessage {
  const isOwnMessage = input.row.sender_id === input.viewerProfileId
  const senderRole = isOwnMessage ? (input.isAdmin ? 'admin' : 'user') : input.isAdmin ? 'user' : 'admin'
  const adminDisplayName = input.row.sender_display_name ?? input.ticketResponderName ?? input.viewerFullName ?? 'Equipe de suporte'

  return {
    attachmentName: input.row.attachment_name,
    attachmentUrl: input.row.attachment_url,
    createdAt: input.row.created_at,
    id: input.row.id,
    message: input.row.message,
    senderEmail: isOwnMessage ? input.viewerEmail : input.isAdmin ? input.ticketUserEmail : null,
    senderId: input.row.sender_id,
    senderName: isOwnMessage
      ? input.isAdmin
        ? adminDisplayName
        : input.viewerFullName ?? 'Usuário'
      : input.isAdmin
        ? input.ticketUserFullName ?? 'Usuário'
        : adminDisplayName,
    senderRole,
    ticketId: input.row.ticket_id,
  }
}

export function SupportTicketDetailPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { id = '' } = useParams()
  const isAdmin = pathname.startsWith('/admin/') || user?.role === 'admin'
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attendantName, setAttendantName] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem('support-admin-attendant-name') ?? ''
  })
  const [attendantSaved, setAttendantSaved] = useState(true)
  const [liveMessages, setLiveMessages] = useState<SupportMessage[] | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const viewerFullName = user?.fullName ?? null
  const viewerEmail = user?.email ?? ''
  const attendantStorageKey = 'support-admin-attendant-name'

  const detailQuery = useQuery({
    queryKey: ['support', 'detail', id],
    queryFn: () => fetchSupportTicketDetail(id),
    enabled: Boolean(id),
  })
  const configQuery = useQuery({ queryKey: ['support', 'config', 'detail'], queryFn: fetchSupportConfig })

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [liveMessages, detailQuery.data?.messages])

  useEffect(() => {
    const client = supabase
    if (!client || !id) {
      return
    }

    const channel = client
      .channel(`support-chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${id}` }, (payload) => {
        const row = payload.new as SupportMessageRealtimeRow
        setLiveMessages((current) => {
          const baseMessages = current ?? detailQuery.data?.messages ?? []
          if (baseMessages.some((messageEntry) => messageEntry.id === row.id)) {
            return current
          }

          const currentTicket = detailQuery.data?.ticket ?? null
          if (!currentTicket) {
            return current
          }

          const nextMessage = buildRealtimeSupportMessage({
            isAdmin,
            row,
            ticketUserEmail: currentTicket.userEmail,
            ticketUserFullName: currentTicket.userFullName,
            ticketResponderName: currentTicket.responderName,
            viewerEmail,
            viewerFullName,
            viewerProfileId: user?.profileId ?? null,
          })

          return [...baseMessages, nextMessage]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${id}` }, (payload) => {
        const row = payload.new as { first_response_at: string | null; first_response_due_at: string | null; sla_status: 'answered' | 'at_risk' | 'on_time' | 'overdue'; status: 'closed' | 'in_progress' | 'open'; updated_at: string }
        void queryClient.setQueryData<SupportTicketDetail | undefined>(['support', 'detail', id], (current) => current ? {
          ...current,
          ticket: {
            ...current.ticket,
            firstResponseAt: row.first_response_at,
            firstResponseDueAt: row.first_response_due_at,
            slaStatus: row.sla_status,
            status: row.status,
            updatedAt: row.updated_at,
          },
        } : current)
      })
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [detailQuery.data?.messages, detailQuery.data?.ticket, id, isAdmin, queryClient, user?.profileId, viewerEmail, viewerFullName])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!detailQuery.data?.ticket || !user?.profileId) {
        throw new Error('Ticket indisponivel para envio de mensagem.')
      }
      if (!message.trim() && !selectedFile) {
        throw new Error('Escreva uma mensagem ou envie um anexo.')
      }

      const senderDisplayName = isAdmin ? (ticket?.responderName ?? normalizedAttendantName ?? effectiveAttendantName) : null
      let attachmentName: string | null = null
      let attachmentUrl: string | null = null
      if (selectedFile && user.id) {
        const uploaded = await uploadSupportAttachment({ authUserId: user.id, file: selectedFile })
        attachmentName = uploaded.attachmentName
        attachmentUrl = uploaded.attachmentUrl
      }

      const sentMessage = await sendSupportMessage({
        attachmentName,
        attachmentUrl,
        message: message.trim() || 'Anexo enviado.',
        senderId: user.profileId,
        senderDisplayName,
        ticketId: detailQuery.data.ticket.id,
      })

      const optimisticMessage = buildLocalSupportMessage({
        attachmentName: sentMessage.attachment_name,
        attachmentUrl: sentMessage.attachment_url,
        createdAt: sentMessage.created_at,
        id: sentMessage.id,
        isAdmin,
        message: sentMessage.message,
        senderDisplayName,
        senderId: sentMessage.sender_id,
        ticketId: sentMessage.ticket_id,
        viewerFullName,
      })

      setLiveMessages((current) => {
        const baseMessages = current ?? detailQuery.data?.messages ?? []
        if (baseMessages.some((entry) => entry.id === optimisticMessage.id)) {
          return baseMessages
        }

        return [...baseMessages, optimisticMessage]
      })

      if (isAdmin && senderDisplayName) {
        setAttendantSaved(true)
      }

      return sentMessage
    },
    onSuccess: async () => {
      if (isAdmin && !ticket?.responderName) {
        window.localStorage.setItem(attendantStorageKey, effectiveAttendantName)
        setAttendantSaved(true)
        queryClient.setQueryData<SupportTicketDetail | undefined>(['support', 'detail', id], (current) => current ? {
          ...current,
          ticket: {
            ...current.ticket,
            responderName: effectiveAttendantName,
          },
        } : current)
      }

      setMessage('')
      setSelectedFile(null)
      await queryClient.invalidateQueries({ queryKey: ['support', 'detail', id] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'closed' | 'in_progress' | 'open') => updateSupportTicketStatus({ status, ticketId: id }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
      ])
    },
  })

  const config = configQuery.data ?? defaultSupportConfig
  const detail = detailQuery.data ?? null
  const ticket = detail?.ticket ?? null
  const category = ticket ? getSupportCategoryMeta(config, ticket.category) : null
  const isClosedForUser = !isAdmin && ticket?.status === 'closed'
  const isAttendantNameLocked = Boolean(ticket?.responderName)
  const normalizedAttendantName = attendantName.trim()
  const effectiveAttendantName = normalizedAttendantName || viewerFullName || 'Equipe de suporte'
  const backPath = isAdmin ? paths.admin.support : paths.app.support
  const sortedMessages = useMemo(() => liveMessages ?? detail?.messages ?? [], [detail?.messages, liveMessages])

  function persistAttendantName() {
    if (!isAdmin || isAttendantNameLocked) {
      return
    }

    const nextName = normalizedAttendantName
    if (!nextName) {
      setAttendantSaved(false)
      return
    }

    window.localStorage.setItem(attendantStorageKey, nextName)
    setAttendantSaved(true)
  }

  if (detailQuery.isLoading || !ticket) {
    return <div className="rounded-[1.8rem] border border-border bg-card px-6 py-8 text-sm text-muted-foreground">Carregando ticket...</div>
  }

  if (detailQuery.isError) {
    return <div className="rounded-[1.8rem] border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700">Não foi possível carregar o detalhe do chamado.</div>
  }

  return (
    <section className="mx-auto w-[90%] max-w-none space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild type="button" variant="ghost"><Link to={backPath}><ArrowLeft className="size-4" /> Voltar para a lista</Link></Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{ticket.subject}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ticket #{ticket.id.slice(0, 8).toUpperCase()} · Aberto em {formatSupportDate(ticket.createdAt)}</p>
          </div>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <Card className="rounded-[1.8rem] border-border/80">
            <CardContent className="space-y-0 p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Histórico de mensagens</p>
                  <p className="text-sm text-muted-foreground">A conversa fica sincronizada em tempo real enquanto esta tela estiver aberta.</p>
                </div>
                {isAdmin ? (
                  <Select disabled={statusMutation.isPending} onChange={(event) => statusMutation.mutate(event.target.value as 'closed' | 'in_progress' | 'open')} value={ticket.status}>
                    {supportStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                ) : null}
              </div>

              <div className="h-[600px] space-y-4 overflow-y-auto px-5 py-5" ref={scrollRef}>
                <div className="max-w-[85%] rounded-[1.4rem] border border-border bg-card px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Descrição do problema</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{ticket.description ?? 'Sem descrição complementar.'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <TicketAttachment attachmentName={ticket.attachmentName} attachmentUrl={ticket.attachmentUrl} />
                    <span>{formatSupportDateTime(ticket.createdAt)}</span>
                  </div>
                </div>

                {sortedMessages.map((entry) => {
                  const ownMessage = entry.senderId === user?.profileId
                  return (
                    <div className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`} key={entry.id}>
                      <div className={`max-w-[85%] rounded-[1.4rem] px-4 py-4 ${ownMessage ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md border border-border bg-card text-foreground'}`}>
                        {entry.senderRole === 'admin' ? <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${ownMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{entry.senderName ?? 'Equipe de suporte'}</p> : !ownMessage ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{entry.senderName ?? 'Usuário'}</p> : null}
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{entry.message}</p>
                        <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${ownMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          <TicketAttachment attachmentName={entry.attachmentName} attachmentUrl={entry.attachmentUrl} />
                          <span>{formatSupportDateTime(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-border px-5 py-4">
                {isClosedForUser ? <div className="mb-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Este chamado foi encerrado.</div> : null}
                {selectedFile ? <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground">{selectedFile.name}</div> : null}
                <div className="flex items-center gap-3">
                  <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <Paperclip className="size-4" />
                    <input className="hidden" disabled={isClosedForUser || sendMutation.isPending} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
                  </label>
                  <Input disabled={isClosedForUser || sendMutation.isPending} onChange={(event) => setMessage(event.target.value)} placeholder={isClosedForUser ? 'Chamado encerrado pelo suporte.' : 'Escreva sua mensagem'} value={message} />
                  <Button disabled={(isClosedForUser || sendMutation.isPending) || (!message.trim() && !selectedFile)} onClick={() => sendMutation.mutate()} type="button"><Send className="size-4" /> Enviar</Button>
                </div>
                {isAdmin ? (
                  <div className="mt-3 space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="support-attendant-name">
                      Nome do atendente
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        disabled={isAttendantNameLocked || sendMutation.isPending}
                        id="support-attendant-name"
                        onChange={(event) => {
                          setAttendantSaved(false)
                          setAttendantName(event.target.value)
                        }}
                        placeholder="Ex: Atendimento Zap Sucatas"
                        value={ticket?.responderName ?? attendantName}
                      />
                      <Button disabled={isAttendantNameLocked || sendMutation.isPending} onClick={persistAttendantName} type="button" variant="outline">
                        Salvar nome
                      </Button>
                    </div>
                    <p className="text-xs leading-6 text-muted-foreground">
                      Este nome fica salvo para próximos tickets. Depois da primeira resposta deste chamado, ele permanece fixo.
                      {attendantSaved ? ' Nome salvo.' : ' Clique em salvar para garantir a persistência.'}
                    </p>
                  </div>
                ) : null}
                {sendMutation.isError ? <p className="mt-3 text-sm text-destructive">{sendMutation.error instanceof Error ? sendMutation.error.message : 'Não foi possível enviar a mensagem.'}</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.8rem] border-border/80">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold text-foreground">Informações</p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Usuário</p><p className="mt-1 text-foreground">{ticket.userFullName ?? 'Usuário autenticado'}</p><p>{ticket.userEmail ?? 'Sem e-mail'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Categoria</p><p className="mt-1 text-foreground">{category?.label}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Prioridade</p><p className="mt-1 text-foreground">{ticket.priority}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">SLA da primeira resposta</p><div className="mt-1"><TicketSlaBadge status={ticket.slaStatus} /></div></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Prazo previsto</p><p className="mt-1 text-foreground">{ticket.firstResponseDueAt ? formatSupportDateTime(ticket.firstResponseDueAt) : 'Em calculo'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Primeira resposta</p><p className="mt-1 text-foreground">{ticket.firstResponseAt ? formatSupportDateTime(ticket.firstResponseAt) : 'Ainda não registrada'}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.12em]">Última atualização</p><p className="mt-1 text-foreground">{formatSupportDateTime(ticket.updatedAt)}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem] border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-sm leading-7 text-amber-950">
              <p className="font-semibold">{category?.description}</p>
              <p className="mt-2">Horário de atendimento: {formatBusinessHours(config.businessHours)}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem] border-rose-200 bg-rose-50">
            <CardContent className="p-5 text-sm leading-7 text-rose-900">
              Mantenha o chamado ativo enquanto houver contexto importante. Se houver risco, fraude ou tentativa de golpe, registre tudo com horário e evidencias disponíveis.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
