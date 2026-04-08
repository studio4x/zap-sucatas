import { Menu } from 'lucide-react'
import type { SessionUser } from '@/domains/auth/types'
import { Button } from '@/components/ui/button'

type DashboardMobileHeaderProps = {
  currentLabel: string
  onMenuOpen: () => void
  user: SessionUser | null
}

export function DashboardMobileHeader({
  currentLabel,
  onMenuOpen,
  user,
}: DashboardMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-4 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{currentLabel}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.fullName?.trim() || user?.email || 'Area do anunciante'}
          </p>
        </div>
        <Button onClick={onMenuOpen} size="icon" type="button" variant="outline">
          <Menu className="size-4" />
        </Button>
      </div>
    </header>
  )
}
