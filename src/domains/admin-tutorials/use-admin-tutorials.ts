import { useContext } from 'react'
import { AdminTutorialsContext } from '@/domains/admin-tutorials/context'

export function useAdminTutorials() {
  const context = useContext(AdminTutorialsContext)

  if (!context) {
    throw new Error('useAdminTutorials deve ser usado dentro de AdminTutorialsProvider.')
  }

  return context
}
