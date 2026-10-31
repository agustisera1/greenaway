// Payload thin (sólo ids): el relay rehidrata al publicar. Un tipo nuevo se suma también a `EVENTS`
// en el worker (`src/outbox/fan-out.ts`); uno que no conoce lo descarta con un log.
export type OutboxEventType =
  | "booking.created"
  | "booking.accepted"
  | "booking.rejected"
  | "booking.cancelled";

export type OutboxEvent = {
  type: OutboxEventType;
  // Opcional: hay eventos que no necesitan más que el `aggregate_id` para que el
  // relay rehidrate. Los repos lo escriben como `{}` cuando falta.
  payload?: Record<string, unknown>;
};
