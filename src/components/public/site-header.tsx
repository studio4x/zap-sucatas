import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { getDefaultPathByRole, paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { cn } from '@/lib/utils'

const baseNavItems = [
  { label: 'Anúncios', to: paths.public.listings },
  { label: 'Preços dos Metais', to: paths.public.scrapPrices },
  { label: 'Cotação LME', to: paths.public.pricing },
  { label: 'Sobre', to: paths.public.about },
  { label: 'Suporte', to: paths.public.support },
  { label: 'Contato', to: paths.public.contact },
]

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const isCompactRef = useRef(false)
  const { blogEnabled, settings } = useSystemSettings()
  const { isAuthenticated, user } = useAuth()
  const baseLogoScale = settings?.headerLogoScalePercent ?? 100
  const compactLogoScale = useMemo(
    () => Math.max(60, Math.round(baseLogoScale * 0.72)),
    [baseLogoScale],
  )
  const navItems = blogEnabled
    ? [...baseNavItems.slice(0, 3), { label: 'Blog', to: paths.public.blog }, ...baseNavItems.slice(3)]
    : baseNavItems
  const dashboardPath = user ? getDefaultPathByRole(user.role) : paths.auth.login

  useEffect(() => {
    const ENTER_COMPACT_AT = 56
    const EXIT_COMPACT_AT = 16
    let rafId = 0

    const syncCompactState = () => {
      const y = window.scrollY
      const nextCompact = isCompactRef.current ? y > EXIT_COMPACT_AT : y > ENTER_COMPACT_AT

      if (nextCompact !== isCompactRef.current) {
        isCompactRef.current = nextCompact
        setIsCompact(nextCompact)
      }
    }

    const handleScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        syncCompactState()
      })
    }

    syncCompactState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl">
      <div className={cn('mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 transition-all duration-200 md:px-6 lg:px-8', isCompact ? 'py-2' : 'py-4')}>
        <Brand
          hideSubtitle={isCompact}
          layout="stacked"
          logoScalePercent={isCompact ? compactLogoScale : baseLogoScale}
          subtitle="Marketplace especializado em sucatas"
        />

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                cn(
                  'transition-colors hover:text-foreground',
                  isActive && 'text-foreground',
                )
              }
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!isAuthenticated ? (
            <Button asChild size="sm" variant="ghost">
              <Link to={paths.auth.login}>Entrar</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link to={dashboardPath}>Acessar Painel</Link>
            </Button>
          )}
          <Button asChild className="h-12 px-8 text-base font-semibold uppercase tracking-wide">
            <Link to={paths.auth.register}>ANUNCIAR AGORA</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated ? (
            <Button asChild size="sm" variant="outline">
              <Link to={dashboardPath}>Painel</Link>
            </Button>
          ) : null}
          <Button asChild size="icon" variant="outline">
            <Link aria-label="Buscar anúncios" to={paths.public.listings}>
              <Search className="size-5" />
            </Link>
          </Button>
          <Button
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            size="icon"
            type="button"
            variant="outline"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-border/80 bg-background/96 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-4 md:px-6">
            {navItems.map(({ label, to }) => (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-secondary text-foreground',
                  )
                }
                onClick={() => setIsMobileMenuOpen(false)}
                to={to}
              >
                {label}
              </NavLink>
            ))}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {!isAuthenticated ? (
                <Button asChild variant="outline">
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={paths.auth.login}>
                    Entrar
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={dashboardPath}>
                    Acessar Painel
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link onClick={() => setIsMobileMenuOpen(false)} to={paths.auth.register}>
                  ANUNCIAR AGORA
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
