import { paths } from '@/app/paths'
import { PagePlaceholder } from '@/components/shared/page-placeholder'

export function NotFoundPage() {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl items-center">
        <PagePlaceholder
          actions={[
            {
              label: 'Voltar para a home',
              to: paths.public.home,
            },
          ]}
          description="A rota solicitada não existe nesta fundação inicial. Isso normalmente significa que a página ainda não foi modelada."
          eyebrow="404"
          highlights={[
            'Fallback global do router',
            'Espaço pronto para página de erro customizada',
            'Pode evoluir para error boundaries depois',
          ]}
          title="Página não encontrada"
        />
      </div>
    </div>
  )
}
