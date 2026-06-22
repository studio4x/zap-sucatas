import { matchPath } from 'react-router-dom'
import { paths } from '@/app/paths'
import { resolveTutorialFallback } from '@/domains/admin-tutorials/storage'
import type { AdminTutorial } from '@/domains/admin-tutorials/types'

type AdminTutorialRouteMatcher = {
  path: string
  resolveTutorialId: (pathname: string, tutorials: AdminTutorial[]) => string | null
}

function findTutorialByIdOrSlug(tutorials: AdminTutorial[], value: string | undefined) {
  if (!value) {
    return null
  }

  return tutorials.find((tutorial) => tutorial.id === value || tutorial.slug === value) ?? null
}

const ADMIN_TUTORIAL_ROUTE_MATCHERS: AdminTutorialRouteMatcher[] = [
  {
    path: paths.admin.newListing,
    resolveTutorialId: () => 'anuncios-criar-novo',
  },
  {
    path: paths.admin.editListing(':id'),
    resolveTutorialId: () => 'anuncios-editar-existente',
  },
  {
    path: paths.admin.listingDetails(':id'),
    resolveTutorialId: () => 'anuncios-revisar-pendente',
  },
  {
    path: paths.admin.listings,
    resolveTutorialId: () => 'anuncios-revisar-pendente',
  },
  {
    path: paths.admin.questions,
    resolveTutorialId: () => 'relacionamento-responder-perguntas',
  },
  {
    path: paths.admin.users,
    resolveTutorialId: () => 'usuarios-localizar-perfil',
  },
  {
    path: paths.admin.tutorialsTutorial(':slug'),
    resolveTutorialId: (pathname, tutorials) => {
      const tutorialSlug = matchPath({ end: true, path: paths.admin.tutorialsTutorial(':slug') }, pathname)?.params.slug
      return findTutorialByIdOrSlug(tutorials, tutorialSlug)?.id ?? 'primeiros-passos-visao-geral'
    },
  },
  {
    path: paths.admin.tutorials,
    resolveTutorialId: () => 'primeiros-passos-visao-geral',
  },
  {
    path: paths.admin.pages,
    resolveTutorialId: () => 'conteudo-atualizar-paginas',
  },
  {
    path: paths.admin.analytics,
    resolveTutorialId: () => 'primeiros-passos-visao-geral',
  },
  {
    path: paths.admin.contactMessages,
    resolveTutorialId: () => 'relacionamento-responder-perguntas',
  },
  {
    path: paths.admin.supportDetail(':id'),
    resolveTutorialId: () => 'relacionamento-suporte-tickets',
  },
  {
    path: paths.admin.support,
    resolveTutorialId: () => 'relacionamento-suporte-tickets',
  },
  {
    path: paths.admin.notifications,
    resolveTutorialId: () => 'operacao-notificacoes',
  },
  {
    path: paths.admin.categories,
    resolveTutorialId: () => 'cadastros-criar-categoria',
  },
  {
    path: paths.admin.materials,
    resolveTutorialId: () => 'cadastros-criar-material',
  },
  {
    path: paths.admin.locations,
    resolveTutorialId: () => 'cadastros-localidades',
  },
  {
    path: paths.admin.blog,
    resolveTutorialId: () => 'conteudo-criar-post-blog',
  },
  {
    path: paths.admin.featuredPayments,
    resolveTutorialId: () => 'primeiros-passos-visao-geral',
  },
  {
    path: paths.admin.pricing,
    resolveTutorialId: () => 'precos-atualizar-tabela',
  },
  {
    path: paths.admin.scrapPrices,
    resolveTutorialId: () => 'precos-validar-snapshots',
  },
  {
    path: paths.admin.settings,
    resolveTutorialId: () => 'configuracoes-contatos-textos',
  },
  {
    path: paths.admin.logs,
    resolveTutorialId: () => 'operacao-logs-auditoria',
  },
]

export function resolveAdminTutorialIdForPathname(pathname: string, tutorials: AdminTutorial[]) {
  const matchedRoute = ADMIN_TUTORIAL_ROUTE_MATCHERS.find((entry) => matchPath({ end: true, path: entry.path }, pathname))

  if (!matchedRoute) {
    return resolveTutorialFallback(tutorials, tutorials[0]?.id ?? null)
  }

  return resolveTutorialFallback(tutorials, matchedRoute.resolveTutorialId(pathname, tutorials))
}
