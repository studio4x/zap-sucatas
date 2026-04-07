import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AdminQuestionsPage() {
  return (
    <PagePlaceholder
      description="Gestao de perguntas e respostas para moderacao de conteudo inadequado e rastreabilidade."
      eyebrow="Admin / perguntas"
      highlights={[
        'Moderacao de perguntas publicadas',
        'Acoes de ocultar e bloquear',
        'Visao cruzada por anuncio',
      ]}
      title="Gestao de perguntas e respostas"
    />
  )
}
