const FALLBACK_LOGO_URL =
  'https://jrxccuxqucwrlccfhdrg.supabase.co/storage/v1/object/public/site-assets/site/branding/logo-light/1779456570460-novo-logotipo-zap-sucatas-todo-branco-sem-fundo.svg'

const SITE_ASSETS_BUCKET = 'site-assets'
const VISUAL_MANIFEST_PATH = 'site/branding/manifest.json'

type VisualManifest = {
  logoLightPath?: string | null
}

function getSupabaseBaseUrl() {
  return (Deno.env.get('SUPABASE_URL') ?? 'https://jrxccuxqucwrlccfhdrg.supabase.co').replace(/\/+$/, '')
}

function toStoragePublicUrl(path: string) {
  const encodedPath = path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  return `${getSupabaseBaseUrl()}/storage/v1/object/public/${SITE_ASSETS_BUCKET}/${encodedPath}`
}

async function resolveLogoLightUrl() {
  try {
    const manifestUrl = toStoragePublicUrl(VISUAL_MANIFEST_PATH)
    const response = await fetch(manifestUrl, { cache: 'no-store' })
    if (!response.ok) {
      return FALLBACK_LOGO_URL
    }

    const manifest = (await response.json()) as VisualManifest
    if (manifest.logoLightPath && manifest.logoLightPath.trim().length > 0) {
      return toStoragePublicUrl(manifest.logoLightPath)
    }

    return FALLBACK_LOGO_URL
  } catch {
    return FALLBACK_LOGO_URL
  }
}

export async function renderBrandedEmail(input: {
  bodyHtml: string
  footerText?: string
  title: string
}) {
  const logoUrl = await resolveLogoLightUrl()
  const footerText = input.footerText ?? 'Zap Sucatas · Este é um e-mail automático.'
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;"><tr><td align="center"><table role="presentation" width="100%" style="max-width:620px;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;"><tr><td style="background:#27991f;padding:24px;text-align:center;"><img src="${logoUrl}" alt="Zap Sucatas" style="max-width:260px;width:100%;height:auto;display:inline-block;"/></td></tr><tr><td style="padding:28px 26px 8px 26px;"><h1 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;">${input.title}</h1>${input.bodyHtml}</td></tr><tr><td style="padding:18px 26px 24px 26px;border-top:1px solid #e5e7eb;font-size:12px;color:#64748b;line-height:1.6;">${footerText}</td></tr></table></td></tr></table></body></html>`
  return { html, logoUrl }
}

