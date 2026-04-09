import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { Button } from '@/components/ui/button'

type MaintenanceScreenProps = {
  description: string
  title: string
  tone?: 'dashboard' | 'public'
}

export function MaintenanceScreen({
  description,
  title,
  tone = 'public',
}: MaintenanceScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border/80 bg-card/95 p-8 text-center shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
          Manutenção programada
        </p>
        <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant={tone === 'dashboard' ? 'outline' : 'default'}>
            <Link to={paths.auth.login}>Acessar conta</Link>
          </Button>
          {tone === 'dashboard' ? null : (
            <Button asChild type="button" variant="outline">
              <Link to={paths.auth.forgotPassword}>Preciso redefinir a senha</Link>
            </Button>
          )}
        </div>

        <div className="mt-8 border-t border-border/70 pt-4">
          <BuildVersionBadge />
        </div>
      </div>
    </div>
  )
}
