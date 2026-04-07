import { createAdminClient } from './supabase.ts'
import { insertIntegrationLog } from './logging.ts'

type ListingStatus = 'approved' | 'pending_review' | 'rejected'

function getEmailProviderConfig() {
  return {
    resendApiKey: Deno.env.get('RESEND_API_KEY'),
    emailFrom: Deno.env.get('EMAIL_FROM'),
    emailFromName: Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas',
  }
}

async function resolveListingOwnerEmail(listingId: string) {
  const admin = createAdminClient()
  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('id, title, user_id')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    throw new Error('Listing not found for notification.')
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('auth_user_id, full_name')
    .eq('id', listing.user_id)
    .single()

  if (profileError || !profile) {
    throw new Error('Listing owner profile not found.')
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(profile.auth_user_id)

  if (authError || !authUser.user?.email) {
    throw new Error('Listing owner email not found.')
  }

  return {
    email: authUser.user.email,
    listingTitle: listing.title,
    recipientName: profile.full_name ?? authUser.user.email,
  }
}

function renderListingStatusEmail(input: {
  listingTitle: string
  reason?: string | null
  recipientName: string
  status: ListingStatus
}) {
  const statusCopy: Record<ListingStatus, { body: string; subject: string }> = {
    pending_review: {
      subject: 'Seu anuncio foi enviado para revisao',
      body: `O anuncio "${input.listingTitle}" foi enviado para revisao e agora aguarda moderacao.`,
    },
    approved: {
      subject: 'Seu anuncio foi aprovado',
      body: `O anuncio "${input.listingTitle}" foi aprovado e ja pode ser exibido publicamente.`,
    },
    rejected: {
      subject: 'Seu anuncio foi reprovado',
      body: `O anuncio "${input.listingTitle}" foi reprovado.${input.reason ? ` Motivo: ${input.reason}` : ''}`,
    },
  }

  const selected = statusCopy[input.status]
  const text = `Ola ${input.recipientName},\n\n${selected.body}\n\nZap Sucatas`
  const html = `<p>Ola ${input.recipientName},</p><p>${selected.body}</p><p>Zap Sucatas</p>`

  return {
    subject: selected.subject,
    text,
    html,
  }
}

async function sendWithResend(input: {
  from: string
  html: string
  subject: string
  text: string
  to: string
}, resendApiKey: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}`)
  }

  return response.json()
}

export async function notifyListingStatus(input: {
  listingId: string
  reason?: string | null
  status: ListingStatus
}) {
  const { resendApiKey, emailFrom, emailFromName } = getEmailProviderConfig()
  const recipient = await resolveListingOwnerEmail(input.listingId)
  const email = renderListingStatusEmail({
    listingTitle: recipient.listingTitle,
    reason: input.reason ?? null,
    recipientName: recipient.recipientName,
    status: input.status,
  })

  if (!resendApiKey || !emailFrom) {
    await insertIntegrationLog({
      integrationName: 'email',
      status: 'skipped',
      message: 'Email provider is not configured.',
      payload: {
        listingId: input.listingId,
        recipient: recipient.email,
        status: input.status,
      },
    })

    return { delivered: false, provider: 'none' }
  }

  const from = `${emailFromName} <${emailFrom}>`
  const providerResponse = await sendWithResend(
    {
      from,
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    },
    resendApiKey,
  )

  await insertIntegrationLog({
    integrationName: 'email',
    status: 'success',
    message: `Listing status notification sent: ${input.status}`,
    payload: {
      listingId: input.listingId,
      recipient: recipient.email,
      status: input.status,
      providerResponse,
    },
  })

  return { delivered: true, provider: 'resend' }
}
