import type { ReactNode } from 'react'
import { MessageSquareQuote, Reply } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QuestionStatusBadge } from '@/components/questions/question-status-badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ListingQuestion } from '@/domains/questions/types'
import { formatQuestionDate, getQuestionAuthorLabel } from '@/domains/questions/utils'

type QuestionThreadCardProps = {
  actions?: ReactNode
  answerComposer?: ReactNode
  question: ListingQuestion
  showListingLink?: boolean
}

export function QuestionThreadCard({
  actions,
  answerComposer,
  question,
  showListingLink = false,
}: QuestionThreadCardProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <QuestionStatusBadge status={question.status} />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {formatQuestionDate(question.createdAt)}
          </span>
          {question.listingTitle ? (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {question.listingTitle}
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Pergunta enviada por <span className="font-medium text-foreground">{getQuestionAuthorLabel(question)}</span>
          </p>
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquareQuote className="size-4" />
              Pergunta
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">
              {question.questionText}
            </p>
          </div>
        </div>

        {question.answer ? (
          <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-900">
              <Reply className="size-4" />
              Resposta
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-emerald-950">
              {question.answer.answerText}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-800/80">
              {formatQuestionDate(question.answer.updatedAt)}
            </p>
          </div>
        ) : null}

        {showListingLink && question.listingSlug ? (
          <p className="text-sm text-muted-foreground">
            Link público:{' '}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to={`/anuncios/${question.listingSlug}`}>
              abrir anúncio
            </Link>
          </p>
        ) : null}

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        {answerComposer ? <div>{answerComposer}</div> : null}
      </CardContent>
    </Card>
  )
}
