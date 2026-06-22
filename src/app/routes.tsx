import { Suspense, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '@/app/guards/auth-guard'
import { GuestGuard } from '@/app/guards/guest-guard'
import { RoleGuard } from '@/app/guards/role-guard'
import { AdminLayout } from '@/app/layouts/admin-layout'
import { DashboardLayout } from '@/app/layouts/dashboard-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import { paths } from '@/app/paths'
import { PublicPageGuard } from '@/app/guards/public-page-guard'
import { RouteErrorScreen } from '@/components/shared/route-error-screen'
import { RouteLoadingScreen } from '@/components/shared/route-loading-screen'
import { lazyWithRetry } from '@/lib/lazy-with-retry'

const ForgotPasswordPage = lazyWithRetry(() => import('@/pages/auth/forgot-password-page').then((module) => ({ default: module.ForgotPasswordPage })))
const LoginPage = lazyWithRetry(() => import('@/pages/auth/login-page').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazyWithRetry(() => import('@/pages/auth/register-page').then((module) => ({ default: module.RegisterPage })))
const AppEditListingPage = lazyWithRetry(() => import('@/pages/app/edit-listing-page').then((module) => ({ default: module.AppEditListingPage })))
const AppListingsPage = lazyWithRetry(() => import('@/pages/app/listings-page').then((module) => ({ default: module.AppListingsPage })))
const AppNewListingPage = lazyWithRetry(() => import('@/pages/app/new-listing-page').then((module) => ({ default: module.AppNewListingPage })))
const AppOverviewPage = lazyWithRetry(() => import('@/pages/app/overview-page').then((module) => ({ default: module.AppOverviewPage })))
const AppProfilePage = lazyWithRetry(() => import('@/pages/app/profile-page').then((module) => ({ default: module.AppProfilePage })))
const AppQuestionsPage = lazyWithRetry(() => import('@/pages/app/questions-page').then((module) => ({ default: module.AppQuestionsPage })))
const AppNotificationsPage = lazyWithRetry(() => import('@/pages/app/notifications-page').then((module) => ({ default: module.AppNotificationsPage })))
const AppSettingsPage = lazyWithRetry(() => import('@/pages/app/settings-page').then((module) => ({ default: module.AppSettingsPage })))
const AppSupportTicketsPage = lazyWithRetry(() => import('@/pages/app/support-tickets-page').then((module) => ({ default: module.AppSupportTicketsPage })))
const AdminBlogPage = lazyWithRetry(() => import('@/pages/admin/blog-page').then((module) => ({ default: module.AdminBlogPage })))
const AdminAnalyticsPage = lazyWithRetry(() => import('@/pages/admin/analytics-page').then((module) => ({ default: module.AdminAnalyticsPage })))
const AdminCategoriesPage = lazyWithRetry(() => import('@/pages/admin/categories-page').then((module) => ({ default: module.AdminCategoriesPage })))
const AdminContactMessagesPage = lazyWithRetry(() => import('@/pages/admin/contact-messages-page').then((module) => ({ default: module.AdminContactMessagesPage })))
const AdminEditListingPage = lazyWithRetry(() => import('@/pages/admin/edit-listing-page').then((module) => ({ default: module.AdminEditListingPage })))
const AdminListingDetailsPage = lazyWithRetry(() => import('@/pages/admin/listing-details-page').then((module) => ({ default: module.AdminListingDetailsPage })))
const AdminListingsPage = lazyWithRetry(() => import('@/pages/admin/listings-page').then((module) => ({ default: module.AdminListingsPage })))
const AdminNewListingPage = lazyWithRetry(() => import('@/pages/admin/new-listing-page').then((module) => ({ default: module.AdminNewListingPage })))
const AdminLogsPage = lazyWithRetry(() => import('@/pages/admin/logs-page').then((module) => ({ default: module.AdminLogsPage })))
const AdminMaterialsPage = lazyWithRetry(() => import('@/pages/admin/materials-page').then((module) => ({ default: module.AdminMaterialsPage })))
const AdminOverviewPage = lazyWithRetry(() => import('@/pages/admin/overview-page').then((module) => ({ default: module.AdminOverviewPage })))
const AdminPricingPage = lazyWithRetry(() => import('@/pages/admin/pricing-page').then((module) => ({ default: module.AdminPricingPage })))
const AdminScrapPricesPage = lazyWithRetry(() => import('@/pages/admin/scrap-prices-page').then((module) => ({ default: module.AdminScrapPricesPage })))
const AdminFeaturedPaymentsPage = lazyWithRetry(() => import('@/pages/admin/featured-payments-page').then((module) => ({ default: module.AdminFeaturedPaymentsPage })))
const AdminQuestionsPage = lazyWithRetry(() => import('@/pages/admin/questions-page').then((module) => ({ default: module.AdminQuestionsPage })))
const AdminNotificationsPage = lazyWithRetry(() => import('@/pages/admin/notifications-page').then((module) => ({ default: module.AdminNotificationsPage })))
const AdminSitePagesPage = lazyWithRetry(() => import('@/pages/admin/site-pages-page').then((module) => ({ default: module.AdminSitePagesPage })))
const AdminSettingsPage = lazyWithRetry(() => import('@/pages/admin/settings-page').then((module) => ({ default: module.AdminSettingsPage })))
const AdminSupportTicketsPage = lazyWithRetry(() => import('@/pages/admin/support-tickets-page').then((module) => ({ default: module.AdminSupportTicketsPage })))
const AdminTutorialsPage = lazyWithRetry(() => import('@/pages/admin/tutorials-page').then((module) => ({ default: module.AdminTutorialsPage })))
const AdminUsersPage = lazyWithRetry(() => import('@/pages/admin/users-page').then((module) => ({ default: module.AdminUsersPage })))
const AboutPage = lazyWithRetry(() => import('@/pages/public/about-page').then((module) => ({ default: module.AboutPage })))
const BlogPage = lazyWithRetry(() => import('@/pages/public/blog-page').then((module) => ({ default: module.BlogPage })))
const BlogPostPage = lazyWithRetry(() => import('@/pages/public/blog-post-page').then((module) => ({ default: module.BlogPostPage })))
const CategoriesPage = lazyWithRetry(() => import('@/pages/public/categories-page').then((module) => ({ default: module.CategoriesPage })))
const CategoryDetailsPage = lazyWithRetry(() => import('@/pages/public/category-details-page').then((module) => ({ default: module.CategoryDetailsPage })))
const ContactPage = lazyWithRetry(() => import('@/pages/public/contact-page').then((module) => ({ default: module.ContactPage })))
const HomePage = lazyWithRetry(() => import('@/pages/public/home-page').then((module) => ({ default: module.HomePage })))
const ListingDetailsPage = lazyWithRetry(() => import('@/pages/public/listing-details-page').then((module) => ({ default: module.ListingDetailsPage })))
const ListingsPage = lazyWithRetry(() => import('@/pages/public/listings-page').then((module) => ({ default: module.ListingsPage })))
const PricingPage = lazyWithRetry(() => import('@/pages/public/pricing-page').then((module) => ({ default: module.PricingPage })))
const ScrapPricesPage = lazyWithRetry(() => import('@/pages/public/scrap-prices-page').then((module) => ({ default: module.ScrapPricesPage })))
const SupportPage = lazyWithRetry(() => import('@/pages/public/support-page').then((module) => ({ default: module.SupportPage })))
const NotFoundPage = lazyWithRetry(() => import('@/pages/shared/not-found-page').then((module) => ({ default: module.NotFoundPage })))
const SupportTicketDetailPage = lazyWithRetry(() => import('@/pages/shared/support-ticket-detail-page').then((module) => ({ default: module.SupportTicketDetailPage })))

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
        element: (
          <PublicPageGuard pagePath={paths.public.home} pageTitle="Home">
            {withSuspense(<HomePage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'anuncios',
        element: (
          <PublicPageGuard pagePath={paths.public.listings} pageTitle="Anúncios">
            {withSuspense(<ListingsPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'anuncios/:slug',
        element: withSuspense(<ListingDetailsPage />),
      },
      {
        path: 'anuncios/preview/:id',
        element: withSuspense(<ListingDetailsPage />),
      },
      {
        path: 'categorias',
        element: (
          <PublicPageGuard pagePath={paths.public.categories} pageTitle="Categorias">
            {withSuspense(<CategoriesPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'categorias/:slug',
        element: withSuspense(<CategoryDetailsPage />),
      },
      {
        path: 'preco-dos-metais-lme',
        element: (
          <PublicPageGuard pagePath={paths.public.pricing} pageTitle="Cotação LME">
            {withSuspense(<PricingPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'tabela-de-precos',
        element: (
          <PublicPageGuard pagePath={paths.public.scrapPrices} pageTitle="Preços dos Metais">
            {withSuspense(<ScrapPricesPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'blog',
        element: (
          <PublicPageGuard pagePath={paths.public.blog} pageTitle="Blog">
            {withSuspense(<BlogPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'blog/:slug',
        element: (
          <PublicPageGuard pagePath={paths.public.blog} pageTitle="Blog">
            {withSuspense(<BlogPostPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'blog/preview/:id',
        element: (
          <PublicPageGuard pagePath={paths.public.blog} pageTitle="Blog">
            {withSuspense(<BlogPostPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'sobre',
        element: (
          <PublicPageGuard pagePath={paths.public.about} pageTitle="Sobre">
            {withSuspense(<AboutPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'contato',
        element: (
          <PublicPageGuard pagePath={paths.public.contact} pageTitle="Contato">
            {withSuspense(<ContactPage />)}
          </PublicPageGuard>
        ),
      },
      {
        path: 'suporte',
        element: (
          <PublicPageGuard pagePath={paths.public.support} pageTitle="Suporte">
            {withSuspense(<SupportPage />)}
          </PublicPageGuard>
        ),
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
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {withSuspense(<AppSettingsPage />)}
          </RoleGuard>
        ),
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
        path: 'tutoriais/:slug',
        element: withSuspense(<AdminTutorialsPage />),
      },
      {
        path: 'tutoriais',
        element: withSuspense(<AdminTutorialsPage />),
      },
      {
        path: 'paginas',
        element: withSuspense(<AdminSitePagesPage />),
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
