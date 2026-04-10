import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ListingSidebarCardProps = {
  children: ReactNode
  title: string
}

export function ListingSidebarCard({ children, title }: ListingSidebarCardProps) {
  return (
    <Card className="overflow-hidden rounded-[1.85rem] border-[#d8e3d8] bg-white shadow-[0_24px_56px_-44px_rgba(19,33,23,0.28)]">
      <CardHeader className="border-b border-border/70 bg-[linear-gradient(180deg,#fafcf9_0%,#f4f8f3_100%)] pb-4">
        <CardTitle className="text-lg tracking-[-0.02em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">{children}</CardContent>
    </Card>
  )
}
