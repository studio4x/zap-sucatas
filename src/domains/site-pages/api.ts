import { supabase } from '@/integrations/supabase/client'
import { fetchSystemSettings, updateBlogVisibilityEnabled } from '@/domains/settings/api'
import { PUBLIC_SITE_PAGE_DEFINITIONS } from '@/domains/site-pages/registry'
import type { AdminSitePageRecord, SitePageDefinition } from '@/domains/site-pages/types'

type SitePageRow = {
  description: string
  id: string
  is_online: boolean
  page_key: string
  path: string
  section: string
  sort_order: number
  updated_at: string
  title: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function mapSitePageRow(row: SitePageRow): AdminSitePageRecord {
  const definition = PUBLIC_SITE_PAGE_DEFINITIONS.find((item) => item.key === row.page_key)

  return {
    description: row.description || definition?.description || '',
    id: row.id,
    isOnline: row.is_online,
    key: row.page_key,
    path: row.path,
    section: row.section || definition?.section || 'Geral',
    sortOrder: row.sort_order,
    source: definition?.source ?? 'site_pages',
    title: row.title,
    updatedAt: row.updated_at,
  }
}

function mapDefinitionToAdminRecord(definition: SitePageDefinition, isOnline: boolean, updatedAt: string): AdminSitePageRecord {
  return {
    ...definition,
    id: `system_settings:${definition.key}`,
    isOnline,
    updatedAt,
  }
}

function sortSitePages(left: AdminSitePageRecord, right: AdminSitePageRecord) {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder
  }

  return left.title.localeCompare(right.title, 'pt-BR')
}

export async function fetchPublicSitePages() {
  const { data, error } = await ensureSupabase()
    .from('site_pages')
    .select('path')
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => row.path)
}

export async function fetchAdminSitePages(): Promise<AdminSitePageRecord[]> {
  const [sitePagesResponse, systemSettings] = await Promise.all([
    ensureSupabase()
      .from('site_pages')
      .select('id, page_key, title, path, section, description, is_online, sort_order, updated_at')
      .order('sort_order', { ascending: true }),
    fetchSystemSettings(),
  ])

  const { data, error } = sitePagesResponse
  if (error) {
    throw error
  }

  const staticPages = (data ?? []).map((row) => mapSitePageRow(row as SitePageRow))
  const blogDefinition = PUBLIC_SITE_PAGE_DEFINITIONS.find((item) => item.key === 'blog')
  const blogPage = blogDefinition
    ? mapDefinitionToAdminRecord(blogDefinition, systemSettings.blogEnabled, systemSettings.updatedAt)
    : null

  return [...staticPages, ...(blogPage ? [blogPage] : [])].sort(sortSitePages)
}

export async function updateSitePageVisibility(input: { pageId: string; isOnline: boolean }) {
  const { error } = await ensureSupabase()
    .from('site_pages')
    .update({ is_online: input.isOnline })
    .eq('id', input.pageId)

  if (error) {
    throw error
  }

  return fetchAdminSitePages()
}

export async function updateBlogPageVisibility(input: { enabled: boolean; settingsId: string }) {
  return updateBlogVisibilityEnabled({
    enabled: input.enabled,
    id: input.settingsId,
  })
}
