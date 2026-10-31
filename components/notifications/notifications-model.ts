import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  type LucideIcon,
} from "lucide-react";
import type { GetNotificationsQuery } from "@/lib/apollo/__generated__/operations";

export type Notification = NonNullable<GetNotificationsQuery["notifications"]>[number];

// Notifications have no `type` field, so the icon and tint are keyed off the worker's titles
// (greenaway-worker `src/notifications/content.ts`).
export function notificationVisual(title: string): {
  icon: LucideIcon;
  accent: string;
} {
  const t = title.toLowerCase();

  const success = "text-success bg-success/10";
  const destructive = "text-destructive bg-destructive/10";
  const info = "text-primary bg-primary/10";

  if (t.includes("request")) return { icon: CalendarPlus, accent: info };
  if (t.includes("confirm")) return { icon: CalendarCheck, accent: success };
  if (t.includes("cancel") || t.includes("declin"))
    return { icon: CalendarX, accent: destructive };
  return { icon: Bell, accent: info };
}

// Where the recipient acts on the booking: the host manages it from the listing's bookings.
export function notificationHref(notification: Notification): string {
  return notification.target_id === notification.host_id
    ? `/listings/${notification.listing_id}/bookings`
    : `/bookings/${notification.booking_id}`;
}

// The worker publishes `{ kind: "message" }` for an unread nudge (`UnreadNudge`, worker `src/redis/client.ts`).
// Anything unparseable counts as a notification: worst case, a badge off by one until reload.
export function isUnreadNudge(data: string): boolean {
  try {
    return JSON.parse(data)?.kind === "message";
  } catch {
    return false;
  }
}

// Overlays the optimistic read-set on top of the server flag, so a just-read
// notification moves from "new" to "older" without waiting for a refetch.
export function partitionByRead(
  notifications: Notification[],
  readIds: Set<string>,
): { unread: Notification[]; older: Notification[] } {
  const isRead = (n: Notification) => n.is_read || readIds.has(n.id);
  return {
    unread: notifications.filter((n) => !isRead(n)),
    older: notifications.filter(isRead),
  };
}
