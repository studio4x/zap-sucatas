import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronUp, MapPin, MessageSquareQuote, Package, Phone, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { FeaturedListingsSection } from '@/components/public/featured-listings-section'
import { ListingGallery } from '@/components/public/listing-gallery'
import { PublicEmptyState } from '@/components/public/public-empty-state'
import { SellerCard } from '@/components/public/seller-card'
import { QuestionThreadCard } from '@/components/questions/question-thread-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sendMagicLink, signInWithPassword, signUp } from '@/domains/auth/api'
import { getAuthErrorMessage } from '@/domains/auth/error-messages'
import { blogContentHasHtml } from '@/domains/blog/utils'
import {
  fetchPublicListingPreviewById,
  fetchPublicListingBySlug,
  fetchRelatedPublicListingsByCategory,
} from '@/domains/listings/api'
import { formatListingDate } from '@/domains/listings/utils'
import {
  createListingQuestion,
  fetchPublicQuestionsByListing,
  fetchQuestionSettings,
} from '@/domains/questions/api'
import { useAuth } from '@/hooks/use-auth'

function parseCommercialPrice(priceLabel: string | null) {
  const label = (priceLabel ?? '').trim()
  if (!label) {
    return { type: 'Sob consulta', value: null as string | null }
  }

  const separatorIndex = label.indexOf(':')
  if (separatorIndex === -1) {
    return { type: label, value: null as string | null }
  }

  const type = label.slice(0, separatorIndex).trim() || 'Sob consulta'
  const value = label.slice(separatorIndex + 1).trim() || null
  return { type, value }
}

function normalizeListingRichText(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
}

function toPhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

function buildWhatsappUrl(phone: string, listingTitle: string) {
  const digits = toPhoneDigits(phone)
  if (!digits) {
    return '#'
  }
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  const message = `Olá! Tenho interesse no anúncio "${listingTitle}" da Zap Sucatas.`
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.47 0 .1 5.37.1 11.95c0 2.1.55 4.16 1.6 5.98L0 24l6.23-1.64a11.9 11.9 0 0 0 5.7 1.45h.01c6.58 0 11.95-5.37 11.95-11.96 0-3.19-1.24-6.19-3.37-8.37Zm-8.58 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.7.97.99-3.6-.24-.37a9.87 9.87 0 0 1-1.51-5.23c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.14 1.03 7.01 2.9a9.86 9.86 0 0 1 2.91 7.03c0 5.49-4.46 9.95-9.95 9.95Zm5.45-7.44c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.88-.79-1.48-1.75-1.66-2.05-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.48.71.3 1.27.48 1.7.61.71.23 1.35.2 1.85.12.57-.08 1.8-.73 2.06-1.44.25-.71.25-1.31.17-1.44-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  )
}

export function ListingDetailsPage() {
  const { id = '', slug = '' } = useParams()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [questionText, setQuestionText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authFullName, setAuthFullName] = useState('')
  const [authConfirmPassword, setAuthConfirmPassword] = useState('')
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const questionsSectionRef = useRef<HTMLDivElement | null>(null)

  const isAdminPreviewMode = Boolean(id)
  const canUseAdminPreview = isAdminPreviewMode && isAuthenticated && user?.role === 'admin'

  const listingQuery = useQuery({
    queryKey: ['listing', 'public', isAdminPreviewMode ? `preview:${id}` : `slug:${slug}`],
    queryFn: () => {
      if (isAdminPreviewMode) {
        if (!canUseAdminPreview) {
          throw new Error('Somente administradores podem visualizar anúncios em revisao no site público.')
        }
        return fetchPublicListingPreviewById(id)
      }
      return fetchPublicListingBySlug(slug)
    },
    enabled: isAdminPreviewMode ? Boolean(id) : Boolean(slug),
  })

  const relatedListingsQuery = useQuery({
    queryKey: ['listings', 'public', 'related', listingQuery.data?.id],
    queryFn: () =>
      fetchRelatedPublicListingsByCategory({
        categoryId: listingQuery.data?.categoryId ?? '',
        excludeListingId: listingQuery.data?.id ?? '',
        limit: 3,
      }),
    enabled: Boolean(listingQuery.data?.id && listingQuery.data?.categoryId),
  })

  const settingsQuery = useQuery({
    queryKey: ['question-settings'],
    queryFn: fetchQuestionSettings,
  })

  const questionsQuery = useQuery({
    queryKey: ['questions', 'public', listingQuery.data?.id],
    queryFn: () => fetchPublicQuestionsByListing(listingQuery.data?.id ?? ''),
    enabled: Boolean(listingQuery.data?.id),
  })

  const createQuestionMutation = useMutation({
    mutationFn: () =>
      createListingQuestion({
        guestEmail: isAuthenticated ? undefined : guestEmail,
        guestName: isAuthenticated ? undefined : guestName,
        listingId: listingQuery.data?.id ?? '',
        profileId: isAuthenticated ? user?.profileId ?? undefined : undefined,
        questionText,
      }),
    onSuccess: async () => {
      setFeedback('Pergunta enviada com sucesso.')
      setQuestionText('')
      setGuestName('')
      setGuestEmail('')
      await queryClient.invalidateQueries({
        queryKey: ['questions', 'public', listingQuery.data?.id],
      })
    },
    onError: (error) => {
      setFeedback(
        error instanceof Error ? error.message : 'Não foi possível enviar a pergunta no momento.',
      )
    },
  })

  const canAskAsGuest = settingsQuery.data?.allowGuestQuestions ?? false
  const canAskQuestion = isAuthenticated ? user?.status === 'active' : canAskAsGuest
  const authRedirectPath = isAdminPreviewMode ? `/anuncios/preview/${id}?ask=1` : `/anuncios/${slug}?ask=1`

  useEffect(() => {
    if (!isAuthenticated || user?.status !== 'active') {
      return
    }

    const currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.get('ask') !== '1') {
      return
    }

    currentUrl.searchParams.delete('ask')
    window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)

    setIsQuestionFormOpen(true)
    questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isAuthenticated, user?.status])

  const questionValidationMessage = useMemo(() => {
    if (questionText.trim().length < 10) {
      return 'A pergunta precisa ter pelo menos 10 caracteres.'
    }

    if (!isAuthenticated && canAskAsGuest) {
      if (guestName.trim().length < 2) {
        return 'Informe seu nome.'
      }

      if (!guestEmail.includes('@')) {
        return 'Informe um e-mail válido.'
      }
    }

    return null
  }, [canAskAsGuest, guestEmail, guestName, isAuthenticated, questionText])

  if (listingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando página do anúncio...
        </CardContent>
      </Card>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Não foi possível carregar o anúncio solicitado.
        </CardContent>
      </Card>
    )
  }

  const listing = listingQuery.data
  const commercialPrice = parseCommercialPrice(listing.priceLabel)
  const normalizedDescription = normalizeListingRichText(listing.description)
  const descriptionHasHtml = blogContentHasHtml({ raw: normalizedDescription })
  const descriptionContent = normalizedDescription
  const canOpenQuestionFlow = isAuthenticated && user?.status === 'active'

  async function handleInlineLogin() {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage('Informe e-mail e senha para entrar.')
      return
    }

    setAuthMessage(null)
    setIsAuthSubmitting(true)
    try {
      await signInWithPassword({ email: authEmail.trim(), password: authPassword })
      setIsAuthModalOpen(false)
      window.location.reload()
    } catch (error) {
      setAuthMessage(getAuthErrorMessage(error, 'Falha ao autenticar.'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  async function handleInlineMagicLink() {
    if (!authEmail.trim()) {
      setAuthMessage('Informe seu e-mail para receber o link de acesso.')
      return
    }

    setAuthMessage(null)
    setIsAuthSubmitting(true)
    try {
      await sendMagicLink(authEmail.trim(), authRedirectPath)
      setAuthMessage('Link de acesso enviado. Verifique seu e-mail para concluir o login.')
    } catch (error) {
      setAuthMessage(getAuthErrorMessage(error, 'Falha ao enviar link de acesso.'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  async function handleInlineRegister() {
    if (!authFullName.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthMessage('Preencha nome, e-mail e senha para criar a conta.')
      return
    }

    if (authPassword !== authConfirmPassword) {
      setAuthMessage('A confirmação de senha não confere.')
      return
    }

    setAuthMessage(null)
    setIsAuthSubmitting(true)
    try {
      const sessionUser = await signUp(
        {
          email: authEmail.trim(),
          fullName: authFullName.trim(),
          password: authPassword,
        },
        authRedirectPath,
      )

      if (sessionUser) {
        setIsAuthModalOpen(false)
        window.location.reload()
        return
      }

      setAuthMessage(
        'Conta criada. Enviamos um e-mail para ativação. Ao ativar a conta, você será redirecionado para este anúncio com perguntas liberadas.',
      )
    } catch (error) {
      setAuthMessage(getAuthErrorMessage(error, 'Falha ao criar conta.'))
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 lg:space-y-10">
      <Button asChild variant="outline">
        <Link to={isAdminPreviewMode ? paths.admin.listings : paths.public.listings}>
          <ArrowLeft className="size-4" />
          {isAdminPreviewMode ? 'Voltar para anúncios' : 'Voltar ao catálogo'}
        </Link>
      </Button>

      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="h-full overflow-hidden rounded-[2.25rem] border border-border bg-white">
          <ListingGallery images={listing.images} listingTitle={listing.title} />
        </div>
        <div className="h-full rounded-[1.9rem] bg-[linear-gradient(180deg,rgba(19,54,40,0.96),rgba(12,34,25,0.98))] p-8 text-white shadow-[0_30px_72px_-40px_rgba(12,34,25,0.88)] md:p-10">
          <div className="flex h-full flex-col">
            <div className="space-y-4 pb-5">
              <div className="flex flex-wrap gap-2">
                {listing.categoryName ? (
                  <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100" variant="outline">
                    {listing.categoryName}
                  </Badge>
                ) : null}
                {listing.materialName ? (
                  <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100" variant="outline">
                    {listing.materialName}
                  </Badge>
                ) : null}
                <Badge className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100" variant="outline">
                  Anúncio moderado
                </Badge>
              </div>
              <h1 className="break-words font-display text-5xl leading-[0.95] tracking-[-0.04em] text-white [overflow-wrap:anywhere]">
                {listing.title}
              </h1>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                Janela comercial
              </p>
              <p className="text-3xl font-semibold tracking-[-0.03em] text-white">
                {commercialPrice.type}
              </p>
              {commercialPrice.value ? <p className="text-lg font-medium text-emerald-100">{commercialPrice.value}</p> : null}
              <p className="text-sm leading-7 text-emerald-50/78">
                Use os dados técnicos e as perguntas públicas para validar o lote antes do contato.
              </p>
            </div>

            <div className="mt-5 space-y-3 border-y border-white/10 py-4 text-sm text-white/86">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-300" />
                {listing.city} - {listing.state}
              </p>
              {listing.materialName ? (
                <p className="flex items-center gap-2">
                  <Package className="size-4 text-emerald-300" />
                  {listing.materialName}
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                Publicado em {formatListingDate(listing.publishedAt)}
              </p>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2 text-emerald-100">
                <MessageSquareQuote className="size-4 text-emerald-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">Prévia de conteúdo</p>
              </div>
              <p className="line-clamp-4 text-sm leading-6 text-emerald-50/88">
                {listing.summary || 'Sem resumo comercial preenchido para este anúncio no momento.'}
              </p>
            </div>

            <div className="mt-4 grid gap-3 pt-1">
              {listing.contactPhone ? (
                <Button asChild className="h-12 rounded-[1.1rem] bg-white !text-slate-950 hover:bg-white/90" style={{ color: '#020617' }}>
                  <a
                    href={
                      listing.contactPhoneIsWhatsapp
                        ? buildWhatsappUrl(listing.contactPhone, listing.title)
                        : `tel:${listing.contactPhone}`
                    }
                    rel={listing.contactPhoneIsWhatsapp ? 'noopener noreferrer' : undefined}
                    target={listing.contactPhoneIsWhatsapp ? '_blank' : undefined}
                  >
                    {listing.contactPhoneIsWhatsapp ? <WhatsAppIcon className="size-4" /> : <Phone className="size-4" />}
                    {listing.contactPhoneIsWhatsapp
                      ? 'Envie uma mensagem para o anunciante'
                      : 'Ligar para o anunciante'}
                  </a>
                </Button>
              ) : null}
              <Button asChild className="h-12 rounded-[1.1rem] border-white/20 bg-transparent !text-white hover:bg-white/10 hover:!text-white" style={{ color: '#ffffff' }} variant="outline">
                {canOpenQuestionFlow ? (
                  <button
                    onClick={() => {
                      setIsQuestionFormOpen(true)
                      questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    type="button"
                  >
                    Enviar pergunta
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('login')
                      setAuthMessage(null)
                      setIsAuthModalOpen(true)
                    }}
                    type="button"
                  >
                    Entrar para perguntar ao vendedor
                  </button>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/80 bg-white/85 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Localidade
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {listing.city} - {listing.state}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/80 bg-white/85 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Publicado em
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {formatListingDate(listing.publishedAt)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/80 bg-white/85 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Tipo de preço
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {commercialPrice.type}
              </p>
              {commercialPrice.value ? (
                <p className="mt-1 text-sm text-muted-foreground">{commercialPrice.value}</p>
              ) : null}
            </div>
          </div>

          <Card className="rounded-[1.9rem] border-[#d8e3d8] bg-white shadow-[0_24px_56px_-44px_rgba(19,33,23,0.28)]">
            <CardContent className="space-y-6 p-6 md:p-7">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
                  Descrição comercial
                </p>
                {descriptionHasHtml ? (
                  <article
                    className="listing-rich-content max-w-none text-foreground/92 [overflow-wrap:anywhere]"
                    dangerouslySetInnerHTML={{ __html: descriptionContent }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm leading-8 text-foreground/92 [overflow-wrap:anywhere]">
                    {descriptionContent}
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fafcf9_0%,#f5f8f4_100%)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Categoria
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {listing.categoryName ?? 'Não informada'}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fafcf9_0%,#f5f8f4_100%)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Material principal
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {listing.materialName ?? 'Não informado'}
                  </p>
                </div>
              </div>

              {listing.attributes.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Ficha técnica do anúncio</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {listing.attributes.map((attribute) => (
                      <div
                        key={attribute.id}
                        className="rounded-[1.4rem] border border-border bg-background/80 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {attribute.attributeLabel}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-foreground">
                          {attribute.attributeValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

        </div>

        <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <SellerCard
            contactName={listing.contactName}
            contactPhone={listing.contactPhone}
            contactPhoneIsWhatsapp={listing.contactPhoneIsWhatsapp}
            publishedAtLabel={formatListingDate(listing.publishedAt)}
            listingTitle={listing.title}
          />
        </div>
      </div>

      <div ref={questionsSectionRef}>
        <Card className="overflow-hidden rounded-[1.9rem] border-0 bg-white shadow-[0_24px_56px_-44px_rgba(19,33,23,0.28)]">
          <CardContent className="space-y-5 p-6 md:p-7">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
              Perguntas
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">Perguntas e respostas</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Perguntas públicas ajudam a acelerar a negociação e dão mais contexto para quem está avaliando o anúncio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsQuestionFormOpen((current) => !current)}
              type="button"
              variant={isQuestionFormOpen ? 'outline' : 'default'}
            >
              {isQuestionFormOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              Enviar pergunta
            </Button>
            {!canAskQuestion && !isAuthenticated ? (
              <Button asChild type="button" variant="outline">
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setAuthMessage(null)
                    setIsAuthModalOpen(true)
                  }}
                  type="button"
                >
                  Entrar para perguntar ao vendedor
                </button>
              </Button>
            ) : null}
          </div>

          {isQuestionFormOpen ? (
            !canAskQuestion ? (
              <p className="text-sm leading-7 text-muted-foreground">
                {isAuthenticated
                  ? 'Sua conta ainda não pode interagir com perguntas neste momento.'
                  : 'Faça login para perguntar sobre este anúncio e acompanhar a resposta do vendedor.'}
              </p>
            ) : (
              <div className="space-y-4 rounded-[1.35rem] border border-border bg-[linear-gradient(180deg,#fafcf9_0%,#f5f8f4_100%)] p-4">
                {!isAuthenticated && canAskAsGuest ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      onChange={(event) => setGuestName(event.target.value)}
                      placeholder="Seu nome"
                      value={guestName}
                    />
                    <Input
                      onChange={(event) => setGuestEmail(event.target.value)}
                      placeholder="Seu e-mail"
                      type="email"
                      value={guestEmail}
                    />
                  </div>
                ) : null}

                <Textarea
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="Descreva sua duvida sobre lote, condicao, retirada ou negociação."
                  value={questionText}
                />

                {feedback ? <p className="text-sm text-primary">{feedback}</p> : null}
                {questionValidationMessage ? (
                  <p className="text-sm text-muted-foreground">{questionValidationMessage}</p>
                ) : null}

                <Button
                  className="w-full md:w-auto"
                  disabled={createQuestionMutation.isPending || Boolean(questionValidationMessage)}
                  onClick={() => {
                    setFeedback(null)
                    createQuestionMutation.mutate()
                  }}
                  type="button"
                >
                  {createQuestionMutation.isPending ? 'Enviando...' : 'Enviar pergunta'}
                </Button>
              </div>
            )
          ) : null}

          <div className="space-y-4 border-t border-border pt-5">
            {questionsQuery.data?.length ? (
              questionsQuery.data.map((question) => (
                <QuestionThreadCard key={question.id} question={question} />
              ))
            ) : (
              <PublicEmptyState
                description="Ainda não há perguntas publicadas para este anúncio. Você pode ser a primeira pessoa a iniciar a conversa."
                icon={MessageSquareQuote}
                title="Sem perguntas publicadas"
              />
            )}
          </div>
          </CardContent>
        </Card>
      </div>

      {relatedListingsQuery.data?.length ? (
        <FeaturedListingsSection
          description="Outros anúncios aprovados na mesma categoria para ampliar comparação e navegação comercial."
          eyebrow="Relacionados"
          listings={relatedListingsQuery.data}
          title="Mais anúncios desta categoria"
        />
      ) : null}

      {isAuthModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
          <button
            aria-label="Fechar autenticação"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setIsAuthModalOpen(false)}
            type="button"
          />
          <div className="relative w-full max-w-lg rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <Button onClick={() => setAuthMode('login')} size="sm" type="button" variant={authMode === 'login' ? 'default' : 'outline'}>
                Entrar
              </Button>
              <Button onClick={() => setAuthMode('register')} size="sm" type="button" variant={authMode === 'register' ? 'default' : 'outline'}>
                Criar conta
              </Button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Entrar para perguntar ao vendedor</h3>
                <Input onChange={(event) => setAuthEmail(event.target.value)} placeholder="Seu e-mail" type="email" value={authEmail} />
                <Input onChange={(event) => setAuthPassword(event.target.value)} placeholder="Sua senha" type="password" value={authPassword} />
                <div className="flex flex-wrap gap-3">
                  <Button className="flex-1" disabled={isAuthSubmitting} onClick={() => void handleInlineLogin()} type="button">
                    {isAuthSubmitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                  <Button asChild className="flex-1" type="button" variant="outline">
                    <Link to={paths.auth.forgotPassword}>Recuperar senha</Link>
                  </Button>
                </div>

                <div className="rounded-[1.25rem] border border-border bg-background/70 p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Entrar com login sem senha</h4>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Enviamos um link seguro para o seu e-mail e você volta direto para a pergunta.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button
                      className="w-full"
                      disabled={isAuthSubmitting}
                      onClick={() => void handleInlineMagicLink()}
                      type="button"
                    >
                      {isAuthSubmitting ? 'Enviando...' : 'Enviar link de acesso'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Criar conta para perguntar e negociar</h3>
                <Input onChange={(event) => setAuthFullName(event.target.value)} placeholder="Nome completo" value={authFullName} />
                <Input onChange={(event) => setAuthEmail(event.target.value)} placeholder="Seu e-mail" type="email" value={authEmail} />
                <Input onChange={(event) => setAuthPassword(event.target.value)} placeholder="Crie uma senha" type="password" value={authPassword} />
                <Input onChange={(event) => setAuthConfirmPassword(event.target.value)} placeholder="Confirme a senha" type="password" value={authConfirmPassword} />
                <Button className="w-full" disabled={isAuthSubmitting} onClick={() => void handleInlineRegister()} type="button">
                  {isAuthSubmitting ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </div>
            )}

            {authMessage ? <p className="mt-4 text-sm text-muted-foreground">{authMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
