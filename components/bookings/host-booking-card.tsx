import { CalendarRange, LogIn, LogOut, Moon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Fact } from "@/components/common/fact";
import type { GetListingBookingsQuery } from "@/lib/apollo/__generated__/operations";
import { formatDate, formatDateRange, calcNights } from "@/lib/shared/dates";
import { formatPrice, bookingStatusVariant } from "@/lib/shared/utils";
import { ManageBookingActions } from "./manage-booking-actions";
import { CancelBookingButton } from "./cancel-booking-button";

export type HostBooking = NonNullable<
  NonNullable<GetListingBookingsQuery["listing"]>["bookings"]
>[number];

// `detailed` is the full-page view: adds the stay facts, booking record and refund.
export function HostBookingCard({
  booking,
  detailed = false,
}: {
  booking: HostBooking;
  detailed?: boolean;
}) {
  const nights = calcNights(booking.start_date, booking.end_date);
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";

  return (
    <li>
      <Card className="h-full p-0">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarRange className="size-3.5 shrink-0 text-muted-foreground" />
              <span>
                {formatDateRange(booking.start_date, booking.end_date)}
              </span>
            </div>
            <Badge
              variant={bookingStatusVariant[booking.status]}
              className="shrink-0 capitalize"
            >
              {booking.status}
            </Badge>
          </div>

          {detailed ? (
            <dl className="grid grid-cols-2 gap-4 py-1">
              <Fact
                icon={<LogIn />}
                label="Check-in"
                value={formatDate(booking.start_date)}
              />
              <Fact
                icon={<LogOut />}
                label="Check-out"
                value={formatDate(booking.end_date)}
              />
              <Fact icon={<Moon />} label="Nights" value={nights || "-"} />
              <Fact icon={<Users />} label="Guests" value={booking.guests} />
            </dl>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-3.5 shrink-0" />
              <span>
                {nights} night{nights !== 1 ? "s" : ""} · {booking.guests} guest
                {booking.guests !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {booking.status_reason && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              “{booking.status_reason}”
            </p>
          )}

          {detailed && (
            <>
              {isCancelled && booking.cancelled_by && (
                <p className="text-sm text-muted-foreground">
                  Cancelled by the {booking.cancelled_by}
                  {booking.refund_amount > 0 &&
                    ` · ${formatPrice(booking.refund_amount)} refunded`}
                </p>
              )}
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Booked on {formatDate(booking.created_at)}</span>
                <span className="font-mono">Ref. {booking.id.slice(0, 8)}</span>
              </div>
            </>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
            <span className="text-base font-semibold tabular-nums">
              {formatPrice(booking.total_price)}
            </span>
            {isPending ? (
              <ManageBookingActions bookingId={booking.id} />
            ) : (
              <CancelBookingButton
                bookingId={booking.id}
                actor="host"
                booking={booking}
                variant="compact"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
