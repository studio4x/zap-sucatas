import { MapPin, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ListingCategory, ListingMaterial } from '@/domains/listings/types'

type ListingFiltersProps = {
  categories: ListingCategory[]
  categoryId: string
  city: string
  materials?: ListingMaterial[]
  materialId?: string
  onCategoryChange: (value: string) => void
  onCityChange: (value: string) => void
  onClear: () => void
  onMaterialChange?: (value: string) => void
  onQueryChange: (value: string) => void
  onStateChange: (value: string) => void
  query: string
  state: string
}

export function ListingFilters({
  categories,
  categoryId,
  city,
  materialId = '',
  materials = [],
  onCategoryChange,
  onCityChange,
  onClear,
  onMaterialChange,
  onQueryChange,
  onStateChange,
  query,
  state,
}: ListingFiltersProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#d7e2d7] bg-[linear-gradient(180deg,#f7faf6_0%,#f3f7f2_100%)] shadow-[0_24px_64px_-48px_rgba(19,33,23,0.28)]">
      <div className="border-b border-[#d7e2d7] bg-white/82 px-5 py-4 backdrop-blur-sm md:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
              Busca e filtros
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              Use o catálogo como ferramenta de operação: encontre lotes e materiais por recorte comercial.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontal className="size-4 text-primary" />
            Filtros combinaveis por categoria, material e localidade
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 md:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-14 rounded-[1.25rem] border-white/70 bg-white pl-14 pr-4 text-base shadow-sm"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Busque por material, sucata, maquina, lote, resumo ou cidade"
            value={query}
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_0.95fr_0.45fr_0.8fr_auto]">
          <select
            className="flex h-12 w-full rounded-[1.1rem] border border-input bg-white px-4 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onCategoryChange(event.target.value)}
            value={categoryId}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {onMaterialChange ? (
            <select
              className="flex h-12 w-full rounded-[1.1rem] border border-input bg-white px-4 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => onMaterialChange(event.target.value)}
              value={materialId}
            >
              <option value="">Todos os materiais</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          ) : null}

          <Input
            className="h-12 rounded-[1.1rem] bg-white"
            maxLength={2}
            onChange={(event) => onStateChange(event.target.value.toUpperCase())}
            placeholder="UF"
            value={state}
          />
          <div className="relative xl:col-span-2">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-[1.1rem] bg-white pl-10"
              onChange={(event) => onCityChange(event.target.value)}
              placeholder="Cidade"
              value={city}
            />
          </div>

          <Button className="h-12 justify-center rounded-[1.1rem]" onClick={onClear} type="button" variant="outline">
            <RotateCcw className="size-4" />
            Limpar
          </Button>
        </div>
      </div>
    </section>
  )
}
