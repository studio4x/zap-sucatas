import { useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Anúncios', to: paths.public.listings },
  { label: 'Preços', to: paths.public.pricing },
  { label: 'Blog', to: paths.public.blog },
  { label: 'Sobre', to: paths.public.about },
  { label: 'Suporte', to: paths.public.support },
  { label: 'Contato', to: paths.public.contact },
]

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <Brand subtitle="Marketplace especializado em sucatas" />

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
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.auth.login}>Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={paths.auth.register}>Anunciar agora</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
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
              <Button asChild variant="outline">
                <Link onClick={() => setIsMobileMenuOpen(false)} to={paths.auth.login}>
                  Entrar
                </Link>
              </Button>
              <Button asChild>
                <Link onClick={() => setIsMobileMenuOpen(false)} to={paths.auth.register}>
                  Quero anunciar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
