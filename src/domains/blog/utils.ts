export type BlogContentDocument = {
  blocks: Array<{
    text: string
    type: 'paragraph'
  }>
  raw: string
  version: 1
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeBlogHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
}

export function parseBlogTagsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

export function formatBlogTagsInput(tags: string[]) {
  return tags.join(', ')
}

export function estimateBlogReadTime(content: unknown) {
  const plainText = blogContentToPlainText(content).trim()

  if (plainText.length === 0) {
    return 1
  }

  const words = plainText.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
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
  const plain = /<[a-z][\s\S]*>/i.test(normalized) ? stripHtml(normalized) : normalized
  const blocks = normalized
    .split(/\n{2,}|<\/p>/i)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      text: stripHtml(block),
      type: 'paragraph' as const,
    }))

  return {
    blocks,
    raw: normalized || plain,
    version: 1,
  }
}

export function blogContentToEditableHtml(content: unknown) {
  if (content && typeof content === 'object' && 'raw' in content) {
    const raw = (content as { raw?: unknown }).raw

    if (typeof raw === 'string') {
      return normalizeBlogHtmlEntities(raw)
    }
  }

  return blogContentToPlainText(content)
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

export function blogContentHasHtml(content: unknown) {
  if (content && typeof content === 'object' && 'raw' in content) {
    const raw = (content as { raw?: unknown }).raw
    return typeof raw === 'string' ? /<[a-z][\s\S]*>/i.test(raw) : false
  }
  return false
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
