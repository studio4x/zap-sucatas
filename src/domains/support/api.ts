import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { env } from '@/lib/env'
import { defaultSupportBusinessHours, defaultSupportCategories, defaultSupportConfig } from '@/lib/support-sla'
import type {
  SupportBusinessHoursConfig,
  SupportConfig,
  SupportMessage,
  SupportSlaCategoryConfig,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketWithUser,
} from '@/domains/support/types'

type SupportTicketRow = Database['public']['Tables']['support_tickets']['Row']
type SupportMessageRow = Database['public']['Tables']['support_messages']['Row']
type ProfileLookupRow = Pick<Database['public']['Tables']['profiles']['Row'], 'email' | 'full_name' | 'id' | 'role'>

type SupportSettingsRow = {
  crisis_protocol_config: { headline?: string; note?: string } | null
  support_business_hours_config: {
    days_of_week?: number[]
    end_hour?: number
    start_hour?: number
    timezone?: string
  } | null
  support_sla_config: {
    categories?: Array<{
      description?: string
      first_response_hours?: number
      key?: SupportTicketCategory
      label?: string
      position?: number
    }>
    public_note?: string
  } | null
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function mapSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    attachmentName: row.attachment_name,
    attachmentUrl: row.attachment_url,
    category: row.category as SupportTicketCategory,
    createdAt: row.created_at,
    description: row.description,
    firstResponseAt: row.first_response_at,
    firstResponseDueAt: row.first_response_due_at,
    id: row.id,
    priority: row.priority as SupportTicketPriority,
    responderName: row.responder_name,
    slaPolicyKey: row.sla_policy_key,
    slaStatus: row.sla_status as SupportTicket['slaStatus'],
    status: row.status as SupportTicketStatus,
    subject: row.subject,
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

function mapSupportMessage(
  row: SupportMessageRow,
  profileMap: Map<string, ProfileLookupRow>,
  ticketResponderName: string | null,
): SupportMessage {
  const sender = profileMap.get(row.sender_id)
  const senderRole = sender?.role === 'admin' ? 'admin' : 'user'

  return {
    attachmentName: row.attachment_name,
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
    id: row.id,
    message: row.message,
    senderEmail: sender?.email ?? null,
    senderId: row.sender_id,
    senderName:
      senderRole === 'admin'
        ? row.sender_display_name ?? ticketResponderName ?? sender?.full_name ?? 'Equipe de suporte'
        : sender?.full_name ?? null,
    senderRole,
    ticketId: row.ticket_id,
  }
}

function normalizeCategories(config: SupportSettingsRow['support_sla_config']): SupportSlaCategoryConfig[] {
  const categories = config?.categories
  if (!categories?.length) {
    return defaultSupportCategories
  }

  return categories
    .map((entry) => ({
      key: entry.key ?? 'general',
      label: entry.label ?? 'Duvida geral',
      firstResponseHours: entry.first_response_hours ?? 24,
      position: entry.position ?? 999,
      description: entry.description ?? 'Primeira resposta em ate 24 horas uteis.',
    }))
    .sort((left, right) => left.position - right.position)
}

function normalizeBusinessHours(config: SupportSettingsRow['support_business_hours_config']): SupportBusinessHoursConfig {
  return {
    timezone: config?.timezone ?? defaultSupportBusinessHours.timezone,
    daysOfWeek: config?.days_of_week ?? defaultSupportBusinessHours.daysOfWeek,
    startHour: config?.start_hour ?? defaultSupportBusinessHours.startHour,
    endHour: config?.end_hour ?? defaultSupportBusinessHours.endHour,
  }
}

async function getFreshAccessToken() {
  const client = ensureSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session?.refresh_token) {
    if (!session?.access_token) {
      throw new Error('Sessão inválida. Faça login novamente.')
    }

    return session.access_token
  }

  const { data, error } = await client.auth.refreshSession({
    refresh_token: session.refresh_token,
  })

  if (error) {
    throw error
  }

  return data.session?.access_token ?? session.access_token ?? ''
}

async function notifySupportEvent(input: {
  messageId?: string | null
  ticketId: string
  type: 'new_message' | 'new_ticket' | 'ticket_closed'
}) {
  if (!env.supabaseUrl || !env.supabaseAnonKey || !supabase) {
    return
  }

  const accessToken = await getFreshAccessToken()
  if (!accessToken) {
    return
  }

  await fetch(`${env.supabaseUrl}/functions/v1/notify-support`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({
      access_token: accessToken,
      messageId: input.messageId ?? null,
      ticketId: input.ticketId,
      type: input.type,
    }),
  })
}

export async function fetchSupportConfig(): Promise<SupportConfig> {
  const { data, error } = await ensureSupabase()
    .from('system_settings')
    .select('support_sla_config, support_business_hours_config, crisis_protocol_config')
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  const row = (data ?? null) as SupportSettingsRow | null
  if (!row) {
    return defaultSupportConfig
  }

  return {
    categories: normalizeCategories(row.support_sla_config),
    businessHours: normalizeBusinessHours(row.support_business_hours_config),
    publicNote: row.support_sla_config?.public_note ?? defaultSupportConfig.publicNote,
    crisisNote:
      row.crisis_protocol_config?.headline ?? row.crisis_protocol_config?.note ?? defaultSupportConfig.crisisNote,
  }
}

export async function fetchMySupportTickets(profileId: string) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('support_tickets')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as SupportTicketRow[]).map(mapSupportTicket)
}

export async function fetchAdminSupportTickets() {
  const client = ensureSupabase()
  const { data: tickets, error: ticketsError } = await client
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (ticketsError) {
    throw ticketsError
  }

  const rows = (tickets ?? []) as SupportTicketRow[]
  const userIds = Array.from(new Set(rows.map((ticket) => ticket.user_id)))
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, full_name, email, role')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map(((profiles ?? []) as ProfileLookupRow[]).map((row) => [row.id, row]))

  return rows.map((row) => {
    const ticket = mapSupportTicket(row)
    const profile = profileMap.get(ticket.userId)

    return {
      ...ticket,
      userEmail: profile?.email ?? null,
      userFullName: profile?.full_name ?? null,
    } satisfies SupportTicketWithUser
  })
}

export async function fetchSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail> {
  const client = ensureSupabase()
  const { data: ticketData, error: ticketError } = await client
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticketData) {
    throw ticketError ?? new Error('Chamado não encontrado.')
  }

  const ticket = mapSupportTicket(ticketData as SupportTicketRow)
  const { data: messages, error: messagesError } = await client
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    throw messagesError
  }

  const senderIds = ((messages ?? []) as SupportMessageRow[]).map((row) => row.sender_id)
  const profileIds = Array.from(new Set([ticket.userId, ...senderIds]))
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, full_name, email, role')
    .in('id', profileIds)

  if (profilesError) {
    throw profilesError
  }

  const profileMap = new Map(((profiles ?? []) as ProfileLookupRow[]).map((row) => [row.id, row]))
  const owner = profileMap.get(ticket.userId)

  return {
    ticket: {
      ...ticket,
      userEmail: owner?.email ?? null,
      userFullName: owner?.full_name ?? null,
    },
    messages: ((messages ?? []) as SupportMessageRow[]).map((row) => mapSupportMessage(row, profileMap, ticket.responderName)),
  }
}

export async function uploadSupportAttachment(input: { authUserId: string; file: File }) {
  const client = ensureSupabase()
  const sanitizedName = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase()
  const extension = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : 'bin'
  const path = `support/${input.authUserId}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage.from('uploads').upload(path, input.file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  const { data } = client.storage.from('uploads').getPublicUrl(path)

  return {
    attachmentName: input.file.name,
    attachmentUrl: data.publicUrl,
  }
}

export async function createSupportTicket(input: {
  attachmentName?: string | null
  attachmentUrl?: string | null
  category: SupportTicketCategory
  description: string
  priority: SupportTicketPriority
  subject: string
  userId: string
}) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('support_tickets')
    .insert({
      attachment_name: input.attachmentName ?? null,
      attachment_url: input.attachmentUrl ?? null,
      category: input.category,
      description: input.description.trim(),
      priority: input.priority,
      subject: input.subject.trim(),
      user_id: input.userId,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Não foi possível abrir o chamado.')
  }

  const ticket = mapSupportTicket(data as SupportTicketRow)
  await notifySupportEvent({ ticketId: ticket.id, type: 'new_ticket' })
  return ticket
}

export async function sendSupportMessage(input: {
  attachmentName?: string | null
  attachmentUrl?: string | null
  message: string
  senderId: string
  senderDisplayName?: string | null
  ticketId: string
}) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('support_messages')
    .insert({
      attachment_name: input.attachmentName ?? null,
      attachment_url: input.attachmentUrl ?? null,
      message: input.message.trim(),
      sender_id: input.senderId,
      sender_display_name: input.senderDisplayName ?? null,
      ticket_id: input.ticketId,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Não foi possível enviar a mensagem.')
  }

  const message = data as SupportMessageRow
  await notifySupportEvent({ messageId: message.id, ticketId: message.ticket_id, type: 'new_message' })
  return message.id
}

export async function updateSupportTicketStatus(input: { status: SupportTicketStatus; ticketId: string }) {
  const client = ensureSupabase()
  const { data, error } = await client
    .from('support_tickets')
    .update({ status: input.status })
    .eq('id', input.ticketId)
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Não foi possível atualizar o status do chamado.')
  }

  if (input.status === 'closed') {
    await notifySupportEvent({ ticketId: input.ticketId, type: 'ticket_closed' })
  }

  return mapSupportTicket(data as SupportTicketRow)
}

export async function deleteSupportTicket(ticketId: string) {
  const client = ensureSupabase()
  const { error } = await client.from('support_tickets').delete().eq('id', ticketId)

  if (error) {
    throw error
  }
}
