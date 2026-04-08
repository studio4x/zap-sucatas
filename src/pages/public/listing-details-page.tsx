import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Package, Phone, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { FeaturedListingsSection } from '@/components/public/featured-listings-section'
import { ListingGallery } from '@/components/public/listing-gallery'
import { ListingSidebarCard } from '@/components/public/listing-sidebar-card'
import { QuestionAnswerBlock } from '@/components/public/question-answer-block'
import { SellerCard } from '@/components/public/seller-card'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
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

export function ListingDetailsPage() {
  const { slug = '' } = useParams()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [questionText, setQuestionText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const listingQuery = useQuery({
    queryKey: ['listing', 'public', slug],
    queryFn: () => fetchPublicListingBySlug(slug),
    enabled: Boolean(slug),
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

  return (
    <div className="space-y-8 lg:space-y-10">
      <Button asChild variant="outline">
        <Link to={paths.public.listings}>
          <ArrowLeft className="size-4" />
          Voltar ao catálogo
        </Link>
      </Button>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <PublicSectionHeading
            description={listing.summary || 'Anúncio público com detalhes comerciais, atributos técnicos e perguntas para apoiar a negociação.'}
            eyebrow={listing.categoryName ?? 'Anúncio moderado'}
            title={listing.title}
          />

          <ListingGallery images={listing.images} listingTitle={listing.title} />
        </div>

        <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <ListingSidebarCard title="Resumo comercial">
            <div className="rounded-[1.5rem] border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Faixa comercial
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {listing.priceLabel ?? 'Sob consulta'}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                {listing.city} - {listing.state}
              </p>
              {listing.materialName ? (
                <p className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  {listing.materialName}
                </p>
              ) : null}
              {listing.contactPhone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  {listing.contactPhone}
                </p>
              ) : null}
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Publicado em {formatListingDate(listing.publishedAt)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {listing.contactPhone ? (
                <Button asChild>
                  <a href={`tel:${listing.contactPhone}`}>Ligar para o anunciante</a>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to={paths.auth.login}>Entrar para perguntar</Link>
              </Button>
            </div>
          </ListingSidebarCard>

          <SellerCard
            contactName={listing.contactName}
            contactPhone={listing.contactPhone}
            publishedAtLabel={formatListingDate(listing.publishedAt)}
          />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/80">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">
                Descrição do lote
              </p>
              <p className="whitespace-pre-line text-sm leading-8 text-foreground/92">
                {listing.description}
              </p>
            </div>

            {listing.attributes.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {listing.attributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="rounded-[1.5rem] border border-border bg-background/80 p-4"
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
            ) : null}
          </CardContent>
        </Card>

        <ListingSidebarCard title="Enviar uma pergunta">
          {!canAskQuestion ? (
            <div className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                {isAuthenticated
                  ? 'Sua conta ainda não pode interagir com perguntas neste momento.'
                  : 'Faça login para perguntar sobre este anúncio e acompanhar a resposta do anunciante.'}
              </p>
              {!isAuthenticated ? (
                <Button asChild>
                  <Link to={paths.auth.login}>Entrar para perguntar</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
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
                placeholder="Descreva sua dúvida sobre lote, condição, retirada ou negociação."
                value={questionText}
              />

              {feedback ? <p className="text-sm text-primary">{feedback}</p> : null}
              {questionValidationMessage ? (
                <p className="text-sm text-muted-foreground">{questionValidationMessage}</p>
              ) : null}

              <Button
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
          )}
        </ListingSidebarCard>
      </div>

      <QuestionAnswerBlock questions={questionsQuery.data ?? []} />

      {relatedListingsQuery.data?.length ? (
        <FeaturedListingsSection
          description="Outros anúncios aprovados na mesma categoria para ampliar a navegação e a comparação comercial."
          eyebrow="Relacionados"
          listings={relatedListingsQuery.data}
          title="Mais anúncios desta categoria"
        />
      ) : null}
    </div>
  )
}
