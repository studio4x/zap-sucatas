import type { ReactNode } from 'react'
import { AdminEmptyState } from '@/components/admin/admin-empty-state'
import { cn } from '@/lib/utils'

type AdminDataTableColumn<T> = {
  cell: (row: T) => ReactNode
  className?: string
  header: string
}

type AdminDataTableProps<T> = {
  columns: AdminDataTableColumn<T>[]
  data: T[]
  emptyDescription: string
  emptyTitle: string
  errorMessage?: string
  getRowKey: (row: T) => string
  isError?: boolean
  isLoading?: boolean
  minWidth?: string
  rowClassName?: (row: T) => string | undefined
}

export function AdminDataTable<T>({
  columns,
  data,
  emptyDescription,
  emptyTitle,
  errorMessage = 'Não foi possível carregar os dados desta tela.',
  getRowKey,
  isError,
  isLoading,
  minWidth = 'min-w-[860px]',
  rowClassName,
}: AdminDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-sm text-muted-foreground shadow-sm">
        Carregando dados operacionais...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-700 shadow-sm">
        {errorMessage}
      </div>
    )
  }

  if (data.length === 0) {
    return <AdminEmptyState description={emptyDescription} title={emptyTitle} />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className={cn('w-full border-collapse text-sm', minWidth)}>
          <thead className="bg-muted/65 text-left">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground',
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
              <tr
                className={cn(
                  'border-t border-border align-top transition-colors hover:bg-slate-50/80',
                  rowClassName?.(row),
                )}
                key={getRowKey(row)}
              >
                {columns.map((column) => (
                  <td className={cn('px-4 py-3 text-sm text-foreground', column.className)} key={column.header}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
