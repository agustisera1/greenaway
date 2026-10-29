"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EmptyState } from "@/components/common/empty-state";
import { AddListingPhotosButton } from "@/components/listings/add-listing-photos-button";
import { DeleteListingPhotoButton } from "@/components/listings/delete-listing-photo-button";
import { cn } from "@/lib/shared/utils";

// Spacing and sizes from the shadcn Carousel docs: two slides per view, three on desktop.
const SLIDE_CLASS = "basis-1/2 pl-2 lg:basis-1/3";
// The arrows sit on top of photos, so they take the overlay scrim to stay readable.
const ARROW_CLASS =
  "bg-overlay/60 text-overlay-foreground hover:bg-overlay/80 hover:text-overlay-foreground dark:hover:bg-overlay/80 disabled:opacity-0 cursor-pointer";

type ListingPhotosProps = {
  photos: string[];
  title: string;
  listingId: string;
  isHostMode?: boolean;
};

export function ListingPhotos({
  photos,
  title,
  listingId,
  isHostMode = false,
}: ListingPhotosProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <EmptyState
        className="rounded-xl border border-dashed border-input py-10"
        icon={<ImageOff />}
        title="No photos yet"
        description={
          isHostMode ? "Add photos so guests can see the place." : undefined
        }
        action={
          isHostMode ? (
            <AddListingPhotosButton listingId={listingId} />
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Carousel aria-label={`${title} photos`}>
        <CarouselContent className="-ml-2">
          {photos.map((photo, i) => (
            <CarouselItem key={`${photo}-${i}`} className={SLIDE_CLASS}>
              <div className="group relative isolate aspect-4/3 overflow-hidden rounded-xl bg-muted">
                <button
                  type="button"
                  onClick={() => setOpenAt(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}`}
                  className="block size-full cursor-pointer"
                >
                  <Image
                    src={photo}
                    alt={`${title} photo ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-102"
                  />
                </button>
                {isHostMode && (
                  <DeleteListingPhotoButton
                    listingId={listingId}
                    photoUrl={photo}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
          {isHostMode && (
            <CarouselItem className={SLIDE_CLASS}>
              <div className="aspect-4/3">
                <AddListingPhotosButton
                  listingId={listingId}
                  photos={photos}
                  variant="tile"
                />
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious
          variant="ghost"
          className={cn("left-3", ARROW_CLASS)}
        />
        <CarouselNext variant="ghost" className={cn("right-3", ARROW_CLASS)} />
      </Carousel>

      <Dialog
        open={openAt !== null}
        onOpenChange={(open) => !open && setOpenAt(null)}
      >
        <DialogContent size="lg" className="p-2 data-[size=lg]:sm:max-w-4xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {openAt !== null && (
            <Carousel
              opts={{ startIndex: openAt }}
              aria-label={`${title} photos`}
            >
              <CarouselContent>
                {photos.map((photo, i) => (
                  <CarouselItem key={`${photo}-${i}`}>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={photo}
                        alt={`${title} photo ${i + 1}`}
                        fill
                        sizes="(min-width: 640px) 896px, 100vw"
                        className="object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {photos.length > 1 && (
                <>
                  <CarouselPrevious
                    variant="ghost"
                    className={cn("left-3", ARROW_CLASS)}
                  />
                  <CarouselNext
                    variant="ghost"
                    className={cn("right-3", ARROW_CLASS)}
                  />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
