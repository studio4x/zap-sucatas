import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import type { AnalyticsFilter, AnalyticsOverview, AnalyticsSeriesPoint, AnalyticsTopItem } from '@/domains/analytics/types'

type AnalyticsEventRow = Database['public']['Tables']['analytics_events']['Row']

type ListingStateRow = Pick<Database['public']['Tables']['listings']['Row'], 'created_at' | 'state'>

type ProfileCreatedRow = Pick<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'id'>

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function toIsoDate(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function getDeviceType(userAgent: string | null) {
  if (!userAgent) {
    return 'Desconhecido'
  }

  const normalized = userAgent.toLowerCase()
  if (normalized.includes('tablet') || normalized.includes('ipad')) {
    return 'Tablet'
  }

  if (normalized.includes('mobile') || normalized.includes('android') || normalized.includes('iphone')) {
    return 'Mobile'
  }

  return 'Desktop'
}

function topEntries(counter: Map<string, number>, limit = 6): AnalyticsTopItem[] {
  return Array.from(counter.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit)
}

async function fetchAnalyticsEvents(filter: AnalyticsFilter): Promise<AnalyticsEventRow[]> {
  const client = ensureSupabase()
  const pageSize = 1000
  let from = 0
  let keepFetching = true
  const rows: AnalyticsEventRow[] = []

  while (keepFetching) {
    const to = from + pageSize - 1
    const { data, error } = await client
      .from('analytics_events')
      .select('*')
      .gte('created_at', filter.startAt)
      .lte('created_at', filter.endAt)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as AnalyticsEventRow[]
    rows.push(...batch)

    if (batch.length < pageSize) {
      keepFetching = false
    } else {
      from += pageSize
    }
  }

  return rows
}

async function fetchListingsByState(filter: AnalyticsFilter): Promise<ListingStateRow[]> {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('listings')
    .select('state, created_at')
    .gte('created_at', filter.startAt)
    .lte('created_at', filter.endAt)

  if (error) {
    throw error
  }

  return (data ?? []) as ListingStateRow[]
}

async function fetchNewUsersCount(filter: AnalyticsFilter) {
  const client = ensureSupabase()
  const { count, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', filter.startAt)
    .lte('created_at', filter.endAt)

  if (error) {
    throw error
  }

  return count ?? 0
}

async function fetchProfileCreationRows(filter: AnalyticsFilter): Promise<ProfileCreatedRow[]> {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('id, created_at')
    .gte('created_at', filter.startAt)
    .lte('created_at', filter.endAt)

  if (error) {
    throw error
  }

  return (data ?? []) as ProfileCreatedRow[]
}

export async function fetchAdminAnalyticsOverview(filter: AnalyticsFilter): Promise<AnalyticsOverview> {
  const [events, listings, newUsers, createdProfiles] = await Promise.all([
    fetchAnalyticsEvents(filter),
    fetchListingsByState(filter),
    fetchNewUsersCount(filter),
    fetchProfileCreationRows(filter),
  ])

  const pageViews = events.filter((event) => event.event_type === 'page_view')
  const clicks = events.filter((event) => event.event_type === 'click')
  const pageLeaves = events.filter((event) => event.event_type === 'page_leave' && Number(event.duration_ms ?? 0) > 0)

  const accessCount = pageViews.length
  const clickCount = clicks.length
  const ctr = accessCount > 0 ? Number(((clickCount / accessCount) * 100).toFixed(2)) : 0

  const avgNavigationSeconds = pageLeaves.length > 0
    ? Number((pageLeaves.reduce((sum, row) => sum + Number(row.duration_ms ?? 0), 0) / pageLeaves.length / 1000).toFixed(1))
    : 0

  const uniqueSessions = new Set(pageViews.map((row) => row.session_id)).size
  const loggedUserEvents = pageViews.filter((row) => Boolean(row.profile_id)).length

  const recurringMap = new Map<string, number>()
  for (const row of pageViews) {
    if (!row.profile_id) {
      continue
    }
    recurringMap.set(row.profile_id, (recurringMap.get(row.profile_id) ?? 0) + 1)
  }
  const recurringUsers = Array.from(recurringMap.values()).filter((value) => value >= 2).length

  const topPageCounter = new Map<string, number>()
  const topClickCounter = new Map<string, number>()
  const deviceCounter = new Map<string, number>()
  const localityCounter = new Map<string, number>()
  const viewsByDayCounter = new Map<string, number>()

  for (const row of pageViews) {
    topPageCounter.set(row.pathname, (topPageCounter.get(row.pathname) ?? 0) + 1)
    const deviceType = getDeviceType(row.user_agent)
    deviceCounter.set(deviceType, (deviceCounter.get(deviceType) ?? 0) + 1)
    const day = toIsoDate(row.created_at)
    viewsByDayCounter.set(day, (viewsByDayCounter.get(day) ?? 0) + 1)
  }

  for (const row of clicks) {
    const target = row.target?.trim() || 'Clique sem alvo definido'
    topClickCounter.set(target, (topClickCounter.get(target) ?? 0) + 1)
  }

  for (const row of listings) {
    const state = row.state?.trim() || 'Sem UF'
    localityCounter.set(state, (localityCounter.get(state) ?? 0) + 1)
  }

  for (const row of createdProfiles) {
    const day = toIsoDate(row.created_at)
    viewsByDayCounter.set(day, viewsByDayCounter.get(day) ?? 0)
  }

  const viewsByDay: AnalyticsSeriesPoint[] = Array.from(viewsByDayCounter.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((left, right) => left.date.localeCompare(right.date))

  return {
    accessCount,
    avgNavigationSeconds,
    clickCount,
    ctr,
    deviceMix: topEntries(deviceCounter, 4),
    localityMix: topEntries(localityCounter, 8),
    loggedUserEvents,
    newUsers,
    recurringUsers,
    topClickTargets: topEntries(topClickCounter, 8),
    topPages: topEntries(topPageCounter, 8),
    uniqueSessions,
    viewsByDay,
  }
}