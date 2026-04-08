import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { QuestionThreadCard } from '@/components/questions/question-thread-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { answerListingQuestion, fetchAdminQuestions, updateQuestionStatus } from '@/domains/questions/api'
import type { QuestionStatus } from '@/domains/questions/types'
import { questionStatusOptions } from '@/domains/questions/utils'

export function AdminQuestionsPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof questionStatusOptions)[number]['value']>('all')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  const questionsQuery = useQuery({
    queryKey: ['questions', 'admin'],
    queryFn: fetchAdminQuestions,
  })

  const answerMutation = useMutation({
    mutationFn: answerListingQuestion,
    onSuccess: async () => {
      setFeedback('Thread atualizada com sucesso.')
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

  const filteredQuestions = useMemo(() => {
    return (questionsQuery.data ?? []).filter((question) => {
      const matchesStatus = statusFilter === 'all' ? true : question.status === statusFilter
      const haystack =
        `${question.questionText} ${question.listingTitle ?? ''} ${question.guestName ?? ''} ${question.guestEmail ?? ''}`.toLowerCase()
      const matchesQuery = query.trim().length === 0 ? true : haystack.includes(query.trim().toLowerCase())
      return matchesStatus && matchesQuery
    })
  }, [questionsQuery.data, query, statusFilter])

  function mutateStatus(questionId: string, questionStatus: QuestionStatus) {
    statusMutation.mutate({ questionId, questionStatus })
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Admin / perguntas
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Moderacao de perguntas e respostas
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Publique, oculte ou bloqueie perguntas e registre respostas quando necessario.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por pergunta, anuncio ou autor"
              value={query}
            />
          </div>

          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            value={statusFilter}
          >
            {questionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {feedback ? (
        <Card className="border-emerald-200/70 bg-emerald-50">
          <CardContent className="p-5 text-sm text-emerald-900">{feedback}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filteredQuestions.map((question) => {
          const draft = drafts[question.id] ?? question.answer?.answerText ?? ''

          return (
            <QuestionThreadCard
              key={question.id}
              question={question}
              showListingLink
              actions={
                <>
                  <Button
                    disabled={statusMutation.isPending || question.status === 'published'}
                    onClick={() => mutateStatus(question.id, 'published')}
                    type="button"
                    variant="outline"
                  >
                    Publicar
                  </Button>
                  <Button
                    disabled={statusMutation.isPending || question.status === 'hidden'}
                    onClick={() => mutateStatus(question.id, 'hidden')}
                    type="button"
                    variant="outline"
                  >
                    Ocultar
                  </Button>
                  <Button
                    disabled={statusMutation.isPending || question.status === 'blocked'}
                    onClick={() => mutateStatus(question.id, 'blocked')}
                    type="button"
                    variant="destructive"
                  >
                    Bloquear
                  </Button>
                </>
              }
              answerComposer={
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    {question.answer ? 'Atualizar resposta administrativa' : 'Responder thread'}
                  </label>
                  <Textarea
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [question.id]: event.target.value }))
                    }
                    placeholder="Escreva a resposta administrativa ou de apoio ao anunciante."
                    value={draft}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={answerMutation.isPending || draft.trim().length < 2}
                      onClick={() =>
                        answerMutation.mutate({
                          answerText: draft,
                          questionId: question.id,
                          questionStatus: question.status,
                        })
                      }
                      type="button"
                    >
                      {question.answer ? 'Atualizar resposta' : 'Salvar resposta'}
                    </Button>
                  </div>
                </div>
              }
            />
          )
        })}

        {questionsQuery.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Carregando threads para moderacao...
            </CardContent>
          </Card>
        ) : null}

        {!questionsQuery.isLoading && filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhuma thread encontrada com os filtros atuais.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  )
}
