import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let i = 0
  let inQuotes = false

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i += 2
          continue
        }

        inQuotes = false
        i += 1
        continue
      }

      value += ch
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (ch === ',') {
      row.push(value)
      value = ''
      i += 1
      continue
    }

    if (ch === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
      i += 1
      continue
    }

    if (ch === '\r') {
      i += 1
      continue
    }

    value += ch
    i += 1
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  if (rows.length === 0) return []

  const headers = rows[0].map((item) => item.trim())
  return rows.slice(1).map((record) => {
    const object = {}
    headers.forEach((header, idx) => {
      object[header] = record[idx] ?? ''
    })
    return object
  })
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function buildFullName(row) {
  const displayName = normalizeText(row['Display name'])
  if (displayName) return displayName

  const firstName = normalizeText(row['First name'])
  const lastName = normalizeText(row['Last name'])
  const combinedName = `${firstName} ${lastName}`.trim()
  if (combinedName) return combinedName

  const login = normalizeText(row.Login)
  if (login) return login

  const email = normalizeEmail(row.Email)
  return email.split('@')[0] || 'Usuário importado'
}

function mapRole(row) {
  const role = normalizeText(row.Role).toLowerCase()
  return role === 'administrator' ? 'admin' : 'user'
}

function createTemporaryPassword() {
  return `Wp${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}!a1`
}

async function listAllUsers(supabase) {
  const users = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    users.push(...(data.users ?? []))

    if (!data.users || data.users.length < perPage) {
      break
    }

    page += 1
  }

  return users
}

async function main() {
  const apply = process.argv.includes('--apply')
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env'))
  loadEnvFile(path.join(root, '.env.local'))

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.')
  }

  const csvPath = path.join(root, 'docs', 'usuarios_filtrados_zap_sucatas.csv')
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV nao encontrado em: ${csvPath}`)
  }

  const csvText = fs.readFileSync(csvPath, 'utf8')
  const records = parseCsv(csvText)
  const validRecords = records.filter((row) => {
    const email = normalizeEmail(row.Email)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  })

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const existingUsers = await listAllUsers(supabase)
  const existingUsersByEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  )

  const summary = {
    apply,
    totalRecords: records.length,
    validRecords: validRecords.length,
    created: 0,
    updated: 0,
    existingMatches: 0,
    skippedInvalid: records.length - validRecords.length,
  }

  const importResults = []

  for (const row of validRecords) {
    const email = normalizeEmail(row.Email)
    const fullName = buildFullName(row)
    const role = mapRole(row)
    const login = normalizeText(row.Login)
    const wpRecordId = normalizeText(row.record_id)
    const wpStatus = normalizeText(row.Status).toLowerCase() || 'active'

    const existingUser = existingUsersByEmail.get(email) ?? null
    let authUserId = existingUser?.id ?? null
    let operation = 'skipped'

    if (apply) {
      if (existingUser) {
        const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata ?? {}),
            full_name: fullName,
            source: 'wordpress_csv',
            wp_login: login,
            wp_record_id: wpRecordId,
            wp_role: normalizeText(row.Role),
          },
        })

        if (error) {
          throw error
        }

        authUserId = data.user?.id ?? existingUser.id
        operation = 'updated'
        summary.updated += 1
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          password: createTemporaryPassword(),
          user_metadata: {
            full_name: fullName,
            source: 'wordpress_csv',
            wp_login: login,
            wp_record_id: wpRecordId,
            wp_role: normalizeText(row.Role),
          },
        })

        if (error || !data.user?.id) {
          throw error ?? new Error(`Nao foi possivel criar o usuario ${email}.`)
        }

        authUserId = data.user.id
        operation = 'created'
        summary.created += 1
      }

      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          auth_user_id: authUserId,
          email,
          full_name: fullName,
          role,
          status: 'active',
        },
        { onConflict: 'auth_user_id' },
      )

      if (profileError) {
        throw profileError
      }
    } else {
      operation = existingUser ? 'update' : 'create'
      if (existingUser) {
        summary.existingMatches += 1
      }
    }

    importResults.push({
      email,
      fullName,
      operation,
      role,
      status: wpStatus,
    })
  }

  if (apply) {
    const { error: auditError } = await supabase.from('admin_audit_logs').insert({
      actor_user_id: null,
      action: 'import_wordpress_users',
      after_data: {
        created: summary.created,
        existing_matches: summary.existingMatches,
        skipped_invalid: summary.skippedInvalid,
        total_records: summary.totalRecords,
        updated: summary.updated,
      },
      entity_type: 'profile_batch',
    })

    if (auditError) {
      throw auditError
    }
  }

  console.log(
    JSON.stringify(
      {
        summary,
        samples: importResults.slice(0, 10),
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
