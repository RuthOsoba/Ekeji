import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Review = Database["public"]["Tables"]["reviews"]["Row"] & {
  reviewer?: { display_name: string | null } | null;
};

const SELECT = "*, reviewer:profiles!reviews_reviewer_id_fkey(display_name)";

/** Public reviews of a seller (or, for sample listings with no seller, of that listing). */
export async function fetchSellerReviews(opts: { sellerId?: string | null | undefined; listingId?: string | undefined }) {
  let q = supabase.from("reviews").select(SELECT).eq("direction", "buyer_to_seller");
  if (opts.sellerId) q = q.eq("reviewee_id", opts.sellerId);
  else if (opts.listingId) q = q.eq("listing_id", opts.listingId);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function fetchOrderReviews(orderId: string) {
  const { data, error } = await supabase.from("reviews").select(SELECT).eq("order_id", orderId);
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export async function fetchMyReviews(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(SELECT)
    .or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export function averageRating(reviews: Review[]) {
  if (!reviews.length) return null;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}
