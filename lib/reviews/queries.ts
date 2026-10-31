import { authorize } from "@/lib/auth/session";
import type { ServiceResult } from "@/lib/shared/result";
import * as repo from "./repository";
import type { Review, ReviewStats } from "./types";

export async function getListingReviews(listingId: string): Promise<ServiceResult<Review[]>> {
  const auth = await authorize("reviews:list");
  if (!auth.ok) return auth;

  try {
    const reviews = await repo.findReviewsByListingId(listingId);
    return { ok: true, data: reviews };
  } catch (error) {
    console.error("[getListingReviews]", error);
    return { ok: false, error: "Could not retrieve the reviews", code: "UNEXPECTED" };
  }
}

export async function getListingsReviewStats(
  listingIds: string[],
): Promise<ServiceResult<ReviewStats[]>> {
  const auth = await authorize("reviews:list");
  if (!auth.ok) return auth;

  try {
    return { ok: true, data: await repo.findReviewStatsByListingIds(listingIds) };
  } catch (error) {
    console.error("[getListingsReviewStats]", error);
    return { ok: false, error: "Could not retrieve the review stats", code: "UNEXPECTED" };
  }
}
