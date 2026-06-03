export async function renderBrandedEmail(input: {
  bodyHtml: string
  footerText?: string
  title: string
}) {
  const footerText = input.footerText ?? 'Zap Sucatas · Este é um e-mail automático.'
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #dbe3ea;border-collapse:separate;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td style="background:#27991f;padding:22px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"><tr><td valign="middle" width="56" style="width:56px;padding:0 14px 0 0;"><div style="width:44px;height:44px;line-height:44px;text-align:center;background:#ffffff;color:#27991f;font-size:15px;font-weight:700;border-radius:9999px;mso-line-height-rule:exactly;">ZS</div></td><td valign="middle" style="padding:0;color:#ffffff;"><div style="font-size:20px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;">Zap Sucatas</div><div style="margin-top:2px;font-size:12px;line-height:1.4;color:#eff6ec;">Marketplace de sucatas e maquinários</div></td></tr></table></td></tr><tr><td style="padding:30px 28px 10px 28px;"><h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:#0f172a;">${input.title}</h1>${input.bodyHtml}</td></tr><tr><td style="padding:18px 28px 24px 28px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#64748b;">${footerText}</td></tr></table></td></tr></table></body></html>`
  return { html }
}

