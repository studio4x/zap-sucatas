import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '@/app/guards/auth-guard'
import { GuestGuard } from '@/app/guards/guest-guard'
import { RoleGuard } from '@/app/guards/role-guard'
import { AdminLayout } from '@/app/layouts/admin-layout'
import { DashboardLayout } from '@/app/layouts/dashboard-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import { paths } from '@/app/paths'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page'
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { AppEditListingPage } from '@/pages/app/edit-listing-page'
import { AppListingsPage } from '@/pages/app/listings-page'
import { AppNewListingPage } from '@/pages/app/new-listing-page'
import { AppOverviewPage } from '@/pages/app/overview-page'
import { AppProfilePage } from '@/pages/app/profile-page'
import { AppQuestionsPage } from '@/pages/app/questions-page'
import { AppSettingsPage } from '@/pages/app/settings-page'
import { AdminBlogPage } from '@/pages/admin/blog-page'
import { AdminCategoriesPage } from '@/pages/admin/categories-page'
import { AdminListingDetailsPage } from '@/pages/admin/listing-details-page'
import { AdminListingsPage } from '@/pages/admin/listings-page'
import { AdminLocationsPage } from '@/pages/admin/locations-page'
import { AdminLogsPage } from '@/pages/admin/logs-page'
import { AdminMaterialsPage } from '@/pages/admin/materials-page'
import { AdminOverviewPage } from '@/pages/admin/overview-page'
import { AdminPricingPage } from '@/pages/admin/pricing-page'
import { AdminQuestionsPage } from '@/pages/admin/questions-page'
import { AdminSettingsPage } from '@/pages/admin/settings-page'
import { AdminUsersPage } from '@/pages/admin/users-page'
import { AboutPage } from '@/pages/public/about-page'
import { BlogPage } from '@/pages/public/blog-page'
import { BlogPostPage } from '@/pages/public/blog-post-page'
import { CategoriesPage } from '@/pages/public/categories-page'
import { CategoryDetailsPage } from '@/pages/public/category-details-page'
import { ContactPage } from '@/pages/public/contact-page'
import { HomePage } from '@/pages/public/home-page'
import { ListingDetailsPage } from '@/pages/public/listing-details-page'
import { ListingsPage } from '@/pages/public/listings-page'
import { PricingPage } from '@/pages/public/pricing-page'
import { NotFoundPage } from '@/pages/shared/not-found-page'

export const routes: RouteObject[] = [
  {
    path: paths.public.home,
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'anuncios',
        element: <ListingsPage />,
      },
      {
        path: 'anuncios/:slug',
        element: <ListingDetailsPage />,
      },
      {
        path: 'categorias',
        element: <CategoriesPage />,
      },
      {
        path: 'categorias/:slug',
        element: <CategoryDetailsPage />,
      },
      {
        path: 'tabela-de-precos',
        element: <PricingPage />,
      },
      {
        path: 'blog',
        element: <BlogPage />,
      },
      {
        path: 'blog/:slug',
        element: <BlogPostPage />,
      },
      {
        path: 'sobre',
        element: <AboutPage />,
      },
      {
        path: 'contato',
        element: <ContactPage />,
      },
      {
        path: 'login',
        element: (
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        ),
      },
      {
        path: 'cadastro',
        element: (
          <GuestGuard>
            <RegisterPage />
          </GuestGuard>
        ),
      },
      {
        path: 'recuperar-senha',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    path: paths.app.root,
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AppOverviewPage />,
      },
      {
        path: 'anuncios',
        element: <AppListingsPage />,
      },
      {
        path: 'anuncios/novo',
        element: <AppNewListingPage />,
      },
      {
        path: 'anuncios/:id/editar',
        element: <AppEditListingPage />,
      },
      {
        path: 'perguntas',
        element: <AppQuestionsPage />,
      },
      {
        path: 'perfil',
        element: <AppProfilePage />,
      },
      {
        path: 'configuracoes',
        element: <AppSettingsPage />,
      },
    ],
  },
  {
    path: paths.admin.root,
    element: (
      <AuthGuard>
        <RoleGuard allowedRoles={['admin']}>
          <AdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AdminOverviewPage />,
      },
      {
        path: 'anuncios',
        element: <AdminListingsPage />,
      },
      {
        path: 'anuncios/:id',
        element: <AdminListingDetailsPage />,
      },
      {
        path: 'perguntas',
        element: <AdminQuestionsPage />,
      },
      {
        path: 'usuarios',
        element: <AdminUsersPage />,
      },
      {
        path: 'categorias',
        element: <AdminCategoriesPage />,
      },
      {
        path: 'materiais',
        element: <AdminMaterialsPage />,
      },
      {
        path: 'localidades',
        element: <AdminLocationsPage />,
      },
      {
        path: 'blog',
        element: <AdminBlogPage />,
      },
      {
        path: 'precos',
        element: <AdminPricingPage />,
      },
      {
        path: 'configuracoes',
        element: <AdminSettingsPage />,
      },
      {
        path: 'logs',
        element: <AdminLogsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
