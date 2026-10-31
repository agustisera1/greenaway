import Link from "next/link";
import { CalendarRange, LogIn, LogOut, MessageSquare, Moon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Fact } from "@/components/common/fact";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import type { GetListingBookingsQuery } from "@/lib/apollo/__generated__/operations";
import { formatDate, formatDateRange, calcNights } from "@/lib/shared/dates";
import { formatPrice, bookingStatusVariant, initialsFrom } from "@/lib/shared/utils";
import { ManageBookingActions } from "./manage-booking-actions";
import { CancelBookingButton } from "./cancel-booking-button";

export type HostBooking = NonNullable<
  NonNullable<GetListingBookingsQuery["listing"]>["bookings"]
>[number];

export function HostBookingCard({ booking }: { booking: HostBooking }) {
  const nights = calcNights(booking.start_date, booking.end_date);
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";
  const guestName = booking.guest?.name ?? "Guest";

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

          <div className="flex items-center gap-3">
            <InitialsAvatar initials={initialsFrom(guestName)} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{guestName}</span>
              <span className="text-xs text-muted-foreground">
                Booked {formatDate(booking.created_at)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/messages/${booking.id}`} />}
            >
              <MessageSquare />
              Message
            </Button>
          </div>

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

          {booking.status_reason && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              “{booking.status_reason}”
            </p>
          )}

          {isCancelled && booking.cancelled_by && (
            <p className="text-sm text-muted-foreground">
              Cancelled by the {booking.cancelled_by}
              {booking.refund_amount > 0 &&
                ` · ${formatPrice(booking.refund_amount)} refunded`}
            </p>
          )}
          <Separator />
          <span className="font-mono text-xs text-muted-foreground">
            Ref. {booking.id.slice(0, 8)}
          </span>

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
