import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSystemSettings } from '@/hooks/use-system-settings'
import { fetchPublicSitePages } from '@/domains/site-pages/api'
import { PUBLIC_SITE_PAGE_DEFINITIONS } from '@/domains/site-pages/registry'

export function usePublicSitePages() {
  const { blogEnabled, isLoading: systemSettingsLoading, settings } = useSystemSettings()
  const publicPagesQuery = useQuery({
    queryKey: ['site-pages', 'public'],
    queryFn: fetchPublicSitePages,
  })

  const onlinePathSet = useMemo(
    () => new Set(publicPagesQuery.data ?? []),
    [publicPagesQuery.data],
  )

  const isPageOnline = useMemo(
    () =>
      (path: string) => {
        const definition = PUBLIC_SITE_PAGE_DEFINITIONS.find((item) => item.path === path)

        if (!definition) {
          return true
        }

        if (definition.source === 'system_settings') {
          return blogEnabled
        }

        if (publicPagesQuery.isLoading || systemSettingsLoading || publicPagesQuery.isError) {
          return true
        }

        return onlinePathSet.has(path)
      },
    [blogEnabled, onlinePathSet, publicPagesQuery.isError, publicPagesQuery.isLoading, systemSettingsLoading],
  )

  return {
    isLoading: publicPagesQuery.isLoading || systemSettingsLoading,
    isPageOnline,
    settings,
    publicPagesQuery,
  }
}
