/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import nodemailer from 'npm:nodemailer@6.10.1'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { renderBrandedEmail } from '../_shared/email-template.ts'
import { insertIntegrationLog } from '../_shared/logging.ts'
import { createAdminClient } from '../_shared/supabase.ts'
import { enqueueTransactionalNotification } from '../_shared/transactional-notifications.ts'

type RequestBody = {
  questionId?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getSmtpConfig() {
  const host = Deno.env.get('SMTP_HOST')
  const password = Deno.env.get('SMTP_PASSWORD')
  const emailFrom = Deno.env.get('EMAIL_FROM')

  if (!host || !password || !emailFrom) {
    return null
  }

  const port = Number(Deno.env.get('SMTP_PORT') ?? '465')
  const secure = (Deno.env.get('SMTP_SECURE') ?? 'true').toLowerCase() === 'true'

  return {
    emailFrom,
    emailFromName: Deno.env.get('EMAIL_FROM_NAME') ?? 'Zap Sucatas',
    host,
    password,
    port: Number.isNaN(port) ? 465 : port,
    secure,
    user: Deno.env.get('SMTP_USER') ?? emailFrom,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const payload = (await request.json()) as RequestBody
    const questionId = typeof payload.questionId === 'string' ? payload.questionId.trim() : ''

    if (!questionId) {
      return jsonResponse({ error: 'questionId e obrigatório.' }, 400)
    }

    const admin = createAdminClient()
    const { data: question, error: questionError } = await admin
      .from('listing_questions')
      .select('id, listing_id, author_user_id')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return jsonResponse({ error: 'Pergunta não encontrada.' }, 404)
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, title, city, state, slug, user_id')
      .eq('id', question.listing_id)
      .single()

    if (listingError || !listing) {
      return jsonResponse({ error: 'Anúncio não encontrado.' }, 404)
    }

    if (question.author_user_id && question.author_user_id === listing.user_id) {
      return jsonResponse({ queuedCount: 0, success: true })
    }

    const result = await enqueueTransactionalNotification({
      actionUrl: '/app/perguntas',
      body: `Seu anúncio "${listing.title}" recebeu uma nova pergunta.`,
      category: 'listing_questions',
      payload: {
        entity_type: 'listing_question',
        listing_id: listing.id,
        question_id: question.id,
      },
      priority: 'normal',
      title: 'Nova pergunta em anúncio',
      userId: listing.user_id,
    })

    try {
      const { data: ownerProfile, error: ownerProfileError } = await admin
        .from('profiles')
        .select('auth_user_id, email, full_name')
        .eq('id', listing.user_id)
        .single()

      if (ownerProfileError || !ownerProfile) {
        throw ownerProfileError ?? new Error('Perfil do anunciante não encontrado.')
      }

      let ownerEmail = ownerProfile.email?.trim() ?? ''
      if (!ownerEmail && ownerProfile.auth_user_id) {
        const { data: authUserResult, error: authUserError } = await admin.auth.admin.getUserById(ownerProfile.auth_user_id)
        if (authUserError) {
          throw authUserError
        }
        ownerEmail = authUserResult.user?.email?.trim() ?? ''
      }

      if (!ownerEmail) {
        throw new Error('E-mail do anunciante não encontrado.')
      }

      const smtp = getSmtpConfig()
      if (!smtp) {
        throw new Error('SMTP não configurado para envio imediato de e-mail.')
      }

      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.password },
      })

      const previewUrl = listing.slug
        ? `${Deno.env.get('SITE_URL') ?? 'https://zap-sucatas.vercel.app'}/anuncios/${listing.slug}`
        : `${Deno.env.get('SITE_URL') ?? 'https://zap-sucatas.vercel.app'}/app/perguntas`

      const recipientName = ownerProfile.full_name?.trim() || 'anunciante'
      const subject = 'Nova pergunta recebida em seu anúncio'
      const bodyHtml = `
        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">Olá ${escapeHtml(recipientName)},</p>
        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#334155;">Seu anúncio <strong>${escapeHtml(listing.title)}</strong> recebeu uma nova pergunta e está aguardando sua resposta.</p>
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.7;color:#334155;">Localidade: ${escapeHtml(`${listing.city} - ${listing.state}`)}</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#334155;">Abra sua área para responder rapidamente e aumentar a conversão do anúncio.</p>
        <a href="${escapeHtml(previewUrl)}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;">Abrir anúncio</a>
      `

      const rendered = await renderBrandedEmail({
        title: subject,
        bodyHtml,
        footerText: 'Zap Sucatas · Este e-mail foi enviado automaticamente pela plataforma.',
      })

      await transporter.sendMail({
        from: `${smtp.emailFromName} <${smtp.emailFrom}>`,
        to: ownerEmail,
        subject,
        html: rendered.html,
        text: `Olá ${recipientName}, seu anúncio "${listing.title}" recebeu uma nova pergunta. Acesse ${previewUrl} para responder.`,
      })
    } catch (emailError) {
      const emailMessage = emailError instanceof Error ? emailError.message : 'Falha desconhecida ao enviar e-mail ao anunciante.'
      await insertIntegrationLog({
        integrationName: 'listing_questions',
        message: emailMessage,
        payload: {
          event: 'notify_listing_question_email_failed',
          listingId: listing.id,
          questionId: question.id,
        },
        status: 'error',
      })
    }

    await insertIntegrationLog({
      integrationName: 'listing_questions',
      message: 'Notificação de nova pergunta enfileirada.',
      payload: {
        listingId: listing.id,
        notificationId: result.notificationId,
        questionId: question.id,
        queuedCount: result.queuedCount,
      },
      status: 'queued',
    })

    return jsonResponse({ queuedCount: result.queuedCount, success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'

    await insertIntegrationLog({
      integrationName: 'listing_questions',
      message,
      payload: { event: 'notify_listing_question_failed' },
      status: 'error',
    })

    return jsonResponse({ error: message }, 400)
  }
})
