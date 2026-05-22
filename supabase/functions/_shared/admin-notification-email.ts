import nodemailer from 'npm:nodemailer@6.10.1'
import { renderBrandedEmail } from './email-template.ts'
import { createAdminClient } from './supabase.ts'

async function resolveAdminDestinationEmail() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('system_settings')
    .select('admin_notification_email, support_email')
    .limit(1)
    .maybeSingle()

  return data?.admin_notification_email?.trim() || data?.support_email?.trim() || null
}

export async function sendAdminNotificationEmail(input: { body: string; subject: string }) {
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

  await transporter.sendMail({
    from: `${Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas'} <${emailFrom}>`,
    to: destination,
    subject: input.subject,
    html: (
      await renderBrandedEmail({
        title: input.subject,
        bodyHtml: `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">${input.body}</p>`,
      })
    ).html,
    text: input.body,
  })

  return true
}
