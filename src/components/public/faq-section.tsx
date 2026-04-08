import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PublicSectionHeading } from '@/components/public/public-section-heading'

type FaqItem = {
  answer: string
  question: string
}

type FaqSectionProps = {
  description: string
  items: FaqItem[]
  title: string
}

export function FaqSection({ description, items, title }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0)

  return (
    <section className="space-y-6">
      <PublicSectionHeading description={description} eyebrow="FAQ" title={title} />

      <div className="grid gap-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={item.question}
              className="rounded-[1.5rem] border border-border bg-card/88 px-5 py-4 shadow-sm"
            >
              <button
                className="flex w-full items-center justify-between gap-4 text-left"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                type="button"
              >
                <span className="text-base font-semibold text-foreground">{item.question}</span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 text-muted-foreground transition',
                    isOpen && 'rotate-180 text-primary',
                  )}
                />
              </button>
              {isOpen ? (
                <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
