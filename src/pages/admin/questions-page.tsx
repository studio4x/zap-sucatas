import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Eye, MessageSquareReply } from 'lucide-react'
import { paths } from '@/app/paths'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { AdminFilterCard } from '@/components/admin/admin-filter-card'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { AdminRowActions } from '@/components/admin/admin-row-actions'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminStatusBadge } from '@/components/admin/admin-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { answerListingQuestion, fetchAdminQuestions, updateQuestionStatus } from '@/domains/questions/api'
import type { QuestionStatus } from '@/domains/questions/types'
import { questionStatusOptions } from '@/domains/questions/utils'

const PAGE_SIZE = 10

function getQuestionStatusMeta(status: QuestionStatus) {
  switch (status) {
    case 'published':
      return { label: 'Publicada', tone: 'success' as const }
    case 'hidden':
      return { label: 'Oculta', tone: 'warning' as const }
    default:
      return { label: 'Bloqueada', tone: 'danger' as const }
  }
}

function formatQuestionDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminQuestionsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof questionStatusOptions)[number]['value']>('all')
  const [page, setPage] = useState(1)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  const questionsQuery = useQuery({
    queryKey: ['questions', 'admin'],
    queryFn: fetchAdminQuestions,
  })

  const answerMutation = useMutation({
    mutationFn: answerListingQuestion,
    onSuccess: async () => {
      setFeedback('Resposta administrativa registrada com sucesso.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'public'] }),
      ])
    },
  })

  const statusMutation = useMutation({
    mutationFn: updateQuestionStatus,
    onSuccess: async () => {
      setFeedback('Status da pergunta atualizado com sucesso.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'public'] }),
      ])
    },
  })

  const questions = questionsQuery.data ?? []
  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return questions.filter((question) => {
      const matchesStatus = statusFilter === 'all' ? true : question.status === statusFilter
      const haystack =
        `${question.questionText} ${question.listingTitle ?? ''} ${question.guestName ?? ''} ${question.guestEmail ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [questions, query, statusFilter])
  const paginatedQuestions = useMemo(
    () => filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredQuestions, page],
  )
  const selectedQuestion =
    filteredQuestions.find((question) => question.id === selectedQuestionId) ??
    paginatedQuestions[0] ??
    null

  useEffect(() => {
    if (!selectedQuestion && filteredQuestions.length > 0) {
      setSelectedQuestionId(filteredQuestions[0].id)
    }

    if (selectedQuestion && selectedQuestion.id !== selectedQuestionId) {
      setSelectedQuestionId(selectedQuestion.id)
    }
  }, [filteredQuestions, selectedQuestion, selectedQuestionId])

  const stats = useMemo(
    () => ({
      blocked: questions.filter((question) => question.status === 'blocked').length,
      hidden: questions.filter((question) => question.status === 'hidden').length,
      published: questions.filter((question) => question.status === 'published').length,
      total: questions.length,
    }),
    [questions],
  )

  function mutateStatus(questionId: string, questionStatus: QuestionStatus) {
    statusMutation.mutate({ questionId, questionStatus })
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        actions={
          <>
            <Button asChild type="button">
              <Link to={paths.admin.listings}>Anuncios</Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link to={paths.app.questions}>Inbox do anunciante</Link>
            </Button>
          </>
        }
        description="Publique, oculte ou bloqueie threads e registre respostas de apoio quando necessario."
        eyebrow="Admin / perguntas"
        title="Moderacao de perguntas"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} />
        <AdminStatCard label="Publicadas" value={stats.published} />
        <AdminStatCard label="Ocultas" value={stats.hidden} />
        <AdminStatCard label="Bloqueadas" value={stats.blocked} />
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
        description="Filtre por status ou texto antes de abrir o detalhe operacional da thread."
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            onChange={(event) => {
              setPage(1)
              setQuery(event.target.value)
            }}
            placeholder="Buscar por pergunta, anuncio ou autor"
            value={query}
          />
          <Select
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value as typeof statusFilter)
            }}
            value={statusFilter}
          >
            {questionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </AdminFilterCard>

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <AdminDataTable
        columns={[
          {
            header: 'Pergunta',
            cell: (question) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{question.questionText}</p>
                <p className="text-xs text-muted-foreground">
                  {question.guestName ?? 'Usuario autenticado'}
                  {question.guestEmail ? ` / ${question.guestEmail}` : ''}
                </p>
              </div>
            ),
          },
          {
            header: 'Anuncio',
            cell: (question) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  {question.listingTitle ?? 'Anuncio removido'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatQuestionDate(question.createdAt)}
                </p>
              </div>
            ),
          },
          {
            header: 'Status',
            cell: (question) => {
              const meta = getQuestionStatusMeta(question.status)
              return <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
            },
          },
          {
            header: 'Resposta',
            cell: (question) => (
              <span className="text-sm text-muted-foreground">
                {question.answer ? 'Registrada' : 'Pendente'}
              </span>
            ),
          },
          {
            header: 'Acoes',
            className: 'w-[180px] text-right',
            cell: (question) => (
              <AdminRowActions
                actions={[
                  {
                    icon: MessageSquareReply,
                    label: 'Abrir thread',
                    onClick: () => setSelectedQuestionId(question.id),
                  },
                  ...(question.listingSlug
                    ? [
                        {
                          icon: Eye,
                          label: 'Publico',
                          to: paths.public.listingDetails(question.listingSlug),
                          variant: 'ghost' as const,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
        data={paginatedQuestions}
        emptyDescription="Nenhuma thread encontrada com os filtros atuais."
        emptyTitle="Sem perguntas neste recorte"
        errorMessage="Nao foi possivel carregar as perguntas do admin."
        getRowKey={(question) => question.id}
        isError={questionsQuery.isError}
        isLoading={questionsQuery.isLoading}
        rowClassName={(question) =>
          question.id === selectedQuestion?.id ? 'bg-sky-50/40' : undefined
        }
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={filteredQuestions.length}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Thread selecionada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Abra a thread para inspecionar o contexto e responder com clareza.
              </p>
            </div>
            {selectedQuestion ? (
              <AdminStatusBadge tone={getQuestionStatusMeta(selectedQuestion.status).tone}>
                {getQuestionStatusMeta(selectedQuestion.status).label}
              </AdminStatusBadge>
            ) : null}
          </div>

          {!selectedQuestion ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Selecione uma linha da tabela para moderar a thread.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Anuncio
                </p>
                <p className="text-sm font-medium text-foreground">
                  {selectedQuestion.listingTitle ?? 'Anuncio removido'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Pergunta
                </p>
                <p className="text-sm leading-7 text-foreground">
                  {selectedQuestion.questionText}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Autor
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedQuestion.guestName ?? 'Usuario autenticado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedQuestion.guestEmail ?? 'Sem email informado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Criada em
                  </p>
                  <p className="text-sm text-foreground">
                    {formatQuestionDate(selectedQuestion.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-answer">
                  Resposta administrativa
                </label>
                <Textarea
                  id="admin-answer"
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [selectedQuestion.id]: event.target.value,
                    }))
                  }
                  placeholder="Escreva a resposta que sera associada a esta thread."
                  value={drafts[selectedQuestion.id] ?? selectedQuestion.answer?.answerText ?? ''}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={
                    answerMutation.isPending ||
                    (drafts[selectedQuestion.id] ?? selectedQuestion.answer?.answerText ?? '').trim()
                      .length < 2
                  }
                  onClick={() =>
                    answerMutation.mutate({
                      answerText:
                        drafts[selectedQuestion.id] ?? selectedQuestion.answer?.answerText ?? '',
                      questionId: selectedQuestion.id,
                      questionStatus: selectedQuestion.status,
                    })
                  }
                  type="button"
                >
                  {answerMutation.isPending ? 'Salvando...' : 'Salvar resposta'}
                </Button>
                <Button
                  disabled={statusMutation.isPending || selectedQuestion.status === 'published'}
                  onClick={() => mutateStatus(selectedQuestion.id, 'published')}
                  type="button"
                  variant="outline"
                >
                  Publicar
                </Button>
                <Button
                  disabled={statusMutation.isPending || selectedQuestion.status === 'hidden'}
                  onClick={() => mutateStatus(selectedQuestion.id, 'hidden')}
                  type="button"
                  variant="outline"
                >
                  Ocultar
                </Button>
                <Button
                  disabled={statusMutation.isPending || selectedQuestion.status === 'blocked'}
                  onClick={() => mutateStatus(selectedQuestion.id, 'blocked')}
                  type="button"
                  variant="destructive"
                >
                  Bloquear
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Regras operacionais</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>A thread publica deve ter texto claro e sem ruido comercial indevido.</li>
            <li>Use "Ocultar" para casos reversiveis e "Bloquear" para abuso ou conteudo inadequado.</li>
            <li>As respostas administrativas ficam registradas no mesmo historico do anunciante.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
