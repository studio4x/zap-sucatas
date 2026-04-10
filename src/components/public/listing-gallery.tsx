import { useMemo, useState } from 'react'
import type { ListingImage } from '@/domains/listings/types'
import { cn } from '@/lib/utils'

type ListingGalleryProps = {
  listingTitle: string
  images: ListingImage[]
}

export function ListingGallery({ images, listingTitle }: ListingGalleryProps) {
  const [activeImageId, setActiveImageId] = useState<string | null>(images[0]?.id ?? null)
  const activeImage = useMemo(
    () => images.find((image) => image.id === activeImageId) ?? images[0],
    [activeImageId, images],
  )
  const activeIndex = activeImage ? images.findIndex((image) => image.id === activeImage.id) : 0

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[2rem] border border-[#d8e3d8] bg-white shadow-[0_28px_64px_-48px_rgba(19,33,23,0.3)]">
        <div className="relative aspect-[16/10] bg-[linear-gradient(160deg,#edf4ee_0%,#dbe7dc_100%)]">
          {activeImage ? (
            <img
              alt={activeImage.altText ?? listingTitle}
              className="h-full w-full object-cover"
              src={activeImage.publicUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem imagens disponiveis
            </div>
          )}
          <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/66 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {images.length > 0 ? `${Math.min(activeIndex + 1, images.length)} / ${images.length}` : 'Galeria'}
          </div>
        </div>
      </div>

      {images.length > 1 ? (
        <div className="grid gap-3 grid-cols-4 lg:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                'aspect-square overflow-hidden rounded-[1.15rem] border bg-white transition',
                index === activeIndex
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-primary/35',
              )}
              onClick={() => setActiveImageId(image.id)}
              type="button"
            >
              <img
                alt={image.altText ?? listingTitle}
                className="h-full w-full object-cover"
                src={image.publicUrl}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
