import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AdminPaginationProps = {
  currentPage: number
  onPageChange: (page: number) => void
  pageSize: number
  totalItems: number
}

export function AdminPagination({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems <= pageSize) {
    return null
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-card px-4 py-3 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.34),0_10px_18px_-18px_rgba(39,153,31,0.2)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Exibindo {startItem}-{endItem} de {totalItems} registros
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="px-2 text-sm font-medium text-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Próxima
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
