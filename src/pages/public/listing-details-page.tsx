import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Phone } from 'lucide-react'
import { paths } from '@/app/paths'
import { ListingStatusBadge } from '@/components/listings/listing-status-badge'
import { QuestionThreadCard } from '@/components/questions/question-thread-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fetchPublicListingBySlug } from '@/domains/listings/api'
import { createListingQuestion, fetchPublicQuestionsByListing, fetchQuestionSettings } from '@/domains/questions/api'
import { formatListingDate } from '@/domains/listings/utils'
import { useAuth } from '@/hooks/use-auth'

export function ListingDetailsPage() {
  const { slug = '' } = useParams()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [questionText, setQuestionText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const listingQuery = useQuery({
    queryKey: ['listing', 'public', slug],
    queryFn: () => fetchPublicListingBySlug(slug),
    enabled: Boolean(slug),
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions', 'public', listingQuery.data?.id] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'owner'] }),
        queryClient.invalidateQueries({ queryKey: ['questions', 'admin'] }),
      ])
    },
  })

  useEffect(() => {
    setActiveImageIndex(0)
  }, [slug])

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
          Carregando detalhe do anuncio...
        </CardContent>
      </Card>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Card className="border-rose-200/70 bg-rose-50">
        <CardContent className="p-6 text-sm text-rose-900">
          Nao foi possivel carregar o anuncio solicitado.
        </CardContent>
      </Card>
    )
  }

  const listing = listingQuery.data
  const images = listing.images
  const activeImage = images[activeImageIndex] ?? images[0]

  return (
    <section className="space-y-6">
      <Button asChild variant="outline">
        <Link to={paths.public.listings}>
          <ArrowLeft className="size-4" />
          Voltar ao catalogo
        </Link>
      </Button>

      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <ListingStatusBadge status={listing.status} />
          {listing.categoryName ? (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {listing.categoryName}
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">{listing.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {listing.summary || listing.description}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-[16/10] bg-muted">
              {activeImage ? (
                <img alt={activeImage.altText ?? listing.title} className="h-full w-full object-cover" src={activeImage.publicUrl} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem imagens
                </div>
              )}
            </div>

            {images.length > 1 ? (
              <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    className="aspect-square overflow-hidden rounded-3xl border border-border/70 bg-muted transition hover:border-primary/40"
                    onClick={() => setActiveImageIndex(index)}
                    type="button"
                  >
                    <img alt={image.altText ?? listing.title} className="h-full w-full object-cover" src={image.publicUrl} />
                  </button>
                ))}
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Descricao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                {listing.description}
              </p>

              {listing.attributes.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {listing.attributes.map((attribute) => (
                    <div key={attribute.id} className="rounded-3xl border border-border/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {attribute.attributeLabel}
                      </p>
                      <p className="mt-2 text-sm text-foreground">{attribute.attributeValue}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas e respostas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando perguntas publicadas...</p>
              ) : null}

              {(questionsQuery.data ?? []).map((question) => (
                <QuestionThreadCard key={question.id} question={question} />
              ))}

              {!questionsQuery.isLoading && (questionsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda nao ha perguntas publicadas para este anuncio.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo comercial</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-4" />
                {listing.city} - {listing.state}
              </p>
              {listing.materialName ? (
                <p className="flex items-center gap-2">
                  <Package className="size-4" />
                  {listing.materialName}
                </p>
              ) : null}
              {listing.contactPhone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {listing.contactPhone}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-foreground">Contato:</span>{' '}
                {listing.contactName ?? 'Nao informado'}
              </p>
              <p>
                <span className="font-medium text-foreground">Preco:</span>{' '}
                {listing.priceLabel ?? 'Sob consulta'}
              </p>
              <p>
                <span className="font-medium text-foreground">Publicado:</span>{' '}
                {formatListingDate(listing.publishedAt)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fazer uma pergunta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canAskQuestion ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isAuthenticated
                      ? 'Sua conta ainda nao pode interagir com perguntas.'
                      : 'Para enviar uma pergunta, faca login na plataforma.'}
                  </p>
                  {!isAuthenticated ? (
                    <Button asChild>
                      <Link to={paths.auth.login}>Entrar para perguntar</Link>
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
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
                    placeholder="Escreva sua duvida sobre este anuncio."
                    value={questionText}
                  />

                  {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
