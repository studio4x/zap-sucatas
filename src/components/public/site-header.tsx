import { NavLink } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Anuncios', to: paths.public.listings },
  { label: 'Categorias', to: paths.public.categories },
  { label: 'Precos', to: paths.public.pricing },
  { label: 'Blog', to: paths.public.blog },
  { label: 'Sobre', to: paths.public.about },
  { label: 'Contato', to: paths.public.contact },
]

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 px-6 py-5 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Brand subtitle="Marketplace de sucatas e maquinarios" />

        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                cn('transition-colors hover:text-foreground', isActive && 'text-foreground')
              }
              to={to}
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) =>
              cn('transition-colors hover:text-foreground', isActive && 'text-foreground')
            }
            to={paths.auth.login}
          >
            Login
          </NavLink>
          <Button asChild size="sm" variant="outline">
            <NavLink to={paths.auth.register}>Anunciar</NavLink>
          </Button>
        </nav>
      </div>
    </header>
  )
}
