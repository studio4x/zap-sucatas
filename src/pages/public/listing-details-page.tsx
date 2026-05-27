import { useMemo, useState } from 'react'
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
import { blogContentHasHtml, blogContentToPlainText } from '@/domains/blog/utils'
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
  return value.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ')
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

  const isAdminPreviewMode = Boolean(id)
  const canUseAdminPreview = isAdminPreviewMode && isAuthenticated && user?.role === 'admin'

  const listingQuery = useQuery({
    queryKey: ['listing', 'public', isAdminPreviewMode ? `preview:${id}` : `slug:${slug}`],
    queryFn: () => {
      if (isAdminPreviewMode) {
        if (!canUseAdminPreview) {
          throw new Error('Somente administradores podem visualizar anuncios em revisao no site publico.')
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
        error instanceof Error ? error.message : 'Nao foi possivel enviar a pergunta no momento.',
      )
    },
  })

  const canAskAsGuest = settingsQuery.data?.allowGuestQuestions ?? false
  const canAskQuestion = isAuthenticated ? user?.status === 'active' : canAskAsGuest

  const questionValidationMessage = useMemo(() => {
    if (questionText.trim().length < 10) {
      return 'A pergunta precisa ter pelo menos 10 caracteres.'
    }

    if (!isAuthenticated && canAskAsGuest) {
      if (guestName.trim().length < 2) {
        return 'Informe seu nome.'
      }

      if (!guestEmail.includes('@')) {
        return 'Informe um e-mail valido.'
      }
    }

    return null
  }, [canAskAsGuest, guestEmail, guestName, isAuthenticated, questionText])

  if (listingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando pagina do anuncio...
        </CardContent>
      </Card>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Nao foi possivel carregar o anuncio solicitado.
        </CardContent>
      </Card>
    )
  }

  const listing = listingQuery.data
  const commercialPrice = parseCommercialPrice(listing.priceLabel)
  const normalizedDescription = normalizeListingRichText(listing.description)
  const descriptionHasHtml = blogContentHasHtml({ raw: normalizedDescription })
  const descriptionContent = blogContentToPlainText({ raw: normalizedDescription })

  return (
    <div className="space-y-8 lg:space-y-10">
      <Button asChild variant="outline">
        <Link to={isAdminPreviewMode ? paths.admin.listings : paths.public.listings}>
          <ArrowLeft className="size-4" />
          {isAdminPreviewMode ? 'Voltar para anúncios' : 'Voltar ao catalogo'}
        </Link>
      </Button>

      <section className="overflow-hidden rounded-[2.25rem] border border-border bg-white">
        <div className="grid gap-6 px-5 py-6 md:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:px-8 lg:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {listing.categoryName ? (
                <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                  {listing.categoryName}
                </Badge>
              ) : null}
              {listing.materialName ? (
                <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                  {listing.materialName}
                </Badge>
              ) : null}
              <Badge className="border-primary/15 bg-primary/5 text-primary" variant="outline">
                Anuncio moderado
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl break-words font-display text-4xl leading-[0.95] tracking-[-0.045em] text-foreground [overflow-wrap:anywhere] sm:text-[3.2rem]">
                {listing.title}
              </h1>
              <p className="max-w-3xl break-words text-base leading-8 text-muted-foreground [overflow-wrap:anywhere]">
                {listing.summary || 'Página comercial com galeria, ficha técnica, localidade e perguntas para apoiar negociação real no setor de sucatas.'}
              </p>
            </div>
            <ListingGallery images={listing.images} listingTitle={listing.title} />
          </div>

          <div className="h-fit self-start rounded-[1.9rem] bg-[linear-gradient(180deg,rgba(19,54,40,0.96),rgba(12,34,25,0.98))] p-5 text-white shadow-[0_30px_72px_-40px_rgba(12,34,25,0.88)] lg:sticky lg:top-24">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                  Janela comercial
                </p>
                <p className="text-4xl font-semibold tracking-[-0.04em] text-white">
                  {commercialPrice.type}
                </p>
                {commercialPrice.value ? <p className="text-lg font-medium text-emerald-100">{commercialPrice.value}</p> : null}
                <p className="text-sm leading-7 text-emerald-50/78">
                  Use os dados tecnicos e as perguntas publicas para validar o lote antes do contato.
                </p>
              </div>

              <div className="space-y-3 border-y border-white/10 py-4 text-sm text-white/86">
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

              <div className="grid gap-3">
                {listing.contactPhone ? (
                  <Button asChild className="h-12 rounded-[1.1rem] bg-white !text-slate-950 hover:bg-white/90" style={{ color: '#020617' }}>
                    <a href={`tel:${listing.contactPhone}`}>
                      <Phone className="size-4" />
                      Ligar para o anunciante
                    </a>
                  </Button>
                ) : null}
                <Button asChild className="h-12 rounded-[1.1rem] border-white/20 bg-transparent !text-white hover:bg-white/10 hover:!text-white" style={{ color: '#ffffff' }} variant="outline">
                  <Link to={paths.auth.login}>Entrar para perguntar</Link>
                </Button>
              </div>
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
                Tipo de preco
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
                  Descricao comercial
                </p>
                {descriptionHasHtml ? (
                  <article className="prose prose-zinc max-w-none text-foreground/92 [overflow-wrap:anywhere] prose-p:break-words prose-p:leading-8 prose-p:[overflow-wrap:anywhere] prose-li:leading-8 prose-li:[overflow-wrap:anywhere]">
                    <div dangerouslySetInnerHTML={{ __html: descriptionContent }} />
                  </article>
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
                    {listing.categoryName ?? 'Nao informada'}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#fafcf9_0%,#f5f8f4_100%)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Material principal
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {listing.materialName ?? 'Nao informado'}
                  </p>
                </div>
              </div>

              {listing.attributes.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Ficha tecnica do anuncio</p>
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
            publishedAtLabel={formatListingDate(listing.publishedAt)}
          />
        </div>
      </div>

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
                <Link to={paths.auth.login}>Entrar para perguntar</Link>
              </Button>
            ) : null}
          </div>

          {isQuestionFormOpen ? (
            !canAskQuestion ? (
              <p className="text-sm leading-7 text-muted-foreground">
                {isAuthenticated
                  ? 'Sua conta ainda nao pode interagir com perguntas neste momento.'
                  : 'Faca login para perguntar sobre este anuncio e acompanhar a resposta do anunciante.'}
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
                  placeholder="Descreva sua duvida sobre lote, condicao, retirada ou negociacao."
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

      {relatedListingsQuery.data?.length ? (
        <FeaturedListingsSection
          description="Outros anuncios aprovados na mesma categoria para ampliar comparacao e navegacao comercial."
          eyebrow="Relacionados"
          listings={relatedListingsQuery.data}
          title="Mais anuncios desta categoria"
        />
      ) : null}
    </div>
  )
}
