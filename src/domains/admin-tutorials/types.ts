export type AdminTutorialStep = {
  description: string
  title: string
}

export type AdminTutorial = {
  category: string
  estimatedMinutes: number
  id: string
  notes: string[]
  slug?: string
  steps: AdminTutorialStep[]
  summary: string
  title: string
}

export type AdminTutorialDraft = Omit<AdminTutorial, 'id'> & {
  id?: string
}

export type AdminTutorialsPersistedState = {
  activeTutorialId: string | null
  isDrawerMinimized: boolean
  isDrawerOpen: boolean
  tutorials: AdminTutorial[]
}
