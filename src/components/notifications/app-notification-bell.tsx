import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { fetchUnreadNotificationsCount } from '@/domains/notifications/api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type AppNotificationBellProps = {
  className?: string
}

export function AppNotificationBell({ className }: AppNotificationBellProps) {
  const { user } = useAuth()
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count', user?.profileId],
    queryFn: fetchUnreadNotificationsCount,
    enabled: Boolean(user?.profileId),
    refetchInterval: 30_000,
  })

  const unreadCount = unreadQuery.data ?? 0

  return (
    <Link
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition hover:bg-secondary',
        className,
      )}
      to={paths.app.notifications}
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}
