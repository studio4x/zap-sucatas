import { cn } from '@/lib/utils'

type SwitchProps = {
  checked: boolean
  className?: string
  disabled?: boolean
  id?: string
  onCheckedChange: (checked: boolean) => void
}

export function Switch({ checked, className, disabled, id, onCheckedChange }: SwitchProps) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border border-transparent bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        className,
      )}
      data-slot="switch"
      disabled={disabled}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  )
}
