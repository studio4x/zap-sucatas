import { useMemo } from 'react'
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

  return (
    <div className="space-y-2 overflow-hidden rounded-[2rem] border border-border bg-white p-4 shadow-[0_28px_64px_-48px_rgba(19,33,23,0.3)] sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Galeria de imagens
      </p>
      {orderedImages.length > 0 ? (
        <div className="grid auto-cols-[calc((100%_-_0.75rem)/2)] grid-flow-col gap-3 overflow-x-auto pb-1 sm:auto-cols-[calc((100%_-_1.5rem)/3)] lg:auto-cols-[calc((100%_-_2.25rem)/4)]">
          {orderedImages.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                'group relative aspect-[4/3] w-full overflow-hidden rounded-[1.15rem] border bg-white',
                image.isCover ? 'border-primary shadow-sm' : 'border-border',
              )}
            >
              <img
                alt={image.altText ?? listingTitle}
                className="h-full w-full object-cover"
                loading={index < 4 ? 'eager' : 'lazy'}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                src={image.publicUrl}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-2 py-1 text-left text-[11px] font-medium text-white">
                {image.isCover ? 'Capa' : `Imagem ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(160deg,#f0f8ed_0%,#d6ebd1_100%)] text-sm text-muted-foreground">
          Sem imagens disponiveis
        </div>
      )}
    </div>
  )
}
