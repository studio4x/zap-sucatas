import { ArrowDownWideNarrow } from 'lucide-react'

type SortOption = {
  label: string
  value: string
}

type ListingSortBarProps = {
  onChange: (value: string) => void
  options: SortOption[]
  resultLabel: string
  value: string
}

export function ListingSortBar({
  onChange,
  options,
  resultLabel,
  value,
}: ListingSortBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-card/85 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">{resultLabel}</p>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <ArrowDownWideNarrow className="size-4 text-primary" />
          Ordenar por
        </span>
        <select
          className="flex h-11 min-w-52 rounded-2xl border border-input bg-background/90 px-4 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
