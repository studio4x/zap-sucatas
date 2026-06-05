import { paths } from '@/app/paths'
import { NotificationBellMenu } from '@/components/notifications/notification-bell-menu'

type AppNotificationBellProps = {
  className?: string
}

export function AppNotificationBell({ className }: AppNotificationBellProps) {
  return (
    <NotificationBellMenu
      className={className}
      notificationsPath={paths.app.notifications}
      queryKeyScope="app"
      title="Notificações da conta"
    />
  )
}
