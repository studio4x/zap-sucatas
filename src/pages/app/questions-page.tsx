import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Reply, Search } from 'lucide-react'
import { paths } from '@/app/paths'
import { DashboardAlertCard } from '@/components/dashboard/dashboard-alert-card'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { DashboardFilterCard } from '@/components/dashboard/dashboard-filter-card'
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header'
import { DashboardStatCard } from '@/components/dashboard/dashboard-stat-card'
import { QuestionStatusBadge } from '@/components/questions/question-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { answerListingQuestion, fetchOwnerQuestions } from '@/domains/questions/api'
import { formatQuestionDate, questionStatusOptions } from '@/domains/questions/utils'
import { useAuth } from '@/hooks/use-auth'

type AppQuestionsStatusFilter =
  (typeof questionStatusOptions)[number]['value']

export function AppQuestionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppQuestionsStatusFilter>('all')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  const questionsQuery = useQuery({
    queryKey: ['questions', 'owner', user?.profileId],
    queryFn: () => fetchOwnerQuestions(user?.profileId ?? ''),
    enabled: Boolean(user?.profileId),
  })

  const answerMutation = useMutation({
    mutationFn: answerListingQuestion,
    onSuccess: async () => {
      setFeedback('Resposta salva com sucesso.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions', 'owner', user?.profileId] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'public'] }),
      ])
    },
  })

  const questions = questionsQuery.data ?? []
  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return questions.filter((question) => {
      const matchesStatus = statusFilter === 'all' ? true : question.status === statusFilter
      const haystack = `${question.questionText} ${question.listingTitle ?? ''}`.toLowerCase()
      const matchesQuery = normalizedQuery.length === 0 ? true : haystack.includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [questions, query, statusFilter])

  const stats = useMemo(
    () => ({
      blocked: questions.filter((question) => question.status === 'blocked').length,
      open: questions.filter((question) => !question.answer).length,
      published: questions.filter((question) => question.status === 'published').length,
      total: questions.length,
    }),
    [questions],
  )

  return (
    <section className="space-y-6">
      <DashboardSectionHeader
        action={
          <Button asChild type="button" variant="outline">
            <Link to={paths.app.listings}>Ver anuncios</Link>
          </Button>
        }
        description="Responda rapido aos interessados e acompanhe o status publico de cada thread."
        title="Perguntas recebidas"
      />

      <DashboardAlertCard
        description="Responder com clareza ajuda a reduzir friccao comercial e aumenta a confianca no seu anuncio."
        title="Mantenha sua inbox em dia"
        tone={stats.open > 0 ? 'warning' : 'info'}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Total" value={stats.total} />
        <DashboardStatCard
          label="Sem resposta"
          tone={stats.open > 0 ? 'warning' : 'default'}
          value={stats.open}
        />
        <DashboardStatCard label="Publicadas" value={stats.published} />
        <DashboardStatCard
          label="Bloqueadas"
          tone={stats.blocked > 0 ? 'warning' : 'default'}
          value={stats.blocked}
        />
      </div>

      <DashboardFilterCard
        actions={
          <Button
            onClick={() => {
              setQuery('')
              setStatusFilter('all')
            }}
            type="button"
            variant="outline"
          >
            Limpar filtros
          </Button>
        }
        description="Filtre por status ou busque por texto para encontrar a thread certa."
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por pergunta ou anuncio"
              value={query}
            />
          </div>
          <Select
            onChange={(event) => setStatusFilter(event.target.value as AppQuestionsStatusFilter)}
            value={statusFilter}
          >
            {questionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </DashboardFilterCard>

      {feedback ? (
        <DashboardAlertCard description={feedback} title="Resposta registrada" tone="success" />
      ) : null}

      {questionsQuery.isLoading ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
          Carregando perguntas recebidas...
        </div>
      ) : null}

      {questionsQuery.isError ? (
        <DashboardAlertCard
          description="Nao foi possivel carregar as perguntas neste momento."
          title="Falha ao carregar inbox"
          tone="error"
        />
      ) : null}

      {!questionsQuery.isLoading && !questionsQuery.isError && filteredQuestions.length === 0 ? (
        <DashboardEmptyState
          description="Quando os interessados enviarem perguntas nos seus anuncios, elas aparecerao aqui."
          title="Nenhuma pergunta encontrada"
        />
      ) : null}

      <div className="grid gap-4">
        {filteredQuestions.map((question) => {
          const draft = drafts[question.id] ?? question.answer?.answerText ?? ''
          const isBlocked = question.status === 'blocked'

          return (
            <Card key={question.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <QuestionStatusBadge status={question.status} />
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {formatQuestionDate(question.createdAt)}
                  </span>
                  {question.listingTitle ? (
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {question.listingTitle}
                    </span>
                  ) : null}
                </div>
                <CardTitle className="text-base leading-7">{question.questionText}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {question.answer ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-sm font-semibold text-emerald-900">Resposta atual</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-950">
                      {question.answer.answerText}
                    </p>
                  </div>
                ) : null}

                {isBlocked ? (
                  <DashboardAlertCard
                    description="Threads bloqueadas so podem ser tratadas pelo painel administrativo."
                    title="Pergunta bloqueada"
                    tone="warning"
                  />
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor={`answer-${question.id}`}>
                    {question.answer ? 'Atualizar resposta' : 'Responder pergunta'}
                  </label>
                  <Textarea
                    disabled={isBlocked}
                    id={`answer-${question.id}`}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [question.id]: event.target.value }))
                    }
                    placeholder={
                      isBlocked
                        ? 'Thread bloqueada pelo admin.'
                        : 'Escreva uma resposta objetiva para o interessado.'
                    }
                    value={draft}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {question.listingSlug ? (
                    <Link
                      className="text-sm font-medium text-primary hover:underline"
                      to={paths.public.listingDetails(question.listingSlug)}
                    >
                      Abrir anuncio publico
                    </Link>
                  ) : (
                    <span />
                  )}

                  <Button
                    disabled={isBlocked || answerMutation.isPending || draft.trim().length < 2}
                    onClick={() =>
                      answerMutation.mutate({
                        answerText: draft,
                        questionId: question.id,
                      })
                    }
                    type="button"
                  >
                    <Reply className="size-4" />
                    {question.answer ? 'Atualizar resposta' : 'Salvar resposta'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
