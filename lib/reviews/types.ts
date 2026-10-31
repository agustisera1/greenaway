import type { reviews } from "./tables";

export type Review = typeof reviews.$inferSelect;

export type NewReview = Pick<
  typeof reviews.$inferInsert,
  "listing_id" | "author_name" | "rating" | "comment"
>;

export type ReviewStats = Pick<Review, "listing_id"> & { rating_avg: number; count: number };
