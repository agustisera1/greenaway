import mongoClientPromise from "@/lib/infra/mongo";
import type {
  ChatDocument,
  MessageDocument,
  MessageReadCursor,
  SerializableChatDocument,
  SerializableMessageDocument,
} from "./types";

async function chats() {
  return (await mongoClientPromise).db("chatsdb").collection<ChatDocument>("chats");
}

async function messages() {
  return (await mongoClientPromise).db("messagesdb").collection<MessageDocument>("messages");
}

async function readCursors() {
  return (await mongoClientPromise).db("messagesdb").collection<MessageReadCursor>("read_cursors");
}

// By `booking_id`: the key messages reference their thread with (`chat_id`).
export async function findChatIdsByUserId(userId: string): Promise<string[]> {
  const documents = await (await chats())
    .find({ $or: [{ guest_id: userId }, { host_id: userId }] })
    .project<Pick<ChatDocument, "booking_id">>({ booking_id: 1, _id: 0 })
    .toArray();
  return documents.map((document) => document.booking_id);
}

export async function findChatByBookingId(
  bookingId: string,
): Promise<SerializableChatDocument | null> {
  const document = await (await chats()).findOne({ booking_id: bookingId });
  return document ? { ...document, _id: document._id.toString() } : null;
}

// Oldest first, sorted descending so the limit cuts the old end. With `from`, everything since then.
export async function findMessagesByChatId(
  chatId: string,
  from: Date | null,
  limit: number,
): Promise<SerializableMessageDocument[]> {
  const documents = await (await messages())
    .find({ chat_id: chatId, ...(from ? { timestamp: { $gte: from } } : {}) })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return documents.reverse().map((document) => ({ ...document, _id: document._id.toString() }));
}

// Where the page before `before` starts: null when nothing older exists.
export async function findOlderCursor(
  chatId: string,
  before: Date,
  pageSize: number,
): Promise<Date | null> {
  const documents = await (await messages())
    .find({ chat_id: chatId, timestamp: { $lt: before } })
    .sort({ timestamp: -1 })
    .limit(pageSize)
    .project<Pick<MessageDocument, "timestamp">>({ timestamp: 1, _id: 0 })
    .toArray();
  return documents.at(-1)?.timestamp ?? null;
}

export async function findReadCursors(userId: string): Promise<Map<string, Date>> {
  const documents = await (await readCursors()).find({ user_id: userId }).toArray();
  return new Map(documents.map((document) => [document.chat_id, document.last_seen_at]));
}

// `$max`: a late or stale request never moves the cursor back.
export async function upsertReadCursor(
  userId: string,
  chatId: string,
  seenAt: Date,
): Promise<void> {
  await (await readCursors()).updateOne(
    { user_id: userId, chat_id: chatId },
    { $max: { last_seen_at: seenAt } },
    { upsert: true },
  );
}

export async function countUnreadByChat(
  userId: string,
  chatIds: string[],
  cursors: Map<string, Date>,
): Promise<Map<string, number>> {
  const groups = await (await messages())
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          sender_id: { $ne: userId },
          $or: chatIds.map((chatId) => {
            const since = cursors.get(chatId);
            return since ? { chat_id: chatId, timestamp: { $gt: since } } : { chat_id: chatId };
          }),
        },
      },
      { $group: { _id: "$chat_id", count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(groups.map((group) => [group._id, group.count]));
}
