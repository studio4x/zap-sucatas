import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { AdminTutorialsFloatingPanel } from '@/components/admin/admin-tutorials-floating-panel'
import { AdminTutorialsContext, type AdminTutorialsContextValue } from '@/domains/admin-tutorials/context'
import {
  loadAdminTutorialsState,
  normalizeTutorialDraft,
  resetTutorialsToDefaults,
  resolveTutorialFallback,
  saveAdminTutorialsState,
} from '@/domains/admin-tutorials/storage'
import { createUniqueTutorialSlug } from '@/domains/admin-tutorials/utils'
import type { AdminTutorial } from '@/domains/admin-tutorials/types'

export function AdminTutorialsProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(() => loadAdminTutorialsState())

  useEffect(() => {
    saveAdminTutorialsState(state)
  }, [state])

  const activeTutorial = useMemo(() => {
    return state.tutorials.find((tutorial) => tutorial.id === state.activeTutorialId) ?? state.tutorials[0] ?? null
  }, [state.activeTutorialId, state.tutorials])

  const value = useMemo<AdminTutorialsContextValue>(() => ({
    tutorials: state.tutorials,
    activeTutorialId: activeTutorial?.id ?? null,
    activeTutorial,
    isDrawerOpen: state.isDrawerOpen,
    isDrawerMinimized: state.isDrawerMinimized,
    openTutorial(tutorialId) {
      setState((current) => {
        const nextActiveTutorialId = resolveTutorialFallback(current.tutorials, tutorialId ?? current.activeTutorialId)
        return {
          ...current,
          activeTutorialId: nextActiveTutorialId,
          isDrawerOpen: true,
          isDrawerMinimized: false,
        }
      })
    },
    closeDrawer() {
      setState((current) => ({
        ...current,
        isDrawerOpen: false,
        isDrawerMinimized: false,
      }))
    },
    minimizeDrawer() {
      setState((current) => ({
        ...current,
        isDrawerOpen: false,
        isDrawerMinimized: true,
      }))
    },
    restoreDrawer() {
      setState((current) => ({
        ...current,
        isDrawerOpen: true,
        isDrawerMinimized: false,
      }))
    },
    selectTutorial(tutorialId) {
      setState((current) => ({
        ...current,
        activeTutorialId: resolveTutorialFallback(current.tutorials, tutorialId),
        isDrawerOpen: true,
        isDrawerMinimized: false,
      }))
    },
    syncTutorialSelection(tutorialId) {
      setState((current) => ({
        ...current,
        activeTutorialId: resolveTutorialFallback(current.tutorials, tutorialId),
      }))
    },
    saveTutorialDraft(draft) {
      const normalized = normalizeTutorialDraft(draft)
      let savedTutorial = normalized

      setState((current) => {
        const existingIndex = current.tutorials.findIndex((tutorial) => tutorial.id === normalized.id)
        const tutorials = [...current.tutorials]
        const existingSlugs = current.tutorials.map((tutorial) => tutorial.slug ?? tutorial.title)

        if (existingIndex >= 0) {
          savedTutorial = {
            ...normalized,
            slug: current.tutorials[existingIndex]?.slug ?? normalized.slug,
          }
          tutorials.splice(existingIndex, 1, savedTutorial)
        } else {
          savedTutorial = {
            ...normalized,
            slug: createUniqueTutorialSlug(normalized.title, existingSlugs),
          }
          tutorials.push(savedTutorial)
        }

        return {
          tutorials,
          activeTutorialId: normalized.id,
          isDrawerOpen: true,
          isDrawerMinimized: false,
        }
      })

      return savedTutorial
    },
    deleteTutorial(tutorialId) {
      setState((current) => {
        const tutorials = current.tutorials.filter((tutorial) => tutorial.id !== tutorialId)

        if (tutorials.length === 0) {
          const fallbackState = resetTutorialsToDefaults()
          return {
            ...fallbackState,
            isDrawerOpen: false,
            isDrawerMinimized: false,
          }
        }

        return {
          ...current,
          tutorials,
          activeTutorialId: resolveTutorialFallback(
            tutorials,
            current.activeTutorialId === tutorialId ? tutorials[0]?.id ?? null : current.activeTutorialId,
          ),
        }
      })
    },
    reorderTutorials(tutorialIds) {
      setState((current) => {
        const tutorialById = new Map(current.tutorials.map((tutorial) => [tutorial.id, tutorial]))
        const reordered = tutorialIds
          .map((tutorialId) => tutorialById.get(tutorialId))
          .filter((tutorial): tutorial is AdminTutorial => Boolean(tutorial))
        const leftovers = current.tutorials.filter((tutorial) => !tutorialIds.includes(tutorial.id))
        const tutorials = [...reordered, ...leftovers]

        return {
          ...current,
          tutorials,
          activeTutorialId: resolveTutorialFallback(tutorials, current.activeTutorialId),
        }
      })
    },
  }), [activeTutorial, state])

  return (
    <AdminTutorialsContext.Provider value={value}>
      {children}
      <AdminTutorialsFloatingPanel
        activeTutorial={value.activeTutorial}
        closeDrawer={value.closeDrawer}
        isDrawerMinimized={value.isDrawerMinimized}
        isDrawerOpen={value.isDrawerOpen}
        minimizeDrawer={value.minimizeDrawer}
        openTutorial={value.openTutorial}
        restoreDrawer={value.restoreDrawer}
        selectTutorial={value.selectTutorial}
        tutorials={value.tutorials}
      />
    </AdminTutorialsContext.Provider>
  )
}
