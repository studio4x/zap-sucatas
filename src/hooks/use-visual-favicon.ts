import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVisualSettings } from '@/domains/settings/api'

function applyFavicon(href: string) {
  const existingLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null

  if (existingLink) {
    existingLink.href = href
    return
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = href
  document.head.appendChild(link)
}

export function useVisualFavicon(queryKeyScope: string) {
  const visualSettingsQuery = useQuery({
    queryKey: ['visual-settings', queryKeyScope],
    queryFn: fetchVisualSettings,
    staleTime: 60_000,
  })

  const faviconHref = visualSettingsQuery.data?.favicon?.publicUrl ?? '/favicon.ico'

  useEffect(() => {
    applyFavicon(faviconHref)
  }, [faviconHref])

  return visualSettingsQuery
}
