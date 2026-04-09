import type { OperationFeedbackState } from '@/hooks/use-operation-feedback'
import { cn } from '@/lib/utils'

type OperationFeedbackProps = {
  className?: string
  feedback: OperationFeedbackState | null
}

export function OperationFeedback({ className, feedback }: OperationFeedbackProps) {
  if (!feedback) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 text-sm shadow-sm',
        feedback.tone === 'success' && 'border border-emerald-200 bg-emerald-50 text-emerald-700',
        feedback.tone === 'error' && 'border border-rose-200 bg-rose-50 text-rose-700',
        feedback.tone === 'warning' && 'border border-amber-200 bg-amber-50 text-amber-800',
        feedback.tone === 'info' && 'border border-sky-200 bg-sky-50 text-sky-700',
        className,
      )}
    >
      {feedback.message}
    </div>
  )
}
