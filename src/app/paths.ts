import type { AuthRole } from '@/domains/auth/types'

export const paths = {
  public: {
    home: '/',
    listings: '/anuncios',
    categories: '/categorias',
    pricing: '/tabela-de-precos',
    blog: '/blog',
    about: '/sobre',
    contact: '/contato',
  },
  auth: {
    login: '/login',
    register: '/cadastro',
    forgotPassword: '/recuperar-senha',
  },
  app: {
    root: '/app',
    listings: '/app/anuncios',
    newListing: '/app/anuncios/novo',
    questions: '/app/perguntas',
    profile: '/app/perfil',
    settings: '/app/configuracoes',
  },
  admin: {
    root: '/admin',
    listings: '/admin/anuncios',
    questions: '/admin/perguntas',
    users: '/admin/usuarios',
    categories: '/admin/categorias',
    materials: '/admin/materiais',
    locations: '/admin/localidades',
    blog: '/admin/blog',
    pricing: '/admin/precos',
    settings: '/admin/configuracoes',
    logs: '/admin/logs',
  },
} as const

export function getDefaultPathByRole(role: AuthRole) {
  return role === 'admin' ? paths.admin.root : paths.app.root
}
