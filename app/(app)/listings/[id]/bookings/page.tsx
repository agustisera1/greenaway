import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/common/back-link";
import { PageLayout } from "@/components/common/page-layout";
import { ListingBookings } from "@/components/bookings/listing-bookings";
import { query } from "@/lib/apollo/client";
import { GetListingBookingsDocument } from "@/lib/apollo/__generated__/operations";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Listing bookings" };

export default async function ListingBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await query({
    query: GetListingBookingsDocument,
    variables: { id },
    errorPolicy: "all",
  });

  const listing = data?.listing;
  const currentUser = await getCurrentUser();
  if (!listing || currentUser?.id !== listing.host_id) notFound();
  const now = new Date();

  return (
    <PageLayout
      back={<BackLink href={`/listings/${id}`}>Back to listing</BackLink>}
      title="Bookings"
      subtitle={listing.title}
    >
      <ListingBookings
        bookingsPromise={Promise.resolve(listing.bookings ?? null)}
        listingId={id}
        now={now}
      />
    </PageLayout>
  );
}
