import { use } from "react";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/shared/utils";
import { HostBookingCard, type HostBooking } from "./host-booking-card";
import { sortByNewest, sortByProximity } from "./listing-bookings-model";

// Without `limit` it's the full page: every booking, in a grid.
export function ListingBookings({
  bookingsPromise,
  listingId,
  now,
  limit,
}: {
  bookingsPromise: Promise<HostBooking[] | null>;
  listingId: string;
  now: Date;
  limit?: number;
}) {
  const bookings = use(bookingsPromise);

  if (!bookings) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load the bookings. Try reloading the page.
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        className="py-10"
        icon={<CalendarRange />}
        title="No bookings yet"
        description="Reservations for this listing will appear here."
      />
    );
  }

  const fullPage = limit === undefined;
  // A preview shows the latest requests; the full page orders by stay date.
  const sorted = fullPage
    ? sortByProximity(bookings, now.getTime())
    : sortByNewest(bookings);
  const shown = fullPage ? sorted : sorted.slice(0, limit);

  return (
    <div className="flex flex-col gap-3">
      <ul
        className={cn(
          "grid gap-3",
          fullPage && "sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {shown.map((booking) => (
          <HostBookingCard key={booking.id} booking={booking} />
        ))}
      </ul>
      {shown.length < sorted.length && (
        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/listings/${listingId}/bookings`} />}
        >
          Review all
        </Button>
      )}
    </div>
  );
}
