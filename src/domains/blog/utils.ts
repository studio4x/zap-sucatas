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

export function extractBlogParagraphs(content: unknown) {
  const paragraphs: string[] = []
  collectText(content, paragraphs)

  return Array.from(new Set(paragraphs)).filter((item) => item.length > 20)
}
