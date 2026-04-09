export type PaginatedResult<T> = {
  items: T[]
  totalCount: number
}

export type PaginationInput = {
  page: number
  pageSize: number
}

export function getPaginationRange(input: PaginationInput) {
  const safePage = Math.max(1, input.page)
  const safePageSize = Math.max(1, input.pageSize)
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  return {
    from,
    to,
  }
}
