import type { AdminTutorial } from '@/domains/admin-tutorials/types'

export function slugifyTutorialValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function createTutorialSlug(title: string) {
  return slugifyTutorialValue(title) || 'tutorial'
}

export function createUniqueTutorialSlug(title: string, existingSlugs: string[]) {
  const normalizedExistingSlugs = new Set(existingSlugs.map((slug) => slug.trim()).filter(Boolean))
  const baseSlug = createTutorialSlug(title)

  if (!normalizedExistingSlugs.has(baseSlug)) {
    return baseSlug
  }

  let suffix = 2

  while (normalizedExistingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1
  }

  return `${baseSlug}-${suffix}`
}

export function ensureUniqueTutorialSlugs(tutorials: AdminTutorial[]) {
  const usedSlugs = new Set<string>()

  return tutorials.map((tutorial, index) => {
    const baseSlug = slugifyTutorialValue(tutorial.slug ?? tutorial.title) || `tutorial-${index + 1}`
    let nextSlug = baseSlug
    let suffix = 2

    while (usedSlugs.has(nextSlug)) {
      nextSlug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    usedSlugs.add(nextSlug)

    return nextSlug === tutorial.slug ? tutorial : { ...tutorial, slug: nextSlug }
  })
}
