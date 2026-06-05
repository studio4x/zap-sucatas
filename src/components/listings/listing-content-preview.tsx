import { cn } from '@/lib/utils'

type ListingContentPreviewProps = {
  className?: string
  value: string
}

function hasHtmlMarkup(value: string) {
  return /<([a-z][\w-]*)(\s[^>]*)?>/i.test(value)
}

export function ListingContentPreview({ className, value }: ListingContentPreviewProps) {
  const content = value.trim()

  if (!content) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Sem resumo disponível.</span>
  }

  if (hasHtmlMarkup(content)) {
    return (
      <div
        className={cn(
          'listing-rich-content line-clamp-2 max-w-full overflow-hidden text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere] [&_p]:m-0 [&_p]:inline [&_p]:break-words [&_br]:block [&_strong]:font-semibold [&_em]:italic',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <p
      className={cn(
        'line-clamp-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]',
        className,
      )}
    >
      {content}
    </p>
  )
}
