import { supabase } from '@/integrations/supabase/client'
import type { SystemSettings, UpdateSystemSettingsInput } from '@/domains/settings/types'

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
