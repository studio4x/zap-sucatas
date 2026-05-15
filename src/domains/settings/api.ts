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
  blog_enabled: boolean
  created_at: string
  featured_payments_enabled: boolean
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
const VISUAL_MANIFEST_PATH = 'site/branding/manifest.json'

const visualAssetFolders: Record<VisualAssetKind, string> = {
  favicon: 'site/branding/favicon',
  logoDark: 'site/branding/logo-dark',
  logoLight: 'site/branding/logo-light',
}

type VisualManifest = {
  faviconPath: string | null
  logoDarkPath: string | null
  logoLightPath: string | null
  updatedAt: string
}

const visualManifestKeyByKind: Record<VisualAssetKind, keyof VisualManifest> = {
  favicon: 'faviconPath',
  logoDark: 'logoDarkPath',
  logoLight: 'logoLightPath',
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

function fileFromPath(path: string): VisualAssetItem {
  const client = ensureSupabase()
  const { data } = client.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path)
  const pathParts = path.split('/')

  return {
    contentType: null,
    name: pathParts[pathParts.length - 1] ?? path,
    path,
    publicUrl: data.publicUrl,
    sizeBytes: null,
    updatedAt: null,
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

function normalizeVisualManifest(value: unknown): VisualManifest | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<VisualManifest>
  return {
    faviconPath: typeof candidate.faviconPath === 'string' ? candidate.faviconPath : null,
    logoDarkPath: typeof candidate.logoDarkPath === 'string' ? candidate.logoDarkPath : null,
    logoLightPath: typeof candidate.logoLightPath === 'string' ? candidate.logoLightPath : null,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  }
}

async function fetchVisualManifest(): Promise<VisualManifest | null> {
  const client = ensureSupabase()
  const { data } = client.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(VISUAL_MANIFEST_PATH)

  try {
    const response = await fetch(data.publicUrl, { cache: 'no-store' })
    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as unknown
    return normalizeVisualManifest(json)
  } catch {
    return null
  }
}

function mapSystemSettings(row: SystemSettingsRow): SystemSettings {
  return {
    allowGuestQuestions: row.allow_guest_questions,
    blogEnabled: row.blog_enabled,
    createdAt: row.created_at,
    featuredPaymentsEnabled: row.featured_payments_enabled,
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
      'id, site_name, support_email, support_phone, seo_title_default, seo_description_default, allow_guest_questions, blog_enabled, featured_payments_enabled, maintenance_mode, created_at, updated_at',
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
    blog_enabled: input.blogEnabled,
    featured_payments_enabled: input.featuredPaymentsEnabled,
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

export async function updateFeaturedPaymentsEnabled(input: { enabled: boolean; id: string }) {
  const { error } = await ensureSupabase()
    .from('system_settings')
    .update({ featured_payments_enabled: input.enabled })
    .eq('id', input.id)

  if (error) {
    throw error
  }

  return fetchSystemSettings()
}

export async function fetchAdminVisualSettings(): Promise<AdminVisualSettings> {
  const manifest = await fetchVisualManifest()

  const manifestAssets: AdminVisualSettings = {
    favicon: manifest?.faviconPath ? fileFromPath(manifest.faviconPath) : null,
    logoDark: manifest?.logoDarkPath ? fileFromPath(manifest.logoDarkPath) : null,
    logoLight: manifest?.logoLightPath ? fileFromPath(manifest.logoLightPath) : null,
  }

  const [logoLightFallback, logoDarkFallback, faviconFallback] = await Promise.all([
    manifestAssets.logoLight ? Promise.resolve(null) : resolveLatestAsset('logoLight'),
    manifestAssets.logoDark ? Promise.resolve(null) : resolveLatestAsset('logoDark'),
    manifestAssets.favicon ? Promise.resolve(null) : resolveLatestAsset('favicon'),
  ])

  const resolvedSettings: AdminVisualSettings = {
    favicon: manifestAssets.favicon ?? faviconFallback,
    logoDark: manifestAssets.logoDark ?? logoDarkFallback,
    logoLight: manifestAssets.logoLight ?? logoLightFallback,
  }

  if (!manifest) {
    const nextManifest: VisualManifest = {
      faviconPath: resolvedSettings.favicon?.path ?? null,
      logoDarkPath: resolvedSettings.logoDark?.path ?? null,
      logoLightPath: resolvedSettings.logoLight?.path ?? null,
      updatedAt: new Date().toISOString(),
    }

    if (nextManifest.faviconPath || nextManifest.logoDarkPath || nextManifest.logoLightPath) {
      const manifestFile = new Blob([JSON.stringify(nextManifest)], { type: 'application/json' })
      await ensureSupabase()
        .storage
        .from(SITE_ASSETS_BUCKET)
        .upload(VISUAL_MANIFEST_PATH, manifestFile, {
          cacheControl: '300',
          contentType: 'application/json',
          upsert: true,
        })
        .catch(() => undefined)
    }
  }

  return resolvedSettings
}

export async function fetchVisualSettings() {
  return fetchAdminVisualSettings()
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

  const currentManifest = await fetchVisualManifest()
  const nextManifest: VisualManifest = {
    faviconPath: currentManifest?.faviconPath ?? null,
    logoDarkPath: currentManifest?.logoDarkPath ?? null,
    logoLightPath: currentManifest?.logoLightPath ?? null,
    updatedAt: new Date().toISOString(),
  }
  nextManifest[visualManifestKeyByKind[input.kind]] = storagePath

  const manifestFile = new Blob([JSON.stringify(nextManifest)], { type: 'application/json' })
  const { error: manifestUploadError } = await client.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(VISUAL_MANIFEST_PATH, manifestFile, {
      cacheControl: '300',
      contentType: 'application/json',
      upsert: true,
    })

  if (manifestUploadError) {
    throw manifestUploadError
  }
}
