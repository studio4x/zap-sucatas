import { createClient } from '@supabase/supabase-js'

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const adminEmail = requireEnv('INITIAL_ADMIN_EMAIL')
const adminName = requireEnv('INITIAL_ADMIN_NAME')
const redirectUrl =
  process.env.INITIAL_ADMIN_REDIRECT_URL ||
  process.env.VITE_APP_URL ||
  'http://localhost:5173/login'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    throw error
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureAdminUser() {
  const existingUser = await findUserByEmail(adminEmail)

  if (existingUser) {
    await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: adminName,
      },
      email_confirm: true,
    })

    return existingUser.id
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(adminEmail, {
    data: {
      full_name: adminName,
    },
    redirectTo: redirectUrl,
  })

  if (error) {
    throw error
  }

  if (!data.user?.id) {
    throw new Error('Supabase did not return an admin user id.')
  }

  return data.user.id
}

async function ensureAdminProfile(authUserId) {
  const { error } = await supabase.from('profiles').upsert(
    {
      auth_user_id: authUserId,
      full_name: adminName,
      role: 'admin',
      is_admin: true,
      status: 'active',
    },
    { onConflict: 'auth_user_id' },
  )

  if (error) {
    throw error
  }
}

try {
  const authUserId = await ensureAdminUser()
  await ensureAdminProfile(authUserId)

  console.log(`Admin bootstrap concluido para ${adminEmail}.`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
