import type { LucideIcon } from 'lucide-react'
import { ChevronRight, PanelLeftClose } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { fetchAdminNotificationQueueStats } from '@/domains/notifications/api'
import { fetchAdminSupportTickets } from '@/domains/support/api'
import { cn } from '@/lib/utils'

export type AdminNavItem = {
  end?: boolean
  icon: LucideIcon
  label: string
  to: string
}

type AdminSidebarProps = {
  items: AdminNavItem[]
  onClose?: () => void
}

type AdminNavGroup = {
  description: string
  key: string
  title: string
  values: string[]
}

const adminNavGroups: AdminNavGroup[] = [
  {
    key: 'visao-geral',
    title: 'Visão geral',
    description: 'Painel executivo e acompanhamento operacional.',
    values: [paths.admin.root, paths.admin.analytics],
  },
  {
    key: 'conteúdo',
    title: 'Conteúdo',
    description: 'Catálogo, experiência pública e edição da plataforma.',
    values: [
      paths.admin.listings,
      paths.admin.categories,
      paths.admin.materials,
      paths.admin.pages,
      paths.admin.blog,
      paths.admin.pricing,
      paths.admin.scrapPrices,
    ],
  },
  {
    key: 'relacionamento',
    title: 'Relacionamento',
    description: 'Pessoas, mensagens, reputação e atendimento.',
    values: [
      paths.admin.users,
      paths.admin.questions,
      paths.admin.contactMessages,
      paths.admin.support,
      paths.admin.notifications,
    ],
  },
  {
    key: 'financeiro',
    title: 'Financeiro',
    description: 'Recebimentos, repasses e parâmetros de monetização.',
    values: [paths.admin.featuredPayments],
  },
  {
    key: 'plataforma',
    title: 'Plataforma',
    description: 'Configurações de apoio e administração da conta.',
    values: [paths.admin.settings, paths.admin.logs],
  },
]

export function AdminSidebar({ items, onClose }: AdminSidebarProps) {
  const supportQueueQuery = useQuery({
    queryKey: ['support', 'admin', 'sidebar-summary'],
    queryFn: fetchAdminSupportTickets,
    staleTime: 30_000,
  })
  const unresolvedTickets = (supportQueueQuery.data ?? []).filter((ticket) => ticket.status !== 'closed').length
  const overdueTickets = (supportQueueQuery.data ?? []).filter((ticket) => ticket.slaStatus === 'overdue').length
  const notificationStatsQuery = useQuery({
    queryKey: ['notifications', 'admin', 'sidebar-stats'],
    queryFn: fetchAdminNotificationQueueStats,
    staleTime: 30_000,
  })
  const pendingNotifications = (notificationStatsQuery.data?.pending ?? 0) + (notificationStatsQuery.data?.retrying ?? 0)
  const itemByPath = new Map(items.map((item) => [item.to, item]))
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(adminNavGroups.map((group) => [group.key, true])) as Record<string, boolean>,
  )
  const groupedItems = useMemo(
    () =>
      adminNavGroups.map((group) => ({
        ...group,
        items: group.values
          .map((path) => itemByPath.get(path))
          .filter((item): item is AdminNavItem => Boolean(item)),
      })),
    [itemByPath],
  )

  return (
    <aside className="flex h-full flex-col bg-sidebar px-5 py-4 text-sidebar-foreground">
      <div className="flex items-start justify-between gap-3 border-b border-sidebar-border pb-4">
        <Brand layout="stacked" subtitle="Backoffice operacional" />
        {onClose ? (
          <button
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
            onClick={onClose}
            type="button"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {groupedItems.map((group) => {
          if (group.items.length === 0) {
            return null
          }

          return (
            <section className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-26px_rgba(19,33,23,0.22)]" key={group.key}>
              <button
                className="mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-sidebar-accent/40"
                onClick={() =>
                  setCollapsedGroups((current) => ({
                    ...current,
                    [group.key]: !current[group.key],
                  }))
                }
                type="button"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{group.title}</p>
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground">
                  <ChevronRight className={cn('size-4 transition-transform', collapsedGroups[group.key] ? '' : 'rotate-90')} />
                </span>
              </button>
              <p className="mb-2 px-1 text-xs leading-5 text-muted-foreground">{group.description}</p>

              {!collapsedGroups[group.key] ? (
                <div className="space-y-1">
                  {group.items.map(({ end, icon: Icon, label, to }) => (
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary !text-white shadow-sm [&_svg]:!text-white'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                        )
                      }
                      end={end}
                      key={to}
                      onClick={onClose}
                      to={to}
                    >
                      <Icon className="size-4" />
                      <span className="truncate">{label}</span>
                      {to === paths.admin.support && unresolvedTickets > 0 ? (
                        <span
                          className={cn(
                            'ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            overdueTickets > 0 ? 'bg-white/18 text-white ring-1 ring-white/25' : 'bg-sidebar-accent text-foreground',
                          )}
                        >
                          {unresolvedTickets}
                        </span>
                      ) : null}
                      {to === paths.admin.notifications && pendingNotifications > 0 ? (
                        <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {pendingNotifications > 99 ? '99+' : pendingNotifications}
                        </span>
                      ) : null}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </nav>

      {overdueTickets > 0 ? (
        <div className="mt-3 rounded-[1rem] border border-[#e7c1b9] bg-[#fff5f2] px-3 py-3 text-xs text-[#8f3326] shadow-[0_12px_30px_-24px_rgba(143,51,38,0.22)]">
          <p className="font-semibold uppercase tracking-[0.14em]">SLA em atraso</p>
          <p className="mt-2 leading-5">
            {overdueTickets} chamado{overdueTickets > 1 ? 's' : ''} precisa{overdueTickets > 1 ? 'm' : ''} de primeira resposta.
          </p>
        </div>
      ) : null}

    </aside>
  )
}
