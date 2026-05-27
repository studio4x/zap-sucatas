import { useEffect, useMemo, useState } from 'react'
import type { ListingImage } from '@/domains/listings/types'
import { cn } from '@/lib/utils'

type ListingGalleryProps = {
  listingTitle: string
  images: ListingImage[]
}

export function ListingGallery({ images, listingTitle }: ListingGalleryProps) {
  const orderedImages = useMemo(() => {
    const coverImage = images.find((image) => image.isCover)
    if (!coverImage) {
      return images
    }
    return [coverImage, ...images.filter((image) => image.id !== coverImage.id)]
  }, [images])

  const [activeImageId, setActiveImageId] = useState<string | null>(orderedImages[0]?.id ?? null)
  useEffect(() => {
    setActiveImageId(orderedImages[0]?.id ?? null)
  }, [orderedImages])

  const activeImage = useMemo(
    () => orderedImages.find((image) => image.id === activeImageId) ?? orderedImages[0],
    [activeImageId, orderedImages],
  )
  const activeIndex = activeImage ? orderedImages.findIndex((image) => image.id === activeImage.id) : 0

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_28px_64px_-48px_rgba(19,33,23,0.3)]">
        <div className="relative aspect-[4/3] bg-[linear-gradient(160deg,#f0f8ed_0%,#d6ebd1_100%)]">
          {activeImage ? (
            <img
              alt={activeImage.altText ?? listingTitle}
              className="h-full w-full object-cover"
              loading="eager"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
              src={activeImage.publicUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem imagens disponiveis
            </div>
          )}
          {activeImage?.isCover ? (
            <div className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              Capa
            </div>
          ) : null}
          <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/66 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            {orderedImages.length > 0
              ? `${Math.min(activeIndex + 1, orderedImages.length)} / ${orderedImages.length}`
              : 'Galeria'}
          </div>
        </div>
      </div>

      {orderedImages.length > 1 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Galeria de imagens
          </p>
          <div className="grid auto-cols-[calc((100%_-_0.75rem)/2)] grid-flow-col gap-3 overflow-x-auto pb-1 sm:auto-cols-[calc((100%_-_1.5rem)/3)] lg:auto-cols-[calc((100%_-_2.25rem)/4)]">
            {orderedImages.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                'group relative aspect-[4/3] w-full shrink-0 snap-start overflow-hidden rounded-[1.15rem] border bg-white transition',
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
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                src={image.publicUrl}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/65 to-transparent px-2 py-1 text-left text-[11px] font-medium text-white">
                {image.isCover ? 'Capa' : `Imagem ${index + 1}`}
              </div>
            </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
