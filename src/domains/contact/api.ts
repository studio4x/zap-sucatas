import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'
import type { ContactMessageValues } from '@/domains/contact/schemas'
import type {
  AdminContactMessageStats,
  ContactMessage,
  ContactMessageStatus,
} from '@/domains/contact/types'

type ContactMessageRow = {
  created_at: string
  email: string
  full_name: string
  id: string
  message: string
  phone: string | null
  profile_id: string | null
  request_ip: string | null
  source: string
  status: ContactMessageStatus
  subject: string
  updated_at: string
  user_agent: string | null
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  return supabase
}

function mapContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    createdAt: row.created_at,
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    message: row.message,
    phone: row.phone,
    profileId: row.profile_id,
    requestIp: row.request_ip,
    source: row.source,
    status: row.status,
    subject: row.subject,
    updatedAt: row.updated_at,
    userAgent: row.user_agent,
  }
}

export async function submitContactMessage(values: ContactMessageValues) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase não configurado no ambiente atual.')
  }

  const session = supabase ? (await supabase.auth.getSession()).data.session : null
  const response = await fetch(`${env.supabaseUrl}/functions/v1/submit-contact-message`, {
    method: 'POST',
    headers: {
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      'Content-Type': 'application/json',
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    try {
      const payload = (await response.json()) as { error?: string }

      if (payload.error) {
        throw new Error(payload.error)
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message) {
        throw parseError
      }
    }

    throw new Error('Não foi possível enviar a mensagem agora.')
  }

  return (await response.json()) as { success: boolean }
}

export async function fetchAdminContactMessageStats(): Promise<AdminContactMessageStats> {
  const client = ensureSupabase()
  const [
    { count: totalCount, error: totalError },
    { count: newCount, error: newError },
    { count: readCount, error: readError },
    { count: resolvedCount, error: resolvedError },
  ] = await Promise.all([
    client.from('contact_messages').select('id', { count: 'exact', head: true }),
    client.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    client.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'read'),
    client.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
  ])

  if (totalError || newError || readError || resolvedError) {
    throw totalError ?? newError ?? readError ?? resolvedError ?? new Error('Falha ao carregar os indicadores de contato.')
  }

  return {
    newMessages: newCount ?? 0,
    readMessages: readCount ?? 0,
    resolvedMessages: resolvedCount ?? 0,
    total: totalCount ?? 0,
  }
}

export async function fetchAdminContactMessagesPage(input: {
  page: number
  pageSize: number
  query?: string
  status?: 'all' | ContactMessageStatus
}): Promise<PaginatedResult<ContactMessage>> {
  const { from, to } = getPaginationRange({
    page: input.page,
    pageSize: input.pageSize,
  })

  let query = ensureSupabase()
    .from('contact_messages')
    .select(
      'id, full_name, email, phone, subject, message, status, source, request_ip, user_agent, profile_id, created_at, updated_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (input.status && input.status !== 'all') {
    query = query.eq('status', input.status)
  }

  if (input.query?.trim()) {
    const search = `%${input.query.trim()}%`
    query = query.or(
      `full_name.ilike.${search},email.ilike.${search},subject.ilike.${search},message.ilike.${search},phone.ilike.${search}`,
    )
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    items: (data ?? []).map((row) => mapContactMessage(row as ContactMessageRow)),
    totalCount: count ?? 0,
  }
}

export async function updateAdminContactMessageStatus(input: {
  messageId: string
  status: ContactMessageStatus
}) {
  const { data, error } = await ensureSupabase()
    .from('contact_messages')
    .update({ status: input.status })
    .eq('id', input.messageId)
    .select(
      'id, full_name, email, phone, subject, message, status, source, request_ip, user_agent, profile_id, created_at, updated_at',
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Não foi possível atualizar o status da mensagem.')
  }

  return mapContactMessage(data as ContactMessageRow)
}