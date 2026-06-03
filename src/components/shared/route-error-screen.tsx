import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useRouteError, useLocation, Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RouteLoadingScreen } from '@/components/shared/route-loading-screen'
import { isChunkLoadError, shouldRetryChunkLoad } from '@/lib/lazy-with-retry'

function getFallbackPath(pathname: string) {
  if (pathname.startsWith('/admin')) {
    return paths.admin.root
  }

  if (pathname.startsWith('/app')) {
    return paths.app.root
  }

  return paths.public.home
}

export function RouteErrorScreen() {
  const error = useRouteError()
  const location = useLocation()
  const fallbackPath = getFallbackPath(location.pathname)
  const message = error instanceof Error ? error.message : 'Ocorreu um erro ao carregar a página.'
  const isChunkError = isChunkLoadError(error)

  useEffect(() => {
    if (!isChunkError || typeof window === 'undefined' || !shouldRetryChunkLoad()) {
      return
    }

    window.location.reload()
  }, [isChunkError])

  if (isChunkError) {
    return <RouteLoadingScreen />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl rounded-[2rem] border-border/80 shadow-xl">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Erro de carregamento
              </p>
              <h1 className="font-display text-3xl text-foreground">Não foi possível carregar esta área</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Isso normalmente acontece quando o navegador está com um bundle antigo em cache ou quando a
                sessão de navegação foi interrompida. Recarregar a página costuma resolver.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Detalhe técnico
            </p>
            <p className="mt-2 break-words text-sm text-foreground">{message}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()} type="button">
              <RefreshCw className="size-4" />
              Recarregar página
            </Button>
            <Button asChild variant="outline">
              <Link to={fallbackPath}>Ir para a área principal</Link>
            </Button>
          </div>

          <div className="border-t border-border/70 pt-4">
            <BuildVersionBadge />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
