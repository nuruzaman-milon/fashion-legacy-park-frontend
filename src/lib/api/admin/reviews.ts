import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Review moderation (`/admin/reviews`, bearer). Reviews are born PENDING;
 * approving publishes onto the product page and recalculates the product's
 * avgRating/reviewCount server-side (so does rejecting and deleting).
 */

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  adminReplyAt: string | null;
  helpfulCount: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
  rating?: number;
}

export async function listAdminReviews(
  params: ReviewListParams = {},
): Promise<Paginated<AdminReview>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.rating) qs.set("rating", String(params.rating));
  return apiFetch<Paginated<AdminReview>>(`/admin/reviews?${qs.toString()}`);
}

export async function setReviewStatus(
  id: string,
  status: Exclude<ReviewStatus, "PENDING">,
): Promise<AdminReview> {
  return apiFetch<AdminReview>(`/admin/reviews/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/** Shown on the product page under the review as the store's response. */
export async function replyToReview(
  id: string,
  reply: string,
): Promise<AdminReview> {
  return apiFetch<AdminReview>(`/admin/reviews/${id}/reply`, {
    method: "PATCH",
    body: { reply },
  });
}

export async function deleteReview(id: string): Promise<void> {
  await apiFetch(`/admin/reviews/${id}`, { method: "DELETE" });
}
