// Demo data for the audited flows (booking, chat, login), consistent across Postgres and Mongo.
// Only seeds empty data tables; to start over, `pnpm db:reset --yes && pnpm db:seed`. See db/README.md.
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { MongoClient, ObjectId } from "mongodb";
import { Pool } from "pg";
import { refundFor } from "../lib/bookings/policy";
import { bookings } from "../lib/bookings/tables";
import type { BookingStatus } from "../lib/bookings/types";
import type { ChatDocument, MessageDocument, MessageReadCursor } from "../lib/chat/types";
import type { ListingDocumentValues } from "../lib/listings/types";
import { AMENITIES } from "../lib/listings/validation";
import type { NotificationDocument } from "../lib/notifications/types";
import { users } from "../lib/users/tables";

const DEMO_PASSWORD = "greenaway-demo";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const HOSTS = [
  { name: "Lucía Fernández", email: "lucia@greenaway.test" },
  { name: "Martín Gómez", email: "martin@greenaway.test" },
  { name: "Sofía Romero", email: "sofia@greenaway.test" },
];

const GUESTS = [
  { name: "Valentina Díaz", email: "valentina@greenaway.test" },
  { name: "Joaquín Pereyra", email: "joaquin@greenaway.test" },
  { name: "Camila Sosa", email: "camila@greenaway.test" },
  { name: "Tomás Herrera", email: "tomas@greenaway.test" },
  { name: "Florencia Ruiz", email: "florencia@greenaway.test" },
  { name: "Nicolás Benítez", email: "nicolas@greenaway.test" },
];

const STAYS = [
  {
    city: "Bariloche", lat: -41.1335, lng: -71.3103, propertyType: "cabin",
    titles: ["Log cabin in the Bariloche forest", "Woodland cabin near Cerro Otto"],
    description: "A log cabin among coihues, with a wood stove and trails starting at the door.",
    photos: ["1570793005386-840846445fed", "1627750168257-9a7d3965ef8b", "1762378839057-0acfcf11e365", "1621771674545-849014cf91fa"],
  },
  {
    city: "Bariloche", lat: -41.0602, lng: -71.5317, propertyType: "house",
    titles: ["Lakefront house on Nahuel Huapi", "House with a private dock on the lake"],
    description: "Wake up to the lake, kayak from the dock and end the day by the fire.",
    photos: ["1666066378095-6fad8fc100ea", "1578453223871-970d2d15b57a", "1592944083147-df73ff3f71e5", "1716824272167-876189244a41"],
  },
  {
    city: "El Chaltén", lat: -49.3315, lng: -72.8863, propertyType: "cabin",
    titles: ["Trekking base under Fitz Roy", "Hikers' cabin at the Laguna de los Tres trailhead"],
    description: "Built for trekkers: drying room, packed lunches and the Fitz Roy trails a short walk away.",
    photos: ["1551632811-561732d1e306", "1772171722289-f2848447fb07", "1780593195639-8f5cb6a2b310", "1772171838855-96e0e49438fc"],
  },
  {
    city: "Villa La Angostura", lat: -40.7617, lng: -71.6458, propertyType: "cabin",
    titles: ["Lakeside hut on the Seven Lakes Route", "Mountain hut facing Lago Correntoso"],
    description: "Snowy peaks over a quiet lake, with trails, kayaks and stargazing on the shore.",
    photos: ["1708394534994-4e66c2b09e1f", "1585491665805-48272c97a0f6", "1546569397-ab326af881f5", "1558517286-8a9cb0b8c793"],
  },
  {
    city: "Ushuaia", lat: -54.8019, lng: -68.303, propertyType: "cabin",
    titles: ["Mountain refuge at the end of the world", "Cabin on the Beagle Channel"],
    description: "Between the Martial range and the Beagle Channel, ready for hikes and boat trips.",
    photos: ["1768087512696-bacd7eab5f85", "1652743920719-307f6333be00", "1615656543085-130a54570311", "1651489000754-1bc96a562520"],
  },
  {
    city: "El Bolsón", lat: -41.9644, lng: -71.5347, propertyType: "cabin",
    titles: ["Meadow cabin in the Andean valley", "Hillside cabin under Cerro Piltriquitrón"],
    description: "A small cabin in green pastures, with mountain views and the craft fair nearby.",
    photos: ["1774918178986-1ab3e322f58f", "1724709865844-edc4f56c7745", "1566754844421-9bc834baf4a3", "1475087542963-13ab5e611954"],
  },
  {
    city: "Mar del Plata", lat: -38.0055, lng: -57.5426, propertyType: "house",
    titles: ["Surf house steps from the waves", "Beach house with a board rack"],
    description: "Boards and wetsuits included, with the best breaks on the coast a short walk away.",
    photos: ["1730087356417-ec7c8c93ef86", "1604828268259-cf9d7009d5fa", "1776009295257-a01592563e00", "1789796831446-16d9fa051fa9"],
  },
  {
    city: "Chapadmalal", lat: -38.1806, lng: -57.6489, propertyType: "house",
    titles: ["Beach hostel with bonfire nights", "Seaside camp house on the cliffs"],
    description: "Shared kitchen, campfires on the sand and a quiet beach right below the cliffs.",
    photos: ["1767206106418-1fca6a5daef2", "1766338796789-80606cee416f", "1773762159818-d929964ab226", "1772849141383-213316a7102d"],
  },
  {
    city: "Tunuyán", lat: -33.5767, lng: -69.0186, propertyType: "villa",
    titles: ["Vineyard stay in the Uco Valley", "Winery house with Andes views"],
    description: "Among Malbec vines at the foot of the Andes, with tastings and horseback rides.",
    photos: ["1765574782003-75d8f507f939", "1690742135975-f04123a1c471", "1765850258591-ac294919250b", "1765574781851-3cdc7a900a58"],
  },
  {
    city: "Cafayate", lat: -26.0731, lng: -65.9761, propertyType: "villa",
    titles: ["Estancia among Cafayate vineyards", "Adobe estancia in the Calchaquí Valleys"],
    description: "Torrontés vineyards, red canyons and valley trails under the northern sun.",
    photos: ["1657830823435-a787c6b73193", "1660866838729-bed5f8824b5c", "1660866838175-b5f136e1cb94", "1648160721431-5bdc57b69d89"],
  },
  {
    city: "Mina Clavero", lat: -31.7228, lng: -65.0067, propertyType: "house",
    titles: ["Country house in the Córdoba hills", "Ranch house in Traslasierra"],
    description: "Rivers, horseback rides and hikes through the sierras, far from the city.",
    photos: ["1694184023356-e1edfd130269", "1694183766192-43fd46afeb94", "1705783499448-d0bd4688cffd", "1582771642649-1feec8e95eb3"],
  },
] as const;

const GUEST_LINES = [
  "Hi! I just booked these dates. Is early check-in possible?",
  "Thanks! Is there parking nearby?",
  "Perfect, we'll arrive around 3pm.",
  "Could you share the wifi details before we arrive?",
  "Any restaurant you'd recommend around the area?",
  "We loved the place, thanks for everything!",
];

const HOST_LINES = [
  "Hi, welcome! Early check-in should be fine, I'll confirm the day before.",
  "Yes, there's a free spot right in front of the building.",
  "Great, I'll leave the keys with the doorman.",
  "Sure, it's on the fridge too. Let me know if you need anything else.",
  "Don't miss the parrilla on the corner, best in town.",
  "Thank you for staying! You're welcome back anytime.",
];

const REJECT_REASONS = [
  "Those dates are blocked for maintenance, sorry!",
  "I can't host a group of that size, sorry.",
];

// Same copy the worker writes (greenaway-worker/src/notifications/content.ts).
type CopyNames = { guest: string; host: string; listing: string };
type Copy = { title: string; body: (n: CopyNames) => string };
const NOTIFICATION_COPY = {
  created: { title: "New booking request", body: (n) => `${n.guest} requested a stay at “${n.listing}”.` },
  accepted: { title: "Booking confirmed", body: (n) => `${n.host} confirmed your stay at “${n.listing}”.` },
  rejected: { title: "Booking declined", body: (n) => `${n.host} declined your request for “${n.listing}”.` },
  cancelledByGuest: { title: "Booking cancelled", body: (n) => `${n.guest} cancelled their stay at “${n.listing}”.` },
  cancelledByHost: { title: "Booking cancelled", body: (n) => `${n.host} cancelled your stay at “${n.listing}”.` },
} satisfies Record<string, Copy>;

// Deterministic (mulberry32): the same shape on every run, relative to today.
let state = 20261006;
function random() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)];
const chance = (p: number) => random() < p;
function pickSome<T>(items: readonly T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const now = new Date();
const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
const dayFromToday = (offset: number) => new Date(today + offset * DAY);
const notAfterNow = (date: Date) => new Date(Math.min(date.getTime(), now.getTime() - HOUR));

// `notifications.created_at` is read from the ObjectId: mint it at the event's time.
function objectIdAt(date: Date) {
  const seconds = Math.floor(date.getTime() / 1000).toString(16).padStart(8, "0");
  const rest = Array.from({ length: 16 }, () => int(0, 15).toString(16)).join("");
  return new ObjectId(seconds + rest);
}

type SeedListing = ListingDocumentValues & { _id: ObjectId };
type SeedBooking = typeof bookings.$inferInsert & { id: string; created_at: Date };
type SeedNotification = Omit<NotificationDocument, "_id" | "created_at"> & { _id: ObjectId };

function makeListing(hostId: string, place: (typeof STAYS)[number], title: string): SeedListing {
  const beds = int(1, 4);
  return {
    _id: new ObjectId(),
    type: "accommodation",
    host_id: hostId,
    title,
    description: place.description,
    price: int(4, 35) * 10,
    location: {
      type: "Point",
      coordinates: [place.lng + (random() - 0.5) * 0.1, place.lat + (random() - 0.5) * 0.1],
      city: place.city,
      country: "Argentina",
      address: `Calle ${int(100, 9999)}`,
    },
    attributes: {
      beds,
      bathrooms: int(1, 3),
      max_guests: beds * 2,
      check_in_time: pick(["13:00", "14:00", "15:00"]),
      check_out_time: pick(["10:00", "11:00"]),
      amenities: pickSome(AMENITIES, int(3, 7)),
      minimum_nights: pick([1, 2]),
      property_type: place.propertyType,
    },
    photos: pickSome(place.photos, int(2, 4)).map(
      (id) => `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop`,
    ),
  };
}

// Disjoint windows per listing (days from today), so `no_overlap` always holds.
const SLOTS: { offset: number; nights: [number, number]; status: BookingStatus; p: number }[] = [
  { offset: -75, nights: [2, 5], status: "accepted", p: 0.7 },
  { offset: -40, nights: [2, 4], status: "accepted", p: 0.7 },
  { offset: -14, nights: [2, 4], status: "cancelled", p: 0.35 },
  { offset: -2, nights: [3, 5], status: "accepted", p: 0.3 },
  { offset: 8, nights: [2, 5], status: "accepted", p: 0.6 },
  { offset: 22, nights: [2, 4], status: "pending", p: 0.55 },
  { offset: 36, nights: [3, 5], status: "rejected", p: 0.25 },
];

function makeBookings(listing: SeedListing, guestIds: string[]): SeedBooking[] {
  return SLOTS.filter((slot) => chance(slot.p)).map((slot) => {
    const start = dayFromToday(slot.offset + int(0, 2));
    const nights = int(...slot.nights);
    const total = nights * listing.price;
    const created =
      slot.status === "pending"
        ? new Date(now.getTime() - int(2, 72) * HOUR)
        : notAfterNow(new Date(start.getTime() - int(5, 30) * DAY));
    const booking: SeedBooking = {
      id: randomUUID(),
      listing_id: listing._id.toHexString(),
      guest_id: pick(guestIds),
      start_date: start,
      end_date: new Date(start.getTime() + nights * DAY),
      guests: int(1, listing.attributes?.max_guests ?? 2),
      total_price: total,
      status: slot.status,
      created_at: created,
    };
    if (slot.status === "rejected") booking.status_reason = pick(REJECT_REASONS);
    if (slot.status === "cancelled") {
      const actor = chance(0.7) ? "guest" : "host";
      const at = notAfterNow(new Date(created.getTime() + int(1, 4) * DAY));
      booking.cancelled_by = actor;
      booking.cancelled_at = at;
      booking.refund_amount = refundFor({ status: "accepted", total_price: total, start_date: start }, actor, at);
    }
    return booking;
  });
}

// What the worker would have written for each transition: the party that didn't act gets it.
function makeNotifications(
  booking: SeedBooking,
  listing: SeedListing,
  nameOf: Map<string, string>,
): SeedNotification[] {
  const names = {
    guest: nameOf.get(booking.guest_id)!,
    host: nameOf.get(listing.host_id)!,
    listing: listing.title,
  };
  // The created notification predates the reason, so only the status changes carry it.
  const note = booking.status_reason ? ` Note: “${booking.status_reason}”` : "";
  const notify = (recipient: string, at: Date, copy: Copy, suffix = "") => ({
    _id: objectIdAt(at),
    listing_id: booking.listing_id,
    host_id: listing.host_id,
    guest_id: booking.guest_id,
    booking_id: booking.id,
    target_id: recipient,
    title: copy.title,
    body: copy.body(names) + suffix,
    is_read: now.getTime() - at.getTime() > 3 * DAY,
  });

  const created = notify(listing.host_id, booking.created_at, NOTIFICATION_COPY.created);
  const answeredAt = notAfterNow(new Date(booking.created_at.getTime() + int(2, 24) * HOUR));
  const cancelledAt = booking.cancelled_at as Date;
  switch (booking.status) {
    case "accepted":
    case "rejected":
      return [created, notify(booking.guest_id, answeredAt, NOTIFICATION_COPY[booking.status], note)];
    case "cancelled":
      return [
        created,
        booking.cancelled_by === "guest"
          ? notify(listing.host_id, cancelledAt, NOTIFICATION_COPY.cancelledByGuest, note)
          : notify(booking.guest_id, cancelledAt, NOTIFICATION_COPY.cancelledByHost, note),
      ];
    default:
      return [created];
  }
}

function makeChat(booking: SeedBooking, hostId: string) {
  const startedAt = notAfterNow(new Date(booking.created_at.getTime() + int(10, 120) * 60_000));
  const chat: Omit<ChatDocument, "_id"> = {
    booking_id: booking.id,
    guest_id: booking.guest_id,
    host_id: hostId,
    started_at: startedAt,
  };

  const messages: Omit<MessageDocument, "_id">[] = [];
  const turns = int(2, 6) * 2;
  let at = startedAt.getTime();
  for (let turn = 0; turn < turns && at < now.getTime(); turn++) {
    const fromGuest = turn % 2 === 0;
    const lines = fromGuest ? GUEST_LINES : HOST_LINES;
    messages.push({
      chat_id: booking.id,
      sender_id: fromGuest ? booking.guest_id : hostId,
      body: lines[Math.min(turn >> 1, lines.length - 1)],
      timestamp: new Date(at),
    });
    at += int(5, 600) * 60_000;
  }
  return { chat, messages };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5433,
    database: process.env.PGDATABASE,
  });
  const db = drizzle({ client: pool });
  const mongo = new MongoClient(uri);

  try {
    await mongo.connect();
    const listingsCol = mongo.db("listingsdb").collection<SeedListing>("listings");

    const [{ count }] = (await pool.query<{ count: string }>("SELECT count(*) FROM bookings")).rows;
    // Skipping (not failing) keeps `pnpm infra:up` safe to re-run on a seeded database.
    if (Number(count) > 0 || (await listingsCol.countDocuments()) > 0) {
      console.log("  – seed skipped: there is data already (`pnpm db:reset --yes` to start over)");
      return;
    }

    const password_hash = await hash(DEMO_PASSWORD, 10);
    const people = [
      ...HOSTS.map((user) => ({ ...user, is_host: true })),
      ...GUESTS.map((user) => ({ ...user, is_host: false })),
    ];
    await db
      .insert(users)
      .values(people.map((user) => ({ ...user, password_hash })))
      .onConflictDoNothing({ target: users.email });
    const seeded = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.email, people.map((user) => user.email)));
    const idOf = new Map(seeded.map((user) => [user.email, user.id]));
    const hostIds = HOSTS.map((host) => idOf.get(host.email)!);
    const guestIds = GUESTS.map((guest) => idOf.get(guest.email)!);
    const nameOf = new Map(people.map((user) => [idOf.get(user.email)!, user.name]));

    const listings = [0, 1]
      .flatMap((n) => STAYS.map((stay) => ({ stay, title: stay.titles[n] })))
      .map(({ stay, title }, i) => makeListing(hostIds[i % hostIds.length], stay, title));
    const seedBookings = listings.flatMap((listing) => makeBookings(listing, guestIds));
    const listingById = new Map(listings.map((listing) => [listing._id.toHexString(), listing]));

    const notifications = seedBookings.flatMap((booking) =>
      makeNotifications(booking, listingById.get(booking.listing_id)!, nameOf),
    );
    const conversations = seedBookings
      .filter((booking) => booking.status !== "rejected" && chance(0.7))
      .map((booking) => makeChat(booking, listingById.get(booking.listing_id)!.host_id));
    const readCursors: MessageReadCursor[] = conversations.flatMap(({ chat, messages }) =>
      messages.length === 0
        ? []
        : [chat.guest_id, chat.host_id].map((user_id) => ({
            user_id,
            chat_id: chat.booking_id,
            last_seen_at: messages[chance(0.6) ? messages.length - 1 : int(0, messages.length - 1)].timestamp,
          })),
    );

    await listingsCol.insertMany(listings);
    await db.insert(bookings).values(seedBookings);
    await mongo.db("notificationsdb").collection<SeedNotification>("notifications").insertMany(notifications);
    await mongo.db("chatsdb").collection<Omit<ChatDocument, "_id">>("chats").insertMany(conversations.map((c) => c.chat));
    await mongo
      .db("messagesdb")
      .collection<Omit<MessageDocument, "_id">>("messages")
      .insertMany(conversations.flatMap((c) => c.messages));
    for (const cursor of readCursors)
      await mongo
        .db("messagesdb")
        .collection<MessageReadCursor>("read_cursors")
        .updateOne({ user_id: cursor.user_id, chat_id: cursor.chat_id }, { $set: cursor }, { upsert: true });

    console.log(`  ✓ users:         ${people.length} (password: ${DEMO_PASSWORD})`);
    console.log(`  ✓ listings:      ${listings.length}`);
    console.log(`  ✓ bookings:      ${seedBookings.length}`);
    console.log(`  ✓ notifications: ${notifications.length}`);
    console.log(`  ✓ chats:         ${conversations.length} (${conversations.flatMap((c) => c.messages).length} messages)`);
  } finally {
    await mongo.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[seed]", error);
  process.exitCode = 1;
});
