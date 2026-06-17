import { ArrowRight, Clock3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { AdminTutorial } from '@/domains/admin-tutorials/types'
import { sanitizeRichTextHtml } from '@/domains/admin-tutorials/sanitize'
import { cn } from '@/lib/utils'

type AdminTutorialContentProps = {
  actions?: ReactNode
  className?: string
  compact?: boolean
  tutorial: AdminTutorial
}

export function AdminTutorialContent({
  actions,
  className,
  compact = false,
  tutorial,
}: AdminTutorialContentProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <Card className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.42)]">
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">
                  {tutorial.category}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <Clock3 className="size-3.5" />
                  {tutorial.estimatedMinutes} min de leitura
                </span>
              </div>
              <div className="space-y-2">
                <h2 className={cn('font-display text-2xl leading-tight text-slate-950', compact ? 'md:text-[1.7rem]' : 'md:text-[2.1rem]')}>
                  {tutorial.title}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-[15px]">{tutorial.summary}</p>
              </div>
            </div>

            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>

          <div className="space-y-4">
            {tutorial.steps.map((step, index) => (
              <article
                className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/85 p-5 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.7)]"
                key={`${tutorial.id}-step-${index}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 space-y-3">
                    <h3 className="text-base font-semibold text-slate-950 md:text-lg">{step.title}</h3>
                    <div
                      className="tutorial-rich-content text-sm leading-7 text-slate-700 [&_a]:text-sky-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(step.description) }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/85 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Dicas rápidas</p>
            <div className="mt-4 space-y-3">
              {tutorial.notes.map((note, index) => (
                <div className="flex items-start gap-3 text-sm leading-7 text-emerald-950" key={`${tutorial.id}-note-${index}`}>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-emerald-700" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
