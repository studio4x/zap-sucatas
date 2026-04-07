import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { env } from '@/lib/env'

export const supabase =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null
