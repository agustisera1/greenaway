import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Identity and data access mocked at the module border; the policy stays real.
vi.mock("@/lib/auth/session", () => ({ authorize: vi.fn() }));
vi.mock("./repository", () => ({
  findChatByBookingId: vi.fn(),
  upsertReadCursor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { authorize } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/auth/types";
import { markChatAsSeen } from "./actions";
import * as repo from "./repository";
import type { SerializableChatDocument } from "./types";

const BOOKING_ID = "8f3c2a1e-4b5d-4c6e-9f7a-1b2c3d4e5f60";
const SEEN_AT = "2026-08-10T11:00:00.000Z";
const chat = { booking_id: BOOKING_ID, guest_id: "u1", host_id: "h1" } as SerializableChatDocument;

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
  vi.mocked(repo.findChatByBookingId).mockResolvedValue(chat);
  vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("markChatAsSeen", () => {
  const notFound = { ok: false, error: "Conversation not found", code: "NOT_FOUND" };

  it("returns the auth failure without moving the cursor", async () => {
    vi.mocked(authorize).mockResolvedValue({
      ok: false,
      error: "Forbidden",
      code: "FORBIDDEN",
    });
    const res = await markChatAsSeen(BOOKING_ID, SEEN_AT);
    expect(res).toEqual({ ok: false, error: "Forbidden", code: "FORBIDDEN" });
    expect(repo.upsertReadCursor).not.toHaveBeenCalled();
  });

  it("moves the caller's cursor on that chat to the message they were shown", async () => {
    const res = await markChatAsSeen(BOOKING_ID, SEEN_AT);
    expect(res).toEqual({ ok: true, data: null });
    expect(repo.upsertReadCursor).toHaveBeenCalledWith("u1", BOOKING_ID, new Date(SEEN_AT));
  });

  it("caps a position ahead of the server clock at now", async () => {
    await markChatAsSeen(BOOKING_ID, "2026-08-11T00:00:00.000Z");
    expect(repo.upsertReadCursor).toHaveBeenCalledWith(
      "u1",
      BOOKING_ID,
      new Date("2026-08-10T12:00:00.000Z"),
    );
  });

  // Not a party reads the same as a missing chat: it never confirms one exists.
  it("gives a bystander the same NOT_FOUND as a missing chat", async () => {
    vi.mocked(repo.findChatByBookingId).mockResolvedValue({ ...chat, guest_id: "other" });
    expect(await markChatAsSeen(BOOKING_ID, SEEN_AT)).toEqual(notFound);
    vi.mocked(repo.findChatByBookingId).mockResolvedValue(null);
    expect(await markChatAsSeen(BOOKING_ID, SEEN_AT)).toEqual(notFound);
    expect(repo.upsertReadCursor).not.toHaveBeenCalled();
  });

  it("rejects a malformed position before touching the repo", async () => {
    const res = await markChatAsSeen(BOOKING_ID, "yesterday");
    expect(res).toEqual({ ok: false, error: "Invalid read position", code: "VALIDATION" });
    expect(repo.findChatByBookingId).not.toHaveBeenCalled();
  });

  it("maps an unexpected repo failure to a generic message", async () => {
    vi.mocked(repo.upsertReadCursor).mockRejectedValue(
      new Error("connection reset"),
    );
    const res = await markChatAsSeen(BOOKING_ID, SEEN_AT);
    expect(res).toEqual({
      ok: false,
      error: "Could not update your messages",
      code: "UNEXPECTED",
    });
  });
});
