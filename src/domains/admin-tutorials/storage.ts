import { ADMIN_TUTORIALS_DEFAULTS, ADMIN_TUTORIALS_STORAGE_KEY } from '@/domains/admin-tutorials/defaults'
import { sanitizeRichTextHtml } from '@/domains/admin-tutorials/sanitize'
import type { AdminTutorial, AdminTutorialDraft, AdminTutorialStep, AdminTutorialsPersistedState } from '@/domains/admin-tutorials/types'

function normalizeText<T extends string | null>(value: unknown, fallback: T): string | T
function normalizeText(value: unknown, fallback?: string): string
function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeMinutes(value: unknown, fallback = 3) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback
  }

  return Math.max(1, Math.round(numeric))
}

function normalizeStep(value: unknown, fallbackIndex: number): AdminTutorialStep {
  const stepCandidate = typeof value === 'object' && value !== null ? value as Partial<AdminTutorialStep> : null
  const title = normalizeText(stepCandidate?.title, `Passo ${fallbackIndex + 1}`)
  const description = sanitizeRichTextHtml(normalizeText(stepCandidate?.description))

  return {
    title: title || `Passo ${fallbackIndex + 1}`,
    description,
  }
}

function normalizeNotes(value: unknown) {
  if (!Array.isArray(value)) {
    return ['Revise este tutorial antes de publicar novas orientações.']
  }

  const notes = value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0)

  return notes.length > 0 ? notes : ['Revise este tutorial antes de publicar novas orientações.']
}

function createTutorialId(title: string) {
  const slugBase = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const uniqueSuffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}`

  return `${slugBase || 'tutorial'}-${uniqueSuffix}`
}

export function normalizeTutorialDraft(draft: AdminTutorialDraft): AdminTutorial {
  const normalizedTitle = normalizeText(draft.title, 'Tutorial sem título')
  const normalizedSummary = normalizeText(draft.summary, 'Resumo indisponível.')
  const normalizedCategory = normalizeText(draft.category, 'Geral')
  const stepsSource = Array.isArray(draft.steps) ? draft.steps : []
  const steps = stepsSource.length > 0
    ? stepsSource.map((step, index) => normalizeStep(step, index))
    : [normalizeStep({}, 0)]

  return {
    id: normalizeText(draft.id) || createTutorialId(normalizedTitle),
    title: normalizedTitle,
    summary: normalizedSummary,
    estimatedMinutes: normalizeMinutes(draft.estimatedMinutes, 3),
    category: normalizedCategory || 'Geral',
    steps,
    notes: normalizeNotes(draft.notes),
  }
}

function normalizeStoredTutorial(value: unknown, fallback: AdminTutorial | null = null) {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  const draft = value as Partial<AdminTutorialDraft>
  return normalizeTutorialDraft({
    id: normalizeText(draft.id, fallback?.id),
    title: normalizeText(draft.title, fallback?.title ?? ''),
    summary: normalizeText(draft.summary, fallback?.summary ?? ''),
    estimatedMinutes: draft.estimatedMinutes ?? fallback?.estimatedMinutes ?? 3,
    category: normalizeText(draft.category, fallback?.category ?? 'Geral'),
    steps: Array.isArray(draft.steps) ? draft.steps : fallback?.steps ?? [],
    notes: Array.isArray(draft.notes) ? draft.notes : fallback?.notes ?? [],
  })
}

function mergeTutorialsWithDefaults(value: unknown) {
  const storedTutorials = Array.isArray(value)
    ? value
        .map((tutorial) => normalizeStoredTutorial(tutorial))
        .filter((tutorial): tutorial is AdminTutorial => Boolean(tutorial))
    : []
  const tutorialById = new Map(storedTutorials.map((tutorial) => [tutorial.id, tutorial]))

  for (const defaultTutorial of ADMIN_TUTORIALS_DEFAULTS) {
    if (!tutorialById.has(defaultTutorial.id)) {
      tutorialById.set(defaultTutorial.id, normalizeTutorialDraft(defaultTutorial))
    }
  }

  return [...tutorialById.values()]
}

function resolveActiveTutorialId(tutorials: AdminTutorial[], requestedId: string | null) {
  if (requestedId && tutorials.some((tutorial) => tutorial.id === requestedId)) {
    return requestedId
  }

  if (tutorials[0]) {
    return tutorials[0].id
  }

  return ADMIN_TUTORIALS_DEFAULTS[0]?.id ?? null
}

function createDefaultState(): AdminTutorialsPersistedState {
  const tutorials = ADMIN_TUTORIALS_DEFAULTS.map((tutorial) => normalizeTutorialDraft(tutorial))

  return {
    tutorials,
    activeTutorialId: resolveActiveTutorialId(tutorials, null),
    isDrawerOpen: false,
    isDrawerMinimized: false,
  }
}

export function loadAdminTutorialsState(): AdminTutorialsPersistedState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_TUTORIALS_STORAGE_KEY)
    if (!raw) {
      return createDefaultState()
    }

    const parsed = JSON.parse(raw) as Partial<AdminTutorialsPersistedState>
    const tutorials = mergeTutorialsWithDefaults(parsed.tutorials)

    if (tutorials.length === 0) {
      return createDefaultState()
    }

    return {
      tutorials,
      activeTutorialId: resolveActiveTutorialId(tutorials, normalizeText(parsed.activeTutorialId, null)),
      isDrawerOpen: Boolean(parsed.isDrawerOpen),
      isDrawerMinimized: Boolean(parsed.isDrawerMinimized),
    }
  } catch {
    return createDefaultState()
  }
}

export function saveAdminTutorialsState(state: AdminTutorialsPersistedState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ADMIN_TUTORIALS_STORAGE_KEY, JSON.stringify(state))
}

export function resolveTutorialFallback(tutorials: AdminTutorial[], previousId: string | null) {
  return resolveActiveTutorialId(tutorials, previousId)
}

export function resetTutorialsToDefaults() {
  return createDefaultState()
}
