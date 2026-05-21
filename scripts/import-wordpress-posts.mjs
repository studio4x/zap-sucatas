import fs from 'node:fs'
import path from 'node:path'
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
    const obj = {}
    headers.forEach((header, idx) => {
      obj[header] = record[idx] ?? ''
    })
    return obj
  })
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function htmlToText(html) {
  const source = decodeEntities(String(html ?? ''))
  const withBreaks = source
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*\/h[1-6]\s*>/gi, '\n\n')
    .replace(/<\s*li\s*>/gi, '- ')
    .replace(/<\s*\/li\s*>/gi, '\n')
  const withoutTags = withBreaks.replace(/<[^>]+>/g, ' ')
  return withoutTags
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function buildContentDocument(text) {
  const raw = text.trim()
  const blocks = raw
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({ type: 'paragraph', text: part }))

  return { version: 1, raw, blocks }
}

function mapStatus(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'publicado' || normalized === 'published') return 'published'
  if (normalized === 'rascunho' || normalized === 'draft') return 'draft'
  return 'archived'
}

function parseTags(value) {
  return Array.from(
    new Set(
      String(value ?? '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function toIsoOrNull(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
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

  const csvPath = path.join(root, 'docs', '2026-05-21-post-47db4bbe-7cd2-cab3-b41d-0f059be20d8f.csv')
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV nao encontrado em: ${csvPath}`)
  }

  const csvText = fs.readFileSync(csvPath, 'utf8')
  const records = parseCsv(csvText)

  const postRecords = records.filter((row) => String(row['Post type'] ?? '').trim().toLowerCase() === 'post')
  const validRecords = postRecords.filter((row) => String(row.Title ?? '').trim().length > 0)

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const categorySlugToId = new Map()
  const categories = Array.from(
    new Set(
      validRecords
        .map((row) => String(row.Categorias ?? '').trim())
        .filter(Boolean),
    ),
  )

  for (const categoryName of categories) {
    const slug = slugify(categoryName || 'sem-categoria')
    if (!slug) continue
    const { data, error } = await supabase
      .from('blog_categories')
      .upsert({ name: categoryName, slug }, { onConflict: 'slug' })
      .select('id, slug')
      .single()

    if (error) throw error
    categorySlugToId.set(data.slug, data.id)
  }

  let imported = 0
  for (const row of validRecords) {
    const title = String(row.Title ?? '').trim()
    if (!title) continue

    const slug = slugify(String(row['URL Slug'] ?? '').trim() || title)
    if (!slug) continue

    const contentText = htmlToText(row.Content ?? '')
    const excerptSource = String(row.Excerpt ?? '').trim() || contentText
    const excerpt = excerptSource ? excerptSource.slice(0, 600) : null
    const categoryName = String(row.Categorias ?? '').trim()
    const categoryId = categorySlugToId.get(slugify(categoryName)) ?? null

    const status = mapStatus(row.Status)
    const publishedAt = status === 'published'
      ? (toIsoOrNull(row.Date) ?? toIsoOrNull(row['Wp Old Date']) ?? new Date().toISOString())
      : null

    const payload = {
      category_id: categoryId,
      title,
      slug,
      excerpt,
      content: buildContentDocument(contentText),
      cover_image_path: String(row['Featured Image'] ?? '').trim() || null,
      seo_title: String(row['SEO Title'] ?? '').trim() || String(row['SEO Keyword'] ?? '').trim() || null,
      seo_description: String(row['SEO Description'] ?? '').trim() || null,
      status,
      published_at: publishedAt,
      tags: parseTags(row.Tags),
    }

    if (apply) {
      const { error } = await supabase
        .from('blog_posts')
        .upsert(payload, { onConflict: 'slug' })
      if (error) throw error
    }

    imported += 1
  }

  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    csvRecords: records.length,
    postTypeRecords: postRecords.length,
    validRecords: validRecords.length,
    imported,
    categories: categories.length,
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
