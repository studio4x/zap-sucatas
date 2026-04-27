import { supabase } from '@/integrations/supabase/client'
import type {
  AdminVisualSettings,
  SystemSettings,
  UpdateSystemSettingsInput,
  VisualAssetItem,
  VisualAssetKind,
} from '@/domains/settings/types'

type SystemSettingsRow = {
  allow_guest_questions: boolean
  created_at: string
  id: string
  maintenance_mode: boolean
  seo_description_default: string | null
  seo_title_default: string | null
  site_name: string
  support_email: string | null
  support_phone: string | null
  updated_at: string
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no ambiente atual.')
  }

  return supabase
}

const SITE_ASSETS_BUCKET = 'site-assets'

const visualAssetFolders: Record<VisualAssetKind, string> = {
  favicon: 'site/branding/favicon',
  logoDark: 'site/branding/logo-dark',
  logoLight: 'site/branding/logo-light',
}

function fileFromStorage(path: string, item: {
  id?: string | null
  metadata?: Record<string, unknown> | null
  name: string
  updated_at?: string | null
}): VisualAssetItem {
  const client = ensureSupabase()
  const { data } = client.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path)
  const metadata = item.metadata ?? {}

  return {
    contentType: typeof metadata.mimetype === 'string' ? metadata.mimetype : null,
    name: item.name,
    path,
    publicUrl: data.publicUrl,
    sizeBytes: typeof metadata.size === 'number' ? metadata.size : null,
    updatedAt: item.updated_at ?? null,
  }
}

function normalizeAssetName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
}

async function resolveLatestAsset(kind: VisualAssetKind) {
  const client = ensureSupabase()
  const folder = visualAssetFolders[kind]
  const { data, error } = await client.storage
    .from(SITE_ASSETS_BUCKET)
    .list(folder, {
      limit: 50,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    })

  if (error) {
    throw error
  }

  const files = (data ?? []).filter((item) => !item.id?.endsWith('/'))
  if (files.length === 0) {
    return null
  }

  const latest = files[0]
  return fileFromStorage(`${folder}/${latest.name}`, latest)
}

function mapSystemSettings(row: SystemSettingsRow): SystemSettings {
  return {
    allowGuestQuestions: row.allow_guest_questions,
    createdAt: row.created_at,
    id: row.id,
    maintenanceMode: row.maintenance_mode,
    seoDescriptionDefault: row.seo_description_default,
    seoTitleDefault: row.seo_title_default,
    siteName: row.site_name,
    supportEmail: row.support_email,
    supportPhone: row.support_phone,
    updatedAt: row.updated_at,
  }
}

export async function fetchSystemSettings() {
  const { data, error } = await ensureSupabase()
    .from('system_settings')
    .select(
      'id, site_name, support_email, support_phone, seo_title_default, seo_description_default, allow_guest_questions, maintenance_mode, created_at, updated_at',
    )
    .limit(1)
    .single()

  if (error || !data) {
    throw error ?? new Error('Configuracoes do sistema nao encontradas.')
  }

  return mapSystemSettings(data as SystemSettingsRow)
}

export async function updateSystemSettings(input: UpdateSystemSettingsInput) {
  const payload = {
    allow_guest_questions: input.allowGuestQuestions,
    maintenance_mode: input.maintenanceMode,
    seo_description_default: input.seoDescriptionDefault.trim() || null,
    seo_title_default: input.seoTitleDefault.trim() || null,
    site_name: input.siteName.trim(),
    support_email: input.supportEmail.trim() || null,
    support_phone: input.supportPhone.trim() || null,
  }

  const { error } = await ensureSupabase()
    .from('system_settings')
    .update(payload)
    .eq('id', input.id)

  if (error) {
    throw error
  }

  return fetchSystemSettings()
}

export async function fetchAdminVisualSettings(): Promise<AdminVisualSettings> {
  const [logoLight, logoDark, favicon] = await Promise.all([
    resolveLatestAsset('logoLight'),
    resolveLatestAsset('logoDark'),
    resolveLatestAsset('favicon'),
  ])

  return {
    favicon,
    logoDark,
    logoLight,
  }
}

export async function uploadAdminVisualAsset(input: {
  file: File
  kind: VisualAssetKind
}) {
  const client = ensureSupabase()
  const folder = visualAssetFolders[input.kind]
  const safeName = normalizeAssetName(input.file.name || `${input.kind}.bin`)
  const storagePath = `${folder}/${Date.now()}-${safeName}`

  const { error: uploadError } = await client.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: '3600',
      contentType: input.file.type || undefined,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: folderFiles, error: listError } = await client.storage
    .from(SITE_ASSETS_BUCKET)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'updated_at', order: 'desc' },
    })

  if (listError) {
    throw listError
  }

  const staleFiles = (folderFiles ?? [])
    .filter((item) => item.name !== storagePath.replace(`${folder}/`, ''))
    .map((item) => `${folder}/${item.name}`)

  if (staleFiles.length > 0) {
    const { error: removeError } = await client.storage
      .from(SITE_ASSETS_BUCKET)
      .remove(staleFiles)

    if (removeError) {
      throw removeError
    }
  }
}
