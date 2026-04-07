import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PlaceholderAction = {
  label: string
  to: string
  variant?: 'default' | 'outline' | 'secondary'
}

type PagePlaceholderProps = {
  actions?: PlaceholderAction[]
  children?: ReactNode
  description: string
  eyebrow: string
  highlights: string[]
  title: string
}

export function PagePlaceholder({
  actions,
  children,
  description,
  eyebrow,
  highlights,
  title,
}: PagePlaceholderProps) {
  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm md:p-8">
        <Badge variant="outline">{eyebrow}</Badge>
        <h1 className="mt-4 max-w-3xl font-display text-4xl tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>

        {actions?.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map(({ label, to, variant = 'default' }) => (
              <Button asChild key={to} variant={variant}>
                <Link to={to}>
                  {label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((highlight) => (
          <Card key={highlight}>
            <CardHeader>
              <CardTitle className="text-lg">{highlight}</CardTitle>
              <CardDescription>
                Placeholder estrutural para evolução incremental desta área.
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {children ? (
        <Card>
          <CardHeader>
            <CardTitle>Próximo passo sugerido</CardTitle>
            <CardDescription>
              Os blocos abaixo existem apenas para apoiar a fundação do projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      ) : null}
    </section>
  )
}
