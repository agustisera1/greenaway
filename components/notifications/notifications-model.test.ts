import { Bell, CalendarCheck, CalendarPlus, CalendarX } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  isUnreadNudge,
  notificationHref,
  notificationVisual,
  partitionByRead,
  type Notification,
} from "./notifications-model";

describe("notificationVisual", () => {
  const success = "text-success bg-success/10";
  const destructive = "text-destructive bg-destructive/10";
  const info = "text-primary bg-primary/10";

  // The titles the worker writes (greenaway-worker `src/notifications/content.ts`).
  it.each([
    ["New booking request", CalendarPlus, info],
    ["Booking confirmed", CalendarCheck, success],
    ["Booking declined", CalendarX, destructive],
    ["Booking cancelled", CalendarX, destructive],
  ])("%s", (title, icon, accent) => {
    expect(notificationVisual(title)).toEqual({ icon, accent });
  });

  it("falls back to a generic bell with the info accent", () => {
    expect(notificationVisual("Something else")).toEqual({ icon: Bell, accent: info });
  });
});

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: "n",
    listing_id: "l",
    host_id: "h",
    guest_id: "g",
    booking_id: "b",
    target_id: "g",
    body: "body",
    title: "title",
    is_read: false,
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("notificationHref", () => {
  it("sends the host to the listing's bookings, where they act on it", () => {
    expect(notificationHref(notification({ target_id: "h" }))).toBe("/listings/l/bookings");
  });

  it("sends the guest to their booking", () => {
    expect(notificationHref(notification({ target_id: "g" }))).toBe("/bookings/b");
  });
});

describe("isUnreadNudge", () => {
  it("recognises the worker's bodiless message frame", () => {
    expect(isUnreadNudge(JSON.stringify({ kind: "message" }))).toBe(true);
  });

  it("treats a notification document as a notification", () => {
    // The real shape published for bookings: a whole document, no `kind`.
    const frame = JSON.stringify({ title: "Booking confirmed", is_read: false });
    expect(isUnreadNudge(frame)).toBe(false);
  });

  // A frame that can't be parsed still means something happened, so it counts
  // as a notification rather than being dropped.
  it("falls back to a notification on anything unparseable", () => {
    expect(isUnreadNudge("not json")).toBe(false);
    expect(isUnreadNudge("")).toBe(false);
    expect(isUnreadNudge("null")).toBe(false);
  });
});

describe("partitionByRead", () => {
  it("overlays the optimistic read-set on top of the server flag", () => {
    const notifications = [
      notification({ id: "n1", is_read: false }),
      notification({ id: "n2", is_read: true }),
      notification({ id: "n3", is_read: false }),
    ];

    const { unread, older } = partitionByRead(notifications, new Set(["n3"]));

    expect(unread.map((n) => n.id)).toEqual(["n1"]);
    expect(older.map((n) => n.id)).toEqual(["n2", "n3"]);
  });
});
