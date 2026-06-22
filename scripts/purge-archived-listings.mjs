import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

async function run() {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'))

  const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: archivedListings, error: archivedListingsError } = await client
    .from('listings')
    .select('id, title')
    .eq('status', 'archived')
    .order('created_at', { ascending: true })

  if (archivedListingsError) {
    throw archivedListingsError
  }

  const listings = archivedListings ?? []

  if (listings.length === 0) {
    console.log('Nenhum anúncio arquivado encontrado.')
    return
  }

  const listingIds = listings.map((listing) => listing.id)
  const { data: listingImages, error: listingImagesError } = await client
    .from('listing_images')
    .select('listing_id, storage_path')
    .in('listing_id', listingIds)

  if (listingImagesError) {
    throw listingImagesError
  }

  const storagePaths = [
    ...new Set(
      (listingImages ?? [])
        .map((image) => image.storage_path)
        .filter((storagePath) => typeof storagePath === 'string' && storagePath.length > 0),
    ),
  ]

  for (let index = 0; index < storagePaths.length; index += 100) {
    const batch = storagePaths.slice(index, index + 100)

    if (batch.length === 0) {
      continue
    }

    const { error: storageError } = await client.storage.from('listing-media').remove(batch)

    if (storageError) {
      throw storageError
    }
  }

  for (let index = 0; index < listingIds.length; index += 100) {
    const batch = listingIds.slice(index, index + 100)
    const { error: deleteError } = await client.from('listings').delete().in('id', batch)

    if (deleteError) {
      throw deleteError
    }
  }

  console.log(
    JSON.stringify(
      {
        deletedListings: listings.length,
        deletedStorageFiles: storagePaths.length,
      },
      null,
      2,
    ),
  )
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
