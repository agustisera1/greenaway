import { parseTs } from "@/lib/shared/dates";

type Stay = { start_date: string; end_date: string };

function endTime(b: Stay) {
  return parseTs(b.end_date)?.getTime() ?? 0;
}
function startTime(b: Stay) {
  return parseTs(b.start_date)?.getTime() ?? 0;
}

// Upcoming (soonest first), then past stays (most recent first).
export function sortByProximity<T extends Stay>(bookings: T[], now: number): T[] {
  const upcoming = bookings
    .filter((b) => endTime(b) >= now)
    .sort((a, b) => startTime(a) - startTime(b));
  const past = bookings
    .filter((b) => endTime(b) < now)
    .sort((a, b) => endTime(b) - endTime(a));
  return [...upcoming, ...past];
}

export function sortByNewest<T extends { created_at: string }>(bookings: T[]): T[] {
  const createdTime = (b: T) => parseTs(b.created_at)?.getTime() ?? 0;
  return [...bookings].sort((a, b) => createdTime(b) - createdTime(a));
}
