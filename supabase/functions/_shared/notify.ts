import nodemailer from 'npm:nodemailer@6.10.1'
import { renderBrandedEmail } from './email-template.ts'
import { createAdminClient } from './supabase.ts'
import { insertIntegrationLog } from './logging.ts'

type ListingStatus = 'approved' | 'pending_review' | 'rejected'

type SmtpConfig = {
  emailFrom: string
  emailFromName: string
  host: string
  password: string
  port: number
  secure: boolean
  user: string
}

function getSmtpConfig(): SmtpConfig | null {
  const host = Deno.env.get('SMTP_HOST')
  const password = Deno.env.get('SMTP_PASSWORD')
  const emailFrom = Deno.env.get('EMAIL_FROM')

  if (!host || !password || !emailFrom) {
    return null
  }

  const port = Number(Deno.env.get('SMTP_PORT') ?? '465')
  const secure = (Deno.env.get('SMTP_SECURE') ?? 'true').toLowerCase() === 'true'

  return {
    host,
    password,
    emailFrom,
    emailFromName: Deno.env.get('EMAIL_FROM_NAME') ?? emailFrom,
    port: Number.isNaN(port) ? 465 : port,
    secure,
    user: Deno.env.get('SMTP_USER') ?? emailFrom,
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

async function renderListingStatusEmail(input: {
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
  const html = (
    await renderBrandedEmail({
      title: selected.subject,
      bodyHtml: `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">Olá ${input.recipientName},</p><p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">${selected.body}</p>`,
    })
  ).html

  return {
    subject: selected.subject,
    text,
    html,
  }
}

async function sendWithSmtp(input: {
  from: string
  html: string
  subject: string
  text: string
  to: string
}, config: SmtpConfig) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  })

  return transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
}

export async function notifyListingStatus(input: {
  listingId: string
  reason?: string | null
  status: ListingStatus
}) {
  const smtpConfig = getSmtpConfig()
  const recipient = await resolveListingOwnerEmail(input.listingId)
  const email = await renderListingStatusEmail({
    listingTitle: recipient.listingTitle,
    reason: input.reason ?? null,
    recipientName: recipient.recipientName,
    status: input.status,
  })

  if (!smtpConfig) {
    await insertIntegrationLog({
      integrationName: 'email',
      status: 'skipped',
      message: 'SMTP is not configured.',
      payload: {
        listingId: input.listingId,
        recipient: recipient.email,
        status: input.status,
      },
    })

    return { delivered: false, provider: 'none' }
  }

  const from = `${smtpConfig.emailFromName} <${smtpConfig.emailFrom}>`
  const providerResponse = await sendWithSmtp(
    {
      from,
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    },
    smtpConfig,
  )

  await insertIntegrationLog({
    integrationName: 'email',
    status: 'success',
    message: `Listing status notification sent: ${input.status}`,
    payload: {
      listingId: input.listingId,
      recipient: recipient.email,
      status: input.status,
      provider: 'smtp',
      messageId: providerResponse.messageId ?? null,
      response: providerResponse.response ?? null,
    },
  })

  return { delivered: true, provider: 'smtp' }
}
