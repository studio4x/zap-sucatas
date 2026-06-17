import { createContext } from 'react'
import type { AdminTutorial, AdminTutorialDraft } from '@/domains/admin-tutorials/types'

export type AdminTutorialsContextValue = {
  activeTutorial: AdminTutorial | null
  activeTutorialId: string | null
  closeDrawer: () => void
  deleteTutorial: (tutorialId: string) => void
  isDrawerMinimized: boolean
  isDrawerOpen: boolean
  minimizeDrawer: () => void
  openTutorial: (tutorialId?: string) => void
  reorderTutorials: (tutorialIds: string[]) => void
  restoreDrawer: () => void
  saveTutorialDraft: (draft: AdminTutorialDraft) => AdminTutorial
  selectTutorial: (tutorialId: string) => void
  syncTutorialSelection: (tutorialId: string) => void
  tutorials: AdminTutorial[]
}

export const AdminTutorialsContext = createContext<AdminTutorialsContextValue | null>(null)
