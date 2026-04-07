import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function AppQuestionsPage() {
  return (
    <PagePlaceholder
      description="Central de perguntas recebidas pelo anunciante com resposta e acompanhamento do status de moderacao."
      eyebrow="Perguntas"
      highlights={[
        'Inbox por anuncio',
        'Resposta com ownership validado',
        'Fluxo futuro via Edge Function',
      ]}
      title="Central de perguntas"
    />
  )
}
