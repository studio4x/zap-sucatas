import type { AuthRole } from '@/domains/auth/types'

export const paths = {
  public: {
    home: '/',
    listings: '/anuncios',
    listingDetails: (slug: string) => `/anuncios/${slug}`,
    categories: '/categorias',
    categoryDetails: (slug: string) => `/categorias/${slug}`,
    pricing: '/tabela-de-precos',
    blog: '/blog',
    blogPost: (slug: string) => `/blog/${slug}`,
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
    editListing: (id: string) => `/app/anuncios/${id}/editar`,
    questions: '/app/perguntas',
    profile: '/app/perfil',
    settings: '/app/configuracoes',
  },
  admin: {
    root: '/admin',
    listings: '/admin/anuncios',
    newListing: '/admin/anuncios/novo',
    editListing: (id: string) => `/admin/anuncios/${id}/editar`,
    listingDetails: (id: string) => `/admin/anuncios/${id}`,
    questions: '/admin/perguntas',
    users: '/admin/usuarios',
    contactMessages: '/admin/contato',
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
