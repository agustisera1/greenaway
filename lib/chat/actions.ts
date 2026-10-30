"use server";
import { authorize } from "@/lib/auth/session";
import type { ServiceResult } from "@/lib/shared/result";
import { revalidatePaths } from "@/lib/shared/revalidate";
import * as repo from "./repository";
import { chatIdSchema, seenAtSchema } from "./validation";

export async function markChatAsSeen(
  bookingId: string,
  seenAt: string,
): Promise<ServiceResult<null>> {
  const auth = await authorize("chat:view-own");
  if (!auth.ok) return auth;
  const user = auth.data;

  const notFound = { ok: false, error: "Conversation not found", code: "NOT_FOUND" } as const;
  if (!chatIdSchema.safeParse(bookingId).success) return notFound;
  const parsed = seenAtSchema.safeParse(seenAt);
  if (!parsed.success) return { ok: false, error: "Invalid read position", code: "VALIDATION" };

  try {
    const chat = await repo.findChatByBookingId(bookingId);
    if (!chat || (chat.guest_id !== user.id && chat.host_id !== user.id)) return notFound;

    // A client clock ahead of ours would mark messages that don't exist yet as read.
    const now = new Date();
    await repo.upsertReadCursor(user.id, bookingId, parsed.data > now ? now : parsed.data);

    revalidatePaths([{ path: "/messages", level: "layout" }]);
    return { ok: true, data: null };
  } catch (error) {
    console.error("[markChatAsSeen]", error);
    return { ok: false, error: "Could not update your messages", code: "UNEXPECTED" };
  }
}
