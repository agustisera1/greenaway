import { PageLayout } from "@/components/common/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingBookingsLoading() {
  return (
    <PageLayout
      back={<Skeleton className="h-5 w-32 rounded-lg" />}
      title={<Skeleton className="h-9 w-1/3 max-w-full" />}
      subtitle={<Skeleton className="h-4 w-48" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </PageLayout>
  );
}
