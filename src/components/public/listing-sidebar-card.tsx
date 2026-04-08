import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ListingSidebarCardProps = {
  children: ReactNode
  title: string
}

export function ListingSidebarCard({ children, title }: ListingSidebarCardProps) {
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
