import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type PublicAuthShellProps = {
  badge: string
  children: ReactNode
  media?: ReactNode
  description: string
  highlights: string[]
  title: string
}

export function PublicAuthShell({
  badge,
  children,
  media,
  description,
  highlights,
  title,
}: PublicAuthShellProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-start">
      <div className="overflow-hidden rounded-[2.2rem] border border-border bg-white">
        <div className="space-y-6 px-6 py-7 md:px-7 md:py-8">
          {media ? <div>{media}</div> : null}

          <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
            {badge}
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-4xl leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[3.25rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              {description}
            </p>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/85 bg-white/88 px-4 py-4 text-sm leading-7 text-foreground shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Card className="rounded-[2rem] border-[#d8e3d8] bg-white shadow-[0_28px_64px_-44px_rgba(19,33,23,0.28)]">
        <CardContent className="p-5 md:p-6">{children}</CardContent>
      </Card>
    </section>
  )
}
