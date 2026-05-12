import { lazy, Suspense, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '@/app/guards/auth-guard'
import { GuestGuard } from '@/app/guards/guest-guard'
import { RoleGuard } from '@/app/guards/role-guard'
import { AdminLayout } from '@/app/layouts/admin-layout'
import { DashboardLayout } from '@/app/layouts/dashboard-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import { paths } from '@/app/paths'
import { RouteErrorScreen } from '@/components/shared/route-error-screen'
import { RouteLoadingScreen } from '@/components/shared/route-loading-screen'

const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page').then((module) => ({ default: module.ForgotPasswordPage })))
const LoginPage = lazy(() => import('@/pages/auth/login-page').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/register-page').then((module) => ({ default: module.RegisterPage })))
const AppEditListingPage = lazy(() => import('@/pages/app/edit-listing-page').then((module) => ({ default: module.AppEditListingPage })))
const AppListingsPage = lazy(() => import('@/pages/app/listings-page').then((module) => ({ default: module.AppListingsPage })))
const AppNewListingPage = lazy(() => import('@/pages/app/new-listing-page').then((module) => ({ default: module.AppNewListingPage })))
const AppOverviewPage = lazy(() => import('@/pages/app/overview-page').then((module) => ({ default: module.AppOverviewPage })))
const AppProfilePage = lazy(() => import('@/pages/app/profile-page').then((module) => ({ default: module.AppProfilePage })))
const AppQuestionsPage = lazy(() => import('@/pages/app/questions-page').then((module) => ({ default: module.AppQuestionsPage })))
const AppNotificationsPage = lazy(() => import('@/pages/app/notifications-page').then((module) => ({ default: module.AppNotificationsPage })))
const AppSettingsPage = lazy(() => import('@/pages/app/settings-page').then((module) => ({ default: module.AppSettingsPage })))
const AppSupportTicketsPage = lazy(() => import('@/pages/app/support-tickets-page').then((module) => ({ default: module.AppSupportTicketsPage })))
const AdminBlogPage = lazy(() => import('@/pages/admin/blog-page').then((module) => ({ default: module.AdminBlogPage })))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/analytics-page').then((module) => ({ default: module.AdminAnalyticsPage })))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/categories-page').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminContactMessagesPage = lazy(() => import('@/pages/admin/contact-messages-page').then((module) => ({ default: module.AdminContactMessagesPage })))
const AdminEditListingPage = lazy(() => import('@/pages/admin/edit-listing-page').then((module) => ({ default: module.AdminEditListingPage })))
const AdminListingDetailsPage = lazy(() => import('@/pages/admin/listing-details-page').then((module) => ({ default: module.AdminListingDetailsPage })))
const AdminListingsPage = lazy(() => import('@/pages/admin/listings-page').then((module) => ({ default: module.AdminListingsPage })))
const AdminNewListingPage = lazy(() => import('@/pages/admin/new-listing-page').then((module) => ({ default: module.AdminNewListingPage })))
const AdminLocationsPage = lazy(() => import('@/pages/admin/locations-page').then((module) => ({ default: module.AdminLocationsPage })))
const AdminLogsPage = lazy(() => import('@/pages/admin/logs-page').then((module) => ({ default: module.AdminLogsPage })))
const AdminMaterialsPage = lazy(() => import('@/pages/admin/materials-page').then((module) => ({ default: module.AdminMaterialsPage })))
const AdminOverviewPage = lazy(() => import('@/pages/admin/overview-page').then((module) => ({ default: module.AdminOverviewPage })))
const AdminPricingPage = lazy(() => import('@/pages/admin/pricing-page').then((module) => ({ default: module.AdminPricingPage })))
const AdminScrapPricesPage = lazy(() => import('@/pages/admin/scrap-prices-page').then((module) => ({ default: module.AdminScrapPricesPage })))
const AdminFeaturedPaymentsPage = lazy(() => import('@/pages/admin/featured-payments-page').then((module) => ({ default: module.AdminFeaturedPaymentsPage })))
const AdminQuestionsPage = lazy(() => import('@/pages/admin/questions-page').then((module) => ({ default: module.AdminQuestionsPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/notifications-page').then((module) => ({ default: module.AdminNotificationsPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings-page').then((module) => ({ default: module.AdminSettingsPage })))
const AdminSupportTicketsPage = lazy(() => import('@/pages/admin/support-tickets-page').then((module) => ({ default: module.AdminSupportTicketsPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/users-page').then((module) => ({ default: module.AdminUsersPage })))
const AboutPage = lazy(() => import('@/pages/public/about-page').then((module) => ({ default: module.AboutPage })))
const BlogPage = lazy(() => import('@/pages/public/blog-page').then((module) => ({ default: module.BlogPage })))
const BlogPostPage = lazy(() => import('@/pages/public/blog-post-page').then((module) => ({ default: module.BlogPostPage })))
const CategoriesPage = lazy(() => import('@/pages/public/categories-page').then((module) => ({ default: module.CategoriesPage })))
const CategoryDetailsPage = lazy(() => import('@/pages/public/category-details-page').then((module) => ({ default: module.CategoryDetailsPage })))
const ContactPage = lazy(() => import('@/pages/public/contact-page').then((module) => ({ default: module.ContactPage })))
const HomePage = lazy(() => import('@/pages/public/home-page').then((module) => ({ default: module.HomePage })))
const ListingDetailsPage = lazy(() => import('@/pages/public/listing-details-page').then((module) => ({ default: module.ListingDetailsPage })))
const ListingsPage = lazy(() => import('@/pages/public/listings-page').then((module) => ({ default: module.ListingsPage })))
const PricingPage = lazy(() => import('@/pages/public/pricing-page').then((module) => ({ default: module.PricingPage })))
const ScrapPricesPage = lazy(() => import('@/pages/public/scrap-prices-page').then((module) => ({ default: module.ScrapPricesPage })))
const SupportPage = lazy(() => import('@/pages/public/support-page').then((module) => ({ default: module.SupportPage })))
const NotFoundPage = lazy(() => import('@/pages/shared/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const SupportTicketDetailPage = lazy(() => import('@/pages/shared/support-ticket-detail-page').then((module) => ({ default: module.SupportTicketDetailPage })))

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoadingScreen />}>{element}</Suspense>
}

export const routes: RouteObject[] = [
  {
    path: paths.public.home,
    element: <PublicLayout />,
    errorElement: <RouteErrorScreen />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      {
        path: 'anuncios',
        element: withSuspense(<ListingsPage />),
      },
      {
        path: 'anuncios/:slug',
        element: withSuspense(<ListingDetailsPage />),
      },
      {
        path: 'categorias',
        element: withSuspense(<CategoriesPage />),
      },
      {
        path: 'categorias/:slug',
        element: withSuspense(<CategoryDetailsPage />),
      },
      {
        path: 'tabela-de-precos',
        element: withSuspense(<PricingPage />),
      },
      {
        path: 'tabela-de-preco-do-ferro-velho',
        element: withSuspense(<ScrapPricesPage />),
      },
      {
        path: 'blog',
        element: withSuspense(<BlogPage />),
      },
      {
        path: 'blog/:slug',
        element: withSuspense(<BlogPostPage />),
      },
      {
        path: 'sobre',
        element: withSuspense(<AboutPage />),
      },
      {
        path: 'contato',
        element: withSuspense(<ContactPage />),
      },
      {
        path: 'suporte',
        element: withSuspense(<SupportPage />),
      },
      {
        path: 'login',
        element: (
          <GuestGuard>
            {withSuspense(<LoginPage />)}
          </GuestGuard>
        ),
      },
      {
        path: 'cadastro',
        element: (
          <GuestGuard>
            {withSuspense(<RegisterPage />)}
          </GuestGuard>
        ),
      },
      {
        path: 'recuperar-senha',
        element: withSuspense(<ForgotPasswordPage />),
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
    errorElement: <RouteErrorScreen />,
    children: [
      {
        index: true,
        element: withSuspense(<AppOverviewPage />),
      },
      {
        path: 'anuncios',
        element: withSuspense(<AppListingsPage />),
      },
      {
        path: 'anuncios/novo',
        element: withSuspense(<AppNewListingPage />),
      },
      {
        path: 'anuncios/:id/editar',
        element: withSuspense(<AppEditListingPage />),
      },
      {
        path: 'perguntas',
        element: withSuspense(<AppQuestionsPage />),
      },
      {
        path: 'notificacoes',
        element: withSuspense(<AppNotificationsPage />),
      },
      {
        path: 'suporte',
        element: withSuspense(<AppSupportTicketsPage />),
      },
      {
        path: 'suporte/:id',
        element: withSuspense(<SupportTicketDetailPage />),
      },
      {
        path: 'perfil',
        element: withSuspense(<AppProfilePage />),
      },
      {
        path: 'configuracoes',
        element: withSuspense(<AppSettingsPage />),
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
    errorElement: <RouteErrorScreen />,
    children: [
      {
        index: true,
        element: withSuspense(<AdminOverviewPage />),
      },
      {
        path: 'anuncios',
        element: withSuspense(<AdminListingsPage />),
      },
      {
        path: 'anuncios/novo',
        element: withSuspense(<AdminNewListingPage />),
      },
      {
        path: 'anuncios/:id/editar',
        element: withSuspense(<AdminEditListingPage />),
      },
      {
        path: 'anuncios/:id',
        element: withSuspense(<AdminListingDetailsPage />),
      },
      {
        path: 'perguntas',
        element: withSuspense(<AdminQuestionsPage />),
      },
      {
        path: 'usuarios',
        element: withSuspense(<AdminUsersPage />),
      },
      {
        path: 'estatisticas',
        element: withSuspense(<AdminAnalyticsPage />),
      },
      {
        path: 'contato',
        element: withSuspense(<AdminContactMessagesPage />),
      },
      {
        path: 'suporte',
        element: withSuspense(<AdminSupportTicketsPage />),
      },
      {
        path: 'notificacoes',
        element: withSuspense(<AdminNotificationsPage />),
      },
      {
        path: 'suporte/:id',
        element: withSuspense(<SupportTicketDetailPage />),
      },
      {
        path: 'categorias',
        element: withSuspense(<AdminCategoriesPage />),
      },
      {
        path: 'materiais',
        element: withSuspense(<AdminMaterialsPage />),
      },
      {
        path: 'localidades',
        element: withSuspense(<AdminLocationsPage />),
      },
      {
        path: 'blog',
        element: withSuspense(<AdminBlogPage />),
      },
      {
        path: 'pagamentos',
        element: withSuspense(<AdminFeaturedPaymentsPage />),
      },
      {
        path: 'precos',
        element: withSuspense(<AdminPricingPage />),
      },
      {
        path: 'preco-das-sucatas',
        element: withSuspense(<AdminScrapPricesPage />),
      },
      {
        path: 'configuracoes',
        element: withSuspense(<AdminSettingsPage />),
      },
      {
        path: 'logs',
        element: withSuspense(<AdminLogsPage />),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
    errorElement: <RouteErrorScreen />,
  },
]
