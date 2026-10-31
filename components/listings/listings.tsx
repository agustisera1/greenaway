import { GetListingsQuery } from "@/lib/apollo/__generated__/operations";
import { Card, CardContent } from "@/components/ui/card";
import { CoverImage, OverlayBadge } from "@/components/common/cover-image";
import { PriceLabel } from "@/components/common/price-label";
import { StatChip } from "@/components/common/stat-chip";
import { listingTypeGradient } from "@/lib/shared/utils";
import { MapPin, MessageCircle, Star } from "lucide-react";
import Link from "next/link";

export function Listings({
  listings,
}: {
  listings: GetListingsQuery["listings"];
}) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings?.map((listing) => (
        <li key={listing.id}>
          <Link href={`/listings/${listing.id}`}>
            <Card className="group h-full overflow-hidden p-0 transition-shadow duration-300 hover:shadow-lg">
              <CoverImage
                src={listing.photos?.[0]}
                alt={listing.title}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                fallbackClassName={listingTypeGradient(listing.type)}
                zoomOnHover
                className="h-40 p-3"
              >
                <OverlayBadge>{listing.type}</OverlayBadge>
              </CoverImage>
              <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                  {listing.title}
                </h3>
                {(listing.location?.city || listing.location?.country) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span>
                      {[listing.location?.city, listing.location?.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {listing.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <PriceLabel price={listing.price} className="text-base whitespace-nowrap" />
                  {listing.review_stats ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <StatChip icon={<Star className="fill-rating text-rating" />}>
                        {listing.review_stats.rating_avg.toFixed(1)}
                      </StatChip>
                      <StatChip icon={<MessageCircle />}>
                        {listing.review_stats.count}{" "}
                        {listing.review_stats.count === 1 ? "review" : "reviews"}
                      </StatChip>
                    </div>
                  ) : (
                    <StatChip>New</StatChip>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
