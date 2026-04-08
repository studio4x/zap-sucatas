import { RotateCcw, Search } from 'lucide-react'
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
    <div className="rounded-[1.5rem] border border-border bg-card/88 p-4 shadow-sm md:p-5">
      <div className="grid gap-3 xl:grid-cols-[1.3fr_0.85fr_0.85fr_0.7fr_0.7fr_auto]">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-11"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por anúncio, material, resumo ou cidade"
            value={query}
          />
        </div>

        <select
          className="flex h-11 w-full rounded-2xl border border-input bg-background/90 px-4 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
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
            className="flex h-11 w-full rounded-2xl border border-input bg-background/90 px-4 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
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
          maxLength={2}
          onChange={(event) => onStateChange(event.target.value.toUpperCase())}
          placeholder="UF"
          value={state}
        />
        <Input onChange={(event) => onCityChange(event.target.value)} placeholder="Cidade" value={city} />

        <Button className="justify-center" onClick={onClear} type="button" variant="outline">
          <RotateCcw className="size-4" />
          Limpar
        </Button>
      </div>
    </div>
  )
}
