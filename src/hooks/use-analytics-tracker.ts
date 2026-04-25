import { useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/integrations/supabase/client'

type TrackerScope = 'admin' | 'dashboard' | 'public'

type AnalyticsEventType = 'click' | 'page_leave' | 'page_view'

function ensureSessionId() {
  const key = 'zap_analytics_session_id'
  const existing = window.localStorage.getItem(key)

  if (existing) {
    return existing
  }

  const next = crypto.randomUUID()
  window.localStorage.setItem(key, next)
  return next
}

function buildPathWithSearch(pathname: string, search: string) {
  return `${pathname}${search}`
}

export function useAnalyticsTracker(scope: TrackerScope) {
  const location = useLocation()
  const { user } = useAuth()
  const sessionId = useMemo(() => (typeof window !== 'undefined' ? ensureSessionId() : ''), [])
  const lastPathRef = useRef<string | null>(null)
  const lastViewStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!supabase || !sessionId) {
      return
    }
    const client = supabase

    const currentPath = buildPathWithSearch(location.pathname, location.search)
    const now = Date.now()

    const insertEvent = (input: {
      durationMs?: number
      eventType: AnalyticsEventType
      target?: string
      pathname: string
    }) => {
      void client.from('analytics_events').insert({
        duration_ms: input.durationMs ?? null,
        event_type: input.eventType,
        language: navigator.language,
        pathname: input.pathname,
        profile_id: user?.profileId ?? null,
        referrer: document.referrer || null,
        session_id: sessionId,
        target: input.target ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_agent: navigator.userAgent,
      })
    }

    const previousPath = lastPathRef.current
    const previousStart = lastViewStartRef.current

    if (previousPath && previousStart && previousPath !== currentPath) {
      insertEvent({
        durationMs: now - previousStart,
        eventType: 'page_leave',
        pathname: previousPath,
      })
    }

    insertEvent({
      eventType: 'page_view',
      pathname: currentPath,
    })

    lastPathRef.current = currentPath
    lastViewStartRef.current = now

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }

      const clickable = target.closest('a, button, [data-analytics-click]') as HTMLElement | null
      if (!clickable) {
        return
      }

      const explicitTarget = clickable.getAttribute('data-analytics-click')
      const rawText = explicitTarget || clickable.textContent || clickable.getAttribute('aria-label') || clickable.tagName
      const label = rawText.trim().slice(0, 120)

      if (!label) {
        return
      }

      insertEvent({
        eventType: 'click',
        pathname: currentPath,
        target: `${scope}:${label}`,
      })
    }

    document.addEventListener('click', clickHandler)

    const beforeUnloadHandler = () => {
      const startedAt = lastViewStartRef.current
      const pathAtUnload = lastPathRef.current

      if (!startedAt || !pathAtUnload || !supabase) {
        return
      }

      void client.from('analytics_events').insert({
        duration_ms: Date.now() - startedAt,
        event_type: 'page_leave',
        language: navigator.language,
        pathname: pathAtUnload,
        profile_id: user?.profileId ?? null,
        referrer: document.referrer || null,
        session_id: sessionId,
        target: `${scope}:beforeunload`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_agent: navigator.userAgent,
      })
    }

    window.addEventListener('beforeunload', beforeUnloadHandler)

    return () => {
      document.removeEventListener('click', clickHandler)
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  }, [location.pathname, location.search, scope, sessionId, user?.profileId])
}
