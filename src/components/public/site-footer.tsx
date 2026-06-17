import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Brand } from '@/components/navigation/brand'
import { BuildVersionBadge } from '@/components/shared/build-version-badge'
import { Button } from '@/components/ui/button'
import { usePublicSitePages } from '@/hooks/use-public-site-pages'

export function SiteFooter() {
  const { isPageOnline, settings } = usePublicSitePages()

  return (
    <footer className="border-t border-border/80 bg-[#163a2d] text-white">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr] lg:px-8">
        <div className="space-y-5">
          <Brand
            layout="stacked"
            logoScalePercent={settings?.footerLogoScalePercent ?? 200}
            subtitle="Portal comercial especializado em sucatas"
            tone="inverse"
          />
          <p className="max-w-md text-sm leading-7 text-white/72">
            Catálogo moderado, páginas de anúncio robustas, referência de preços e estrutura comercial
            pensada para o mercado de sucatas.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
            Explorar
          </h3>
          <div className="grid gap-3 text-sm text-white/78">
            {isPageOnline(paths.public.listings) ? <Link to={paths.public.listings}>Anúncios</Link> : null}
            {isPageOnline(paths.public.categories) ? <Link to={paths.public.categories}>Categorias</Link> : null}
            {isPageOnline(paths.public.pricing) ? <Link to={paths.public.pricing}>Cotação LME</Link> : null}
            {isPageOnline(paths.public.scrapPrices) ? <Link to={paths.public.scrapPrices}>Preços dos Metais</Link> : null}
            {isPageOnline(paths.public.blog) ? <Link to={paths.public.blog}>Blog</Link> : null}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
            Empresa
          </h3>
          <div className="grid gap-3 text-sm text-white/78">
            {isPageOnline(paths.public.about) ? <Link to={paths.public.about}>Sobre a Zap Sucatas</Link> : null}
            {isPageOnline(paths.public.support) ? <Link to={paths.public.support}>Suporte</Link> : null}
            {isPageOnline(paths.public.contact) ? <Link to={paths.public.contact}>Contato</Link> : null}
            <Link to={paths.auth.login}>Entrar</Link>
            <Link to={paths.auth.register}>Criar conta</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/72">
            Mercado
          </h3>
          <h4 className="text-lg font-semibold text-white">
            Publique seu estoque
          </h4>
          <p className="text-sm leading-7 text-white/72">
            Crie anúncios com visibilidade para compradores do setor e acelere suas negociações.
          </p>
          <Button asChild className="bg-white !text-[#163a2d] hover:bg-white/90" style={{ color: '#163a2d' }}>
            <Link to={paths.auth.register}>Publicar anúncio</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 text-sm text-white/58 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 Zap Sucatas. Marketplace especializado em sucatas.</p>
          <div className="flex flex-col items-start gap-1 lg:items-end">
            <p>Produto público separado do dashboard do usuário e do painel administrativo.</p>
            <BuildVersionBadge tone="dark" />
          </div>
        </div>
      </div>
    </footer>
  )
}
