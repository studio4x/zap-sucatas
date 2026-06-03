import nodemailer from 'npm:nodemailer@6.10.1'
import { renderBrandedEmail } from './email-template.ts'
import { createAdminClient } from './supabase.ts'
import { insertIntegrationLog } from './logging.ts'

type ListingStatus = 'approved' | 'pending_review' | 'rejected'

type ListingNotificationContext = {
  categoryName: string | null
  city: string
  conditionType: string | null
  contactName: string | null
  contactPhone: string | null
  createdAt: string
  description: string
  listingTitle: string
  materialName: string | null
  priceLabel: string | null
  recipientName: string
  state: string
  summary: string | null
  updatedAt: string
}

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
    .select(
      `
        id,
        title,
        user_id,
        summary,
        description,
        city,
        state,
        condition_type,
        contact_name,
        contact_phone,
        price_label,
        created_at,
        updated_at,
        listing_categories(name),
        listing_materials(name)
      `,
    )
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    throw new Error('Anúncio não encontrado para notificação.')
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('auth_user_id, full_name')
    .eq('id', listing.user_id)
    .single()

  if (profileError || !profile) {
    throw new Error('Perfil do proprietário do anúncio não encontrado.')
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(profile.auth_user_id)

  if (authError || !authUser.user?.email) {
    throw new Error('E-mail do proprietário do anúncio não encontrado.')
  }

  return {
    categoryName: listing.listing_categories?.name ?? null,
    city: listing.city,
    conditionType: listing.condition_type ?? null,
    contactName: listing.contact_name ?? null,
    contactPhone: listing.contact_phone ?? null,
    createdAt: listing.created_at,
    description: listing.description,
    email: authUser.user.email,
    listingTitle: listing.title,
    materialName: listing.listing_materials?.name ?? null,
    priceLabel: listing.price_label ?? null,
    recipientName: profile.full_name ?? authUser.user.email,
    state: listing.state,
    summary: listing.summary ?? null,
    updatedAt: listing.updated_at,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateTimePtBr(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function renderListingInfoRows(context: ListingNotificationContext) {
  const rows = [
    ['Título', context.listingTitle],
    ['Resumo', context.summary ?? 'Não informado'],
    ['Categoria', context.categoryName ?? 'Não informada'],
    ['Material', context.materialName ?? 'Não informado'],
    ['Localidade', `${context.city} - ${context.state}`],
    ['Condição', context.conditionType ?? 'Não informada'],
    ['Faixa de preço', context.priceLabel ?? 'Sob consulta'],
    ['Contato', context.contactName ?? 'Não informado'],
    ['Telefone', context.contactPhone ?? 'Não informado'],
    ['Atualizado em', formatDateTimePtBr(context.updatedAt)],
  ]

  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#334155;vertical-align:top;width:38%;">${escapeHtml(
          label,
        )}</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escapeHtml(
          value,
        )}</td></tr>`,
    )
    .join('')
}

async function renderListingStatusEmail(input: {
  context: ListingNotificationContext
  reason?: string | null
  status: ListingStatus
}) {
  const shortDescription = input.context.description.trim().slice(0, 280)
  const statusCopy: Record<ListingStatus, { body: string; subject: string }> = {
    pending_review: {
      subject: 'Seu anúncio foi enviado para revisao',
      body: `O anúncio "${input.context.listingTitle}" foi enviado para revisao e agora aguarda moderação.`,
    },
    approved: {
      subject: 'Seu anúncio foi aprovado',
      body: `O anúncio "${input.context.listingTitle}" foi aprovado e ja pode ser exibido publicamente.`,
    },
    rejected: {
      subject: 'Seu anúncio foi reprovado',
      body: `O anúncio "${input.context.listingTitle}" foi reprovado.${input.reason ? ` Motivo: ${input.reason}` : ''}`,
    },
  }

  const selected = statusCopy[input.status]
  const text = `Ola ${input.context.recipientName},\n\n${selected.body}\n\nZap Sucatas`
  const listingRowsHtml = renderListingInfoRows(input.context)
  const descriptionHtml = shortDescription
    ? `<p style="margin:0 0 0 0;font-size:13px;line-height:1.7;color:#334155;"><strong>Descrição:</strong> ${escapeHtml(shortDescription)}${input.context.description.trim().length > 280 ? '...' : ''}</p>`
    : ''
  const html = (
    await renderBrandedEmail({
      title: selected.subject,
      bodyHtml: `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">Olá ${escapeHtml(
        input.context.recipientName,
      )},</p><p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">${escapeHtml(
        selected.body,
      )}</p><p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f172a;letter-spacing:0.02em;text-transform:uppercase;">Dados do anúncio</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden;margin:0 0 12px 0;">${listingRowsHtml}</table>${descriptionHtml}`,
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
    context: {
      categoryName: recipient.categoryName,
      city: recipient.city,
      conditionType: recipient.conditionType,
      contactName: recipient.contactName,
      contactPhone: recipient.contactPhone,
      createdAt: recipient.createdAt,
      description: recipient.description,
      listingTitle: recipient.listingTitle,
      materialName: recipient.materialName,
      priceLabel: recipient.priceLabel,
      recipientName: recipient.recipientName,
      state: recipient.state,
      summary: recipient.summary,
      updatedAt: recipient.updatedAt,
    },
    reason: input.reason ?? null,
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

