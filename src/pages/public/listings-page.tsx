import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { PublicListingCard } from '@/components/listings/public-listing-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchListingReferences, fetchPublicListings } from '@/domains/listings/api'

export function ListingsPage() {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')

  const referencesQuery = useQuery({
    queryKey: ['listing-references'],
    queryFn: fetchListingReferences,
  })

  const listingsQuery = useQuery({
    queryKey: ['listings', 'public', { categoryId, city, query, state }],
    queryFn: () =>
      fetchPublicListings({
        categoryId: categoryId || undefined,
        city: city || undefined,
        query: query || undefined,
        state: state || undefined,
      }),
  })

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Catalogo
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-foreground">
          Marketplace publico de anuncios aprovados
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Consulte anuncios moderados, filtre por categoria e localizacao e entre no detalhe para
          analisar disponibilidade e contato.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-11"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar anuncio, cidade ou descricao"
              value={query}
            />
          </div>

          <select
            className="flex h-11 w-full rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
          >
            <option value="">Todas as categorias</option>
            {(referencesQuery.data?.categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input maxLength={2} onChange={(event) => setState(event.target.value.toUpperCase())} placeholder="UF" value={state} />
            <Input onChange={(event) => setCity(event.target.value)} placeholder="Cidade" value={city} />
          </div>
        </CardContent>
      </Card>

      {listingsQuery.isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Carregando anuncios publicos...
          </CardContent>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="border-rose-200/70 bg-rose-50">
          <CardContent className="p-6 text-sm text-rose-900">
            Nao foi possivel carregar o catalogo publico.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {(listingsQuery.data ?? []).map((listing) => (
          <PublicListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {!listingsQuery.isLoading && (listingsQuery.data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum anuncio aprovado foi encontrado com os filtros atuais.
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
