export type BlogContentDocument = {
  blocks: Array<{
    text: string
    type: 'paragraph'
  }>
  raw: string
  version: 1
}

function collectText(value: unknown, bucket: string[]) {
  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed) {
      bucket.push(trimmed)
    }

    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, bucket))
    return
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectText(item, bucket))
  }
}

export function slugifyBlogValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function createBlogContentDocument(rawText: string): BlogContentDocument {
  const normalized = rawText.trim()
  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      text: block,
      type: 'paragraph' as const,
    }))

  return {
    blocks,
    raw: normalized,
    version: 1,
  }
}

export function blogContentToPlainText(content: unknown) {
  if (content && typeof content === 'object' && 'raw' in content) {
    const raw = (content as { raw?: unknown }).raw

    if (typeof raw === 'string') {
      return raw
    }
  }

  const paragraphs = extractBlogParagraphs(content)
  return paragraphs.join('\n\n')
}

export function extractBlogParagraphs(content: unknown) {
  if (content && typeof content === 'object' && 'blocks' in content) {
    const blocks = (content as { blocks?: unknown }).blocks

    if (Array.isArray(blocks)) {
      const paragraphs = blocks
        .map((block) => {
          if (!block || typeof block !== 'object') {
            return null
          }

          const text = (block as { text?: unknown }).text
          return typeof text === 'string' ? text.trim() : null
        })
        .filter((value): value is string => Boolean(value))

      if (paragraphs.length > 0) {
        return paragraphs
      }
    }
  }

  const paragraphs: string[] = []
  collectText(content, paragraphs)

  return Array.from(new Set(paragraphs)).filter((item) => item.length > 20)
}
