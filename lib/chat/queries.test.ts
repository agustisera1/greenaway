import { beforeEach, describe, expect, it, vi } from "vitest";

// Identity and data access mocked at the module border; the policy stays real.
vi.mock("@/lib/auth/session", () => ({ authorize: vi.fn() }));
vi.mock("./repository", () => ({
  findChatIdsByUserId: vi.fn(),
  findChatByBookingId: vi.fn(),
  findReadCursors: vi.fn(),
  upsertReadCursor: vi.fn(),
  countUnreadByChat: vi.fn(),
  findMessagesByChatId: vi.fn(),
  findOlderCursor: vi.fn(),
}));
vi.mock("@/lib/bookings/repository", () => ({
  findBookingById: vi.fn(),
  findBookingsByGuestId: vi.fn(),
  findBookingsByListingIds: vi.fn(),
}));
vi.mock("@/lib/listings/repository", () => ({
  findListingById: vi.fn(),
  findListings: vi.fn(),
  findListingsByIds: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { authorize } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/auth/types";
import * as bookingsRepo from "@/lib/bookings/repository";
import type { Booking } from "@/lib/bookings/types";
import * as listingsRepo from "@/lib/listings/repository";
import type { Listing } from "@/lib/listings/types";
import { getChatThread, getUnreadMessagesCount, getUserConversations } from "./queries";
import * as repo from "./repository";

const CURSORS = new Map([["b1", new Date("2026-08-01T00:00:00.000Z")]]);

function user(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "u1",
    email: "guest@x.com",
    name: "Jane",
    is_host: false,
    permissions: ["chat:view-own"],
    roles: ["guest"],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authorize).mockResolvedValue({ ok: true, data: user() });
  vi.mocked(repo.findChatIdsByUserId).mockResolvedValue(["b1", "b2"]);
  vi.mocked(repo.findReadCursors).mockResolvedValue(CURSORS);
  vi.mocked(repo.countUnreadByChat).mockResolvedValue(
    new Map([
      ["b1", 3],
      ["b2", 2],
    ]),
  );
});

describe("getUnreadMessagesCount", () => {
  it("returns the auth failure without touching the repos", async () => {
    vi.mocked(authorize).mockResolvedValue({
      ok: false,
      error: "Forbidden",
      code: "FORBIDDEN",
    });
    const res = await getUnreadMessagesCount();
    expect(res).toEqual({ ok: false, error: "Forbidden", code: "FORBIDDEN" });
    expect(repo.countUnreadByChat).not.toHaveBeenCalled();
  });

  it("sums the per-chat counts over the caller's chats and cursors", async () => {
    const res = await getUnreadMessagesCount();
    expect(res).toEqual({ ok: true, data: 5 });
    expect(repo.countUnreadByChat).toHaveBeenCalledWith("u1", ["b1", "b2"], CURSORS);
  });

  // Chats are born with their first message, so no chats means no messages —
  // and it keeps an empty `$in` from reaching Mongo.
  it("short-circuits to zero when the user has no chats", async () => {
    vi.mocked(repo.findChatIdsByUserId).mockResolvedValue([]);
    const res = await getUnreadMessagesCount();
    expect(res).toEqual({ ok: true, data: 0 });
    expect(repo.countUnreadByChat).not.toHaveBeenCalled();
  });

  it("maps an unexpected repo failure to a generic message", async () => {
    vi.mocked(repo.countUnreadByChat).mockRejectedValue(
      new Error("connection reset"),
    );
    const res = await getUnreadMessagesCount();
    expect(res).toEqual({
      ok: false,
      error: "Could not load your unread messages",
      code: "UNEXPECTED",
    });
  });
});

describe("getUserConversations", () => {
  const booking = (id: string) =>
    ({ id, listing_id: "L1", guest_id: "u1", start_date: new Date("2026-09-01") }) as Booking;

  beforeEach(() => {
    vi.mocked(bookingsRepo.findBookingsByGuestId).mockResolvedValue([booking("b1"), booking("b3")]);
    vi.mocked(bookingsRepo.findBookingsByListingIds).mockResolvedValue([]);
    vi.mocked(listingsRepo.findListingsByIds).mockResolvedValue([
      { _id: "L1", host_id: "h1", title: "Cabin", photos: [] } as unknown as Listing,
    ]);
  });

  it("puts each chat's unread count on its row", async () => {
    const res = await getUserConversations();
    expect(res.ok && res.data.map((row) => [row.id, row.unread_count])).toEqual([
      ["b1", 3],
      ["b3", 0],
    ]);
    expect(repo.countUnreadByChat).toHaveBeenCalledWith("u1", ["b1", "b3"], CURSORS);
  });

  it("skips the count when there are no bookings", async () => {
    vi.mocked(bookingsRepo.findBookingsByGuestId).mockResolvedValue([]);
    expect(await getUserConversations()).toEqual({ ok: true, data: [] });
    expect(repo.countUnreadByChat).not.toHaveBeenCalled();
  });
});

describe("getChatThread", () => {
  const BOOKING_ID = "8f3c2a1e-4b5d-4c6e-9f7a-1b2c3d4e5f60";
  const booking = { id: BOOKING_ID, listing_id: "L1", guest_id: "u1" } as Booking;

  beforeEach(() => {
    vi.mocked(bookingsRepo.findBookingById).mockResolvedValue(booking);
    vi.mocked(listingsRepo.findListingById).mockResolvedValue({ host_id: "h1" } as Listing);
    vi.mocked(repo.findChatByBookingId).mockResolvedValue(null);
  });

  it("returns the viewer's side and an empty thread before anyone speaks", async () => {
    expect(await getChatThread(BOOKING_ID, null)).toEqual({
      ok: true,
      data: {
        chat: null,
        messages: { items: [], olderCursor: null },
        party: "guest",
        counterpart_id: "h1",
      },
    });
    expect(repo.findMessagesByChatId).not.toHaveBeenCalled();
  });

  // Not a party reads the same as a missing booking: it never confirms one exists.
  it("gives a bystander the same NOT_FOUND as a missing booking", async () => {
    const notFound = { ok: false, error: "Conversation not found", code: "NOT_FOUND" };
    vi.mocked(bookingsRepo.findBookingById).mockResolvedValue({ ...booking, guest_id: "other" });
    expect(await getChatThread(BOOKING_ID, null)).toEqual(notFound);

    vi.mocked(bookingsRepo.findBookingById).mockResolvedValue(null);
    expect(await getChatThread(BOOKING_ID, null)).toEqual(notFound);
  });
});
