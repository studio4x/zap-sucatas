import nodemailer from 'npm:nodemailer@6.10.1'
import { renderBrandedEmail } from './email-template.ts'
import { createAdminClient } from './supabase.ts'

function resolvePublicAppUrl() {
  const explicit = Deno.env.get('APP_BASE_URL')?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  return 'https://zap-sucatas.vercel.app'
}

function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${resolvePublicAppUrl()}${normalizedPath}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function resolveAdminDestinationEmail() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('system_settings')
    .select('admin_notification_email, support_email')
    .limit(1)
    .maybeSingle()

  return data?.admin_notification_email?.trim() || data?.support_email?.trim() || null
}

export async function sendAdminNotificationEmail(input: {
  actionLabel?: string
  actionUrl?: string
  body: string
  subject: string
}) {
  const host = Deno.env.get('SMTP_HOST')
  const password = Deno.env.get('SMTP_PASSWORD')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  if (!host || !password || !emailFrom) {
    return false
  }

  const destination = await resolveAdminDestinationEmail()
  if (!destination) {
    return false
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
    secure: (Deno.env.get('SMTP_SECURE') ?? 'true').toLowerCase() === 'true',
    auth: { user: Deno.env.get('SMTP_USER') ?? emailFrom, pass: password },
  })

  const bodyHtml = `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">${escapeHtml(
    input.body,
  ).replaceAll('\n', '<br/>')}</p>`
  const actionHtml =
    input.actionUrl && input.actionLabel
      ? `<p style="margin:0 0 18px 0;"><a href="${escapeHtml(
          toAbsoluteUrl(input.actionUrl),
        )}" style="display:inline-block;background:#27991f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;">${escapeHtml(
          input.actionLabel,
        )}</a></p>`
      : ''

  await transporter.sendMail({
    from: `${Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas'} <${emailFrom}>`,
    to: destination,
    subject: input.subject,
    html: (
      await renderBrandedEmail({
        title: input.subject,
        bodyHtml: `${bodyHtml}${actionHtml}`,
      })
    ).html,
    text: input.body,
  })

  return true
}

