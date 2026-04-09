import { supabase } from '@/integrations/supabase/client'
import { env } from '@/lib/env'
import type { ContactMessageValues } from '@/domains/contact/schemas'

export async function submitContactMessage(values: ContactMessageValues) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase nao configurado no ambiente atual.')
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

    throw new Error('Nao foi possivel enviar a mensagem agora.')
  }

  return (await response.json()) as { success: boolean }
}
