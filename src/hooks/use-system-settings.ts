import { useContext } from 'react'
import { SystemSettingsContext } from '@/app/providers/system-settings-provider'

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)

  if (!context) {
    throw new Error('useSystemSettings must be used within SystemSettingsProvider')
  }

  return context
}
