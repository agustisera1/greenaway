import type { BookingParty } from "@/lib/bookings/types";
import type {
  GetChatThreadQuery,
  GetConversationsQuery,
} from "@/lib/apollo/__generated__/operations";
import type { DeliveredMessage } from "@/lib/chat/socket";
import { initialsFrom } from "@/lib/shared/utils";

// `pending` and `failed` are client-only states of an optimistic message; never persisted.
export type ThreadMessage = DeliveredMessage & {
  pending?: boolean;
  failed?: boolean;
};

/** Load state of the chat history fetch. */
export type Status = "loading" | "error" | "ready";

// Who the viewer talks to: `title` heads a line, `mention` goes mid-sentence.
export type Counterpart = { title: string; mention: string; initials: string };

// Without a name (the user lookup failed), the other party's role stands in.
export function counterpartOf(viewerParty: BookingParty, name?: string | null): Counterpart {
  if (name) return { title: name, mention: name.split(" ")[0], initials: initialsFrom(name) };
  const role = viewerParty === "guest" ? "host" : "guest";
  return { title: `Your ${role}`, mention: `your ${role}`, initials: role[0].toUpperCase() };
}

/** A row of the messages rail, as GraphQL delivers it. */
export type ConversationRow = NonNullable<GetConversationsQuery["conversations"]>[number];

/** A thread as the page loads it: messages, chat meta (null until someone speaks) and the viewer's side. */
export type ChatThreadRow = NonNullable<GetChatThreadQuery["chatThread"]>;
