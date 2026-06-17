const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'em',
  'h2',
  'h3',
  'h4',
  'li',
  'ol',
  'p',
  'strong',
  'u',
  'ul',
])

const DROP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed'])

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function isSafeHref(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('mailto:')
}

function sanitizeAnchor(element: HTMLAnchorElement) {
  const href = element.getAttribute('href')?.trim() ?? ''
  if (!isSafeHref(href)) {
    element.removeAttribute('href')
  } else {
    element.setAttribute('href', href)
    element.setAttribute('rel', 'noopener noreferrer')
    element.setAttribute('target', '_blank')
  }

  for (const attribute of [...element.attributes]) {
    if (!['href', 'rel', 'target'].includes(attribute.name)) {
      element.removeAttribute(attribute.name)
    }
  }
}

function sanitizeElementTree(root: ParentNode) {
  for (const node of [...root.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()

      if (DROP_TAGS.has(tagName)) {
        element.remove()
        continue
      }

      if (!ALLOWED_TAGS.has(tagName)) {
        const fragment = document.createDocumentFragment()
        while (element.firstChild) {
          fragment.appendChild(element.firstChild)
        }
        element.replaceWith(fragment)
        sanitizeElementTree(root)
        continue
      }

      for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase()
        if (name.startsWith('on') || name === 'style' || name === 'class' || name === 'id') {
          element.removeAttribute(attribute.name)
        }
      }

      if (tagName === 'a') {
        sanitizeAnchor(element as HTMLAnchorElement)
      } else {
        for (const attribute of [...element.attributes]) {
          element.removeAttribute(attribute.name)
        }
      }

      sanitizeElementTree(element)
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove()
    }
  }
}

export function sanitizeRichTextHtml(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '<p></p>'
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return `<p>${escapeHtml(trimmed)}</p>`
  }

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<div>${trimmed}</div>`, 'text/html')
  const wrapper = documentNode.body.firstElementChild

  if (!wrapper) {
    return '<p></p>'
  }

  sanitizeElementTree(wrapper)
  const normalized = wrapper.innerHTML.trim()

  return normalized.length > 0 ? normalized : '<p></p>'
}
