import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MailCheck, MailOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminContactMessageDialog } from '@/components/admin/admin-contact-message-dialog'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  fetchAdminContactMessageStats,
  fetchAdminContactMessagesPage,
  updateAdminContactMessageStatus,
} from '@/domains/contact/api'
import type { ContactMessage, ContactMessageStatus } from '@/domains/contact/types'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

const PAGE_SIZE = 12

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

export function AdminContactMessagesPage() {
  const queryClient = useQueryClient()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContactMessageStatus>('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  const messagesQuery = useQuery({
    placeholderData: (previousData) => previousData,
    queryKey: ['contact-messages', 'admin', { page, query, statusFilter }],
    queryFn: () =>
      fetchAdminContactMessagesPage({
        page,
        pageSize: PAGE_SIZE,
        query,
        status: statusFilter,
      }),
  })

  const statsQuery = useQuery({
    queryKey: ['contact-messages', 'admin', 'stats'],
    queryFn: fetchAdminContactMessageStats,
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateAdminContactMessageStatus,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível atualizar o status desta mensagem.')
    },
    onSuccess: async (message) => {
      setSuccessFeedback('Status da mensagem atualizado com sucesso.')
      setSelectedMessage(message)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contact-messages', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['logs', 'admin'] }),
      ])
    },
  })

  const messages = useMemo(() => messagesQuery.data?.items ?? [], [messagesQuery.data])
  const totalCount = messagesQuery.data?.totalCount ?? 0
  const stats = useMemo(
    () =>
      statsQuery.data ?? {
        newMessages: 0,
        readMessages: 0,
        resolvedMessages: 0,
        total: 0,
      },
    [statsQuery.data],
  )

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.public.contact}>Ver página pública</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.admin.logs}>Abrir logs</Link>
            </Button>
          </>
        }
        description="Triagem operacional das mensagens recebidas pelo formulário público, com status de atendimento e detalhe do contexto."
        eyebrow="Administração / contato"
        title="Inbox comercial"
      />

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Novas" value={stats.newMessages} />
        <AdminStatCard label="Lidas" value={stats.readMessages} />
        <AdminStatCard label="Resolvidas" value={stats.resolvedMessages} />
      </div>

      <AdminFilterCard
        actions={
          <Button
            onClick={() => {
              setPage(1)
              setQuery('')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Busque por remetente, assunto ou conteúdo e mova a mensagem entre os estados operacionais."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por nome, e-mail, telefone, assunto ou mensagem"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as typeof statusFilter)
            }}
            value={statusFilter}
          >
            <option value="all">Todos os status</option>
            <option value="new">Novas</option>
            <option value="read">Lidas</option>
            <option value="resolved">Resolvidas</option>
          </Select>
        </div>
      </AdminFilterCard>

      <AdminDataTable
        columns={[
          {
            header: 'Contato',
            cell: (message) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{message.fullName}</p>
                <p className="text-xs text-muted-foreground">{message.email}</p>
                <p className="text-xs text-muted-foreground">{message.phone ?? 'Sem telefone'}</p>
              </div>
            ),
          },
          {
            header: 'Assunto',
            cell: (message) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{message.subject}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{message.message}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            cell: (message) => (
              <AdminStatusBadge tone={getStatusMeta(message.status).tone}>
                {getStatusMeta(message.status).label}
              </AdminStatusBadge>
            ),
          },
          {
            header: 'Origem',
            cell: (message) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{message.source}</p>
                <p>Perfil: {message.profileId ?? 'visitante'}</p>
              </div>
            ),
          },
          {
            header: 'Recebida em',
            cell: (message) => (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{formatDateTime(message.createdAt)}</p>
                <p>Atualizada em {formatDateTime(message.updatedAt)}</p>
              </div>
            ),
          },
          {
            header: 'Ações',
            className: 'w-[240px] text-right',
            cell: (message) => (
              <AdminRowActions
                actions={[
                  {
                    icon: Eye,
                    label: 'Abrir',
                    onClick: () => setSelectedMessage(message),
                  },
                  {
                    disabled: updateStatusMutation.isPending || message.status === 'read',
                    icon: MailOpen,
                    label: 'Lida',
                    onClick: () => {
                      clearFeedback()
                      updateStatusMutation.mutate({
                        messageId: message.id,
                        status: 'read',
                      })
                    },
                    variant: 'outline',
                  },
                  {
                    disabled: updateStatusMutation.isPending || message.status === 'resolved',
                    icon: MailCheck,
                    label: 'Resolver',
                    onClick: () => {
                      clearFeedback()
                      updateStatusMutation.mutate({
                        messageId: message.id,
                        status: 'resolved',
                      })
                    },
                    variant: 'outline',
                  },
                ]}
              />
            ),
          },
        ]}
        data={messages}
        emptyDescription="Nenhuma mensagem foi encontrada para os filtros atuais."
        emptyTitle="Inbox sem mensagens neste recorte"
        errorMessage="Não foi possível carregar as mensagens de contato."
        getRowKey={(message) => message.id}
        isError={messagesQuery.isError || statsQuery.isError}
        isLoading={messagesQuery.isLoading || statsQuery.isLoading}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={totalCount}
      />

      <AdminContactMessageDialog
        isPending={updateStatusMutation.isPending}
        message={selectedMessage}
        onChangeStatus={(status) => {
          if (!selectedMessage) {
            return
          }

          clearFeedback()
          updateStatusMutation.mutate({
            messageId: selectedMessage.id,
            status,
          })
        }}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMessage(null)
          }
        }}
        open={Boolean(selectedMessage)}
      />
    </section>
  )
}
