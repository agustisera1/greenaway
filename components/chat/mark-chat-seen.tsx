"use client";

import { useEffect } from "react";
import { markChatAsSeen } from "@/lib/chat/actions";

export function MarkChatSeen({ bookingId, seenAt }: { bookingId: string; seenAt: string }) {
  useEffect(() => {
    void markChatAsSeen(bookingId, seenAt);
  }, [bookingId, seenAt]);

  return null;
}
