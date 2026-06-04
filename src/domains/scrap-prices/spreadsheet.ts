import type { ScrapPriceItem } from '@/domains/scrap-prices/types'

export type ScrapPriceSpreadsheetRow = {
  id?: string
  isActive: boolean
  priceLabel: string
  productName: string
  quantityLabel: string
  sortOrder: number
}

export type ScrapPriceImportIssue = {
  row: number
  message: string
}

export type ScrapPriceImportPreview = {
  fileName: string
  issues: ScrapPriceImportIssue[]
  rows: ScrapPriceSpreadsheetRow[]
  validRows: ScrapPriceSpreadsheetRow[]
}

const SHEET_NAME = 'Precos'
const HEADER_LABELS = ['ID', 'Ordem', 'Produto', 'Preço', 'Quantidade', 'Ativo'] as const

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function normalizeStringValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

function parseBooleanLike(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0

  const normalized = normalizeStringValue(value).toLowerCase()
  if (!normalized) return true
  if (['1', 'true', 'sim', 's', 'ativo', 'yes', 'y'].includes(normalized)) return true
  if (['0', 'false', 'nao', 'não', 'n', 'inativo', 'no'].includes(normalized)) return false

  return true
}

function parseNumberLike(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const raw = normalizeStringValue(value)
  if (!raw) return Number.NaN

  const cleaned = raw.replace(/[^\d.,-]/g, '')
  if (!cleaned) return Number.NaN

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma === -1 && lastDot === -1) {
    return Number(cleaned)
  }

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    const normalized = cleaned.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.')
    return Number(normalized)
  }

  if (lastComma > -1) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'))
  }

  const dotCount = (cleaned.match(/\./g) ?? []).length
  if (dotCount > 1) {
    return Number(cleaned.replace(/\./g, ''))
  }

  return Number(cleaned)
}

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
})

function normalizePriceLabel(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BRL_FORMATTER.format(value)
  }

  const raw = normalizeStringValue(value)
  if (!raw) return ''

  const parsedNumber = parseNumberLike(raw)
  if (Number.isFinite(parsedNumber)) {
    return BRL_FORMATTER.format(parsedNumber)
  }

  const currencyMatch = raw.match(/(?:r\$\s*)?(\d[\d.,]*)/i)
  if (currencyMatch?.[1]) {
    const numeric = parseNumberLike(currencyMatch[1])
    if (Number.isFinite(numeric)) {
      return BRL_FORMATTER.format(numeric)
    }
  }

  return raw
}

function findRowValue(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row)
  for (const [key, value] of entries) {
    const normalizedKey = normalizeHeader(key)
    if (aliases.includes(normalizedKey)) {
      return value
    }
  }

  return undefined
}

function parseRow(row: Record<string, unknown>, index: number) {
  const id = normalizeStringValue(findRowValue(row, ['id', 'identificador']))
  const productName = normalizeStringValue(findRowValue(row, ['produto', 'productname']))
  const priceLabel = normalizePriceLabel(findRowValue(row, ['preco', 'price', 'pricelabel']))
  const quantityLabel = normalizeStringValue(findRowValue(row, ['quantidade', 'quantity', 'quantitylabel']))
  const sortOrderRaw = findRowValue(row, ['ordem', 'order', 'sortorder'])
  const isActiveRaw = findRowValue(row, ['ativo', 'active', 'isactive', 'status'])

  const issues: string[] = []
  const sortOrder = parseNumberLike(sortOrderRaw)

  if (!productName) issues.push('produto ausente')
  if (!priceLabel) issues.push('preço ausente')
  if (!quantityLabel) issues.push('quantidade ausente')
  if (!Number.isFinite(sortOrder)) issues.push('ordem inválida')

  if (issues.length > 0) {
    throw new Error(`Linha ${index + 2}: ${issues.join(', ')}.`)
  }

  return {
    id: id || undefined,
    isActive: parseBooleanLike(isActiveRaw),
    priceLabel,
    productName,
    quantityLabel,
    sortOrder,
  }
}

export async function downloadScrapPricesWorkbook(items: ScrapPriceItem[]) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()

  const rows = items.map((item) => ({
    ID: item.id,
    Ordem: item.sortOrder,
    Produto: item.productName,
    Preço: item.priceLabel,
    Quantidade: item.quantityLabel,
    Ativo: item.isActive ? 'Sim' : 'Não',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADER_LABELS] as string[] })
  XLSX.utils.book_append_sheet(workbook, worksheet, SHEET_NAME)
  XLSX.writeFile(workbook, `preco-das-sucatas-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function parseScrapPricesWorkbook(file: File): Promise<ScrapPriceImportPreview> {
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new Error('A planilha não possui abas válidas.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const rows: ScrapPriceSpreadsheetRow[] = []
  const issues: ScrapPriceImportIssue[] = []

  rawRows.forEach((row, index) => {
    const hasAnyValue = Object.values(row).some((value) => normalizeStringValue(value) !== '')
    if (!hasAnyValue) {
      return
    }

    try {
      rows.push(parseRow(row, index))
    } catch (error) {
      issues.push({
        row: index + 2,
        message: error instanceof Error ? error.message.replace(`Linha ${index + 2}: `, '') : 'Linha inválida.',
      })
    }
  })

  return {
    fileName: file.name,
    issues,
    rows,
    validRows: rows,
  }
}
