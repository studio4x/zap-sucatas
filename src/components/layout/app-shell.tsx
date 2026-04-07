import type { LucideIcon } from 'lucide-react'
import { ArrowRightLeft, LogOut } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { Brand } from '@/components/navigation/brand'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type NavItem = {
  end?: boolean
  icon: LucideIcon
  label: string
  to: string
}

type AppShellProps = PropsWithChildren<{
  description: string
  navItems: NavItem[]
  title: string
  tone: 'admin' | 'user'
  topIcon: LucideIcon
}>

const toneStyles = {
  user: {
    badge: 'border-primary/20 bg-primary/10 text-primary',
    icon: 'bg-primary/10 text-primary',
    layout:
      'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.95))]',
  },
  admin: {
    badge: 'border-amber-300/40 bg-amber-200/50 text-amber-900',
    icon: 'bg-amber-200/70 text-amber-900',
    layout:
      'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_30%),linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.95))]',
  },
} as const

function getRoleLabel(role: 'admin' | 'user') {
  return role === 'admin' ? 'Administrador' : 'Usuario'
}

function getStatusLabel(status: 'active' | 'suspended' | 'under_review') {
  if (status === 'active') {
    return 'Perfil ativo'
  }

  if (status === 'suspended') {
    return 'Perfil suspenso'
  }

  return 'Perfil em analise'
}

export function AppShell({
  children,
  description,
  navItems,
  title,
  tone,
  topIcon: TopIcon,
}: AppShellProps) {
  const { signOut, user } = useAuth()
  const toneStyle = toneStyles[tone]

  return (
    <div className={cn('min-h-screen px-4 py-4 md:px-6 lg:px-8', toneStyle.layout)}>
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-border/70 bg-background/90 shadow-[0_24px_80px_rgba(17,24,39,0.12)] backdrop-blur lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-border/70 bg-sidebar/85 p-6 lg:border-b-0 lg:border-r">
          <Brand subtitle={tone === 'admin' ? 'Backoffice / Governanca' : 'Operacao do cliente'} />

          <div className={cn('mt-8 rounded-3xl border border-border/70 p-5', toneStyle.badge)}>
            <div
              className={cn(
                'mb-4 flex size-11 items-center justify-center rounded-2xl',
                toneStyle.icon,
              )}
            >
              <TopIcon className="size-5" />
            </div>
            <h2 className="font-display text-xl text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/80">{description}</p>
          </div>

          <nav className="mt-8 grid gap-2">
            {navItems.map(({ end, icon: Icon, label, to }) => (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
                end={end}
                to={to}
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-full flex-col">
          <header className="border-b border-border/70 px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge className={toneStyle.badge} variant="outline">
                  {tone === 'admin' ? 'Nivel administrativo' : 'Sessao autenticada'}
                </Badge>
                <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Estrutura pronta para conectar navegacao operacional, permissoes reais e modulos
                  do MVP.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-border/70 bg-card/90 px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">
                    {user?.fullName?.trim() || user?.email || 'Sessao autenticada'}
                  </p>
                  <p className="text-muted-foreground">{user?.email ?? 'Sem email carregado'}</p>
                  <p className="text-muted-foreground">
                    {user
                      ? `${getRoleLabel(user.role)} - ${getStatusLabel(user.status)}`
                      : 'Perfil indisponivel'}
                  </p>
                </div>
                <Button onClick={signOut} variant="outline">
                  <LogOut className="size-4" />
                  Sair
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 lg:px-8">
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRightLeft className="size-4" />
              Navegacao estrutural pronta para receber os fluxos reais do MVP.
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
