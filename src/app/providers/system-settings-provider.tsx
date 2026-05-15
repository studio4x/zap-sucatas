import { createContext, useMemo, type PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSystemSettings } from '@/domains/settings/api'
import type { SystemSettings } from '@/domains/settings/types'

export type SystemSettingsContextValue = {
  blogEnabled: boolean
  isError: boolean
  isLoading: boolean
  maintenanceMode: boolean
  refresh: () => Promise<unknown>
  settings: SystemSettings | null
}

export const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null)

export function SystemSettingsProvider({ children }: PropsWithChildren) {
  const settingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
  })

  const value = useMemo<SystemSettingsContextValue>(
    () => ({
      blogEnabled: settingsQuery.data?.blogEnabled ?? true,
      isError: settingsQuery.isError,
      isLoading: settingsQuery.isLoading,
      maintenanceMode: settingsQuery.data?.maintenanceMode ?? false,
      refresh: settingsQuery.refetch,
      settings: settingsQuery.data ?? null,
    }),
    [
      settingsQuery.data,
      settingsQuery.isError,
      settingsQuery.isLoading,
      settingsQuery.refetch,
    ],
  )

  return (
    <SystemSettingsContext.Provider value={value}>{children}</SystemSettingsContext.Provider>
  )
}
