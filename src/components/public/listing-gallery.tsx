import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ListingImage } from '@/domains/listings/types'
import { cn } from '@/lib/utils'

type ListingGalleryProps = {
  listingTitle: string
  images: ListingImage[]
}

function resolveListingImageUrl(url: string, size: 'main' | 'thumb') {
  if (!url.includes('/storage/v1/object/public/')) {
    return url
  }

  const transformedBase = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const target = size === 'main' ? { height: 1200, width: 1600 } : { height: 360, width: 480 }
  const separator = transformedBase.includes('?') ? '&' : '?'
  return `${transformedBase}${separator}width=${target.width}&height=${target.height}&resize=cover&quality=85`
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

  const activeIndex = Math.max(
    0,
    orderedImages.findIndex((image) => image.id === activeImageId),
  )
  const activeImage = orderedImages[activeIndex] ?? null

  function showPreviousImage() {
    if (orderedImages.length === 0) {
      return
    }

    const previousIndex = activeIndex === 0 ? orderedImages.length - 1 : activeIndex - 1
    setActiveImageId(orderedImages[previousIndex]?.id ?? null)
  }

  function showNextImage() {
    if (orderedImages.length === 0) {
      return
    }

    const nextIndex = activeIndex === orderedImages.length - 1 ? 0 : activeIndex + 1
    setActiveImageId(orderedImages[nextIndex]?.id ?? null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      {orderedImages.length > 0 ? (
        <div className="flex h-full min-h-0 flex-col space-y-4">
          <div className="relative overflow-hidden rounded-[1.4rem] border border-border bg-white">
            <div className="aspect-[4/3]">
              <img
                alt={activeImage?.altText ?? listingTitle}
                className="h-full w-full object-cover"
                loading="eager"
                height={1200}
                sizes="(max-width: 1024px) 100vw, 760px"
                src={activeImage ? resolveListingImageUrl(activeImage.publicUrl, 'main') : undefined}
                width={1600}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/80 to-transparent px-3 py-3 text-xs font-medium text-white">
              <span />
              <span>{activeIndex + 1} / {orderedImages.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              aria-label="Imagem anterior"
              className="size-10 shrink-0 rounded-full border-primary text-primary hover:text-primary"
              onClick={showPreviousImage}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="block size-4 shrink-0 text-primary" strokeWidth={2.5} />
            </Button>
            <div className="grid auto-cols-[calc((100%_-_0.75rem)/2)] grid-flow-col gap-3 overflow-x-auto pb-1 sm:auto-cols-[calc((100%_-_1.5rem)/3)] lg:auto-cols-[calc((100%_-_1.5rem)/3)]">
              {orderedImages.map((image, index) => (
                <button
                  key={image.id}
                  className={cn(
                    'group relative aspect-[4/3] w-full overflow-hidden rounded-[1.15rem] border bg-white',
                    image.id === activeImageId ? 'border-primary shadow-sm' : 'border-border',
                  )}
                  onClick={() => setActiveImageId(image.id)}
                  type="button"
                >
                  <img
                    alt={image.altText ?? listingTitle}
                    className="h-full w-full object-cover"
                    height={360}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    src={resolveListingImageUrl(image.publicUrl, 'thumb')}
                    width={480}
                  />
                </button>
              ))}
            </div>
            <Button
              aria-label="Próxima imagem"
              className="size-10 shrink-0 rounded-full border-primary text-primary hover:text-primary"
              onClick={showNextImage}
              type="button"
              variant="outline"
            >
              <ChevronRight className="block size-4 shrink-0 text-primary" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(160deg,#f0f8ed_0%,#d6ebd1_100%)] text-sm text-muted-foreground">
          Sem imagens disponíveis
        </div>
      )}
    </div>
  )
}