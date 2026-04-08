import { MessageSquareQuote } from 'lucide-react'
import { QuestionThreadCard } from '@/components/questions/question-thread-card'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import type { ListingQuestion } from '@/domains/questions/types'

type QuestionAnswerBlockProps = {
  questions: ListingQuestion[]
}

export function QuestionAnswerBlock({ questions }: QuestionAnswerBlockProps) {
  return (
    <section className="space-y-5">
      <PublicSectionHeading
        description="Perguntas públicas ajudam a acelerar a negociação e dão mais contexto para quem está avaliando o anúncio."
        eyebrow="Perguntas"
        title="Perguntas e respostas"
      />

      {questions.length === 0 ? (
        <PublicEmptyState
          description="Ainda não há perguntas publicadas para este anúncio. Você pode ser a primeira pessoa a iniciar a conversa."
          icon={MessageSquareQuote}
          title="Sem perguntas publicadas"
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionThreadCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </section>
  )
}
