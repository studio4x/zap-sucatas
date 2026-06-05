import { paths } from '@/app/paths'
import { NotificationBellMenu } from '@/components/notifications/notification-bell-menu'

type AdminNotificationBellProps = {
  className?: string
}

export function AdminNotificationBell({ className }: AdminNotificationBellProps) {
  return (
    <NotificationBellMenu
      className={className}
      notificationsPath={paths.admin.notifications}
      queryKeyScope="admin"
      title="Notificações do admin"
    />
  )
}
