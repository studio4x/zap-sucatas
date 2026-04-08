import { useEffect, useState } from 'react'
import type { ListingImage } from '@/domains/listings/types'
import { cn } from '@/lib/utils'

type ListingGalleryProps = {
  listingTitle: string
  images: ListingImage[]
}

export function ListingGallery({ images, listingTitle }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  const activeImage = images[activeIndex] ?? images[0]

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
        <div className="aspect-[16/10] bg-muted">
          {activeImage ? (
            <img
              alt={activeImage.altText ?? listingTitle}
              className="h-full w-full object-cover"
              src={activeImage.publicUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem imagens disponíveis
            </div>
          )}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                'aspect-square overflow-hidden rounded-[1.25rem] border bg-card transition',
                index === activeIndex
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-primary/35',
              )}
              onClick={() => setActiveIndex(index)}
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
