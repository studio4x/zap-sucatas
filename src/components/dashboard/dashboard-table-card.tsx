import type { ReactNode } from 'react'
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state'
import { cn } from '@/lib/utils'

type DashboardTableColumn<T> = {
  cell: (row: T) => ReactNode
  className?: string
  header: string
}

type DashboardTableCardProps<T> = {
  action?: ReactNode
  columns: DashboardTableColumn<T>[]
  data: T[]
  description?: string
  emptyDescription: string
  emptyTitle: string
  errorMessage?: string
  getRowKey: (row: T) => string
  isError?: boolean
  isLoading?: boolean
  minWidth?: string
  title: string
}

export function DashboardTableCard<T>({
  action,
  columns,
  data,
  description,
  emptyDescription,
  emptyTitle,
  errorMessage = 'Não foi possível carregar os dados.',
  getRowKey,
  isError,
  isLoading,
  minWidth = 'min-w-[720px]',
  title,
}: DashboardTableCardProps<T>) {
  return (
    <section className="rounded-2xl bg-card shadow-[0_20px_38px_-30px_rgba(0,0,0,0.38),0_12px_20px_-20px_rgba(39,153,31,0.22)]">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
      </div>

      {isLoading ? (
        <div className="px-5 py-10 text-sm text-muted-foreground">Carregando dados...</div>
      ) : null}

      {isError ? (
        <div className="px-5 py-10 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {!isLoading && !isError && data.length === 0 ? (
        <div className="p-5">
          <DashboardEmptyState description={emptyDescription} title={emptyTitle} />
        </div>
      ) : null}

      {!isLoading && !isError && data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className={cn('w-full border-collapse text-sm', minWidth)}>
            <thead className="bg-muted/40 text-left">
              <tr>
                {columns.map((column) => (
                  <th
                    className={cn(
                      'px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground',
                      column.className,
                    )}
                    key={column.header}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr className="transition-colors hover:bg-muted/20" key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td className={cn('px-5 py-4 align-top', column.className)} key={column.header}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
