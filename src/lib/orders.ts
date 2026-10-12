import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PHOTO_BUCKET } from "@/lib/ekeji";

export type Order = Database["public"]["Tables"]["orders"]["Row"] & { photo_url?: string | null };
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export const BUYER_STAGES = [
  "Order confirmed",
  "Seller preparing parcel",
  "Dropped off",
  "In transit",
  "Delivered",
  "Issue window open",
  "Complete",
] as const;

export const SELLER_STAGES = [
  "Sold",
  "Label ready",
  "Drop off by date",
  "In transit",
  "Delivered",
  "Payout pending",
  "Payout complete",
] as const;

/** Mock delivery prices for the prototype. */
export const DELIVERY_PRICES: Record<string, number> = {
  "Evri ParcelShop / Locker": 319,
  "Royal Mail Tracked": 449,
  "Local collection": 0,
};

/** Ekeji service fee: 5% of the item price plus 70p. */
export function serviceFee(itemPence: number): number {
  return Math.round(itemPence * 0.05) + 70;
}

export const SERVICE_FEE_COPY =
  "The Ekeji service fee helps us provide secure payments, tracked delivery and a trusted community.";

export const PACKAGING_CHECKLIST = [
  "Photograph the item before packing",
  "Protect embellishments with tissue or soft material",
  "Use a waterproof inner bag",
  "Use a strong outer mailing bag or box",
  "Use a box for heavily embellished, boned or delicate pieces",
  "Keep your drop-off receipt until payout is complete",
];

export const ISSUE_TYPES = [
  "Parcel not arrived",
  "Parcel arrived damaged",
  "Item significantly different from listing",
] as const;

export function fakeTracking(): string {
  const n = Math.floor(Math.random() * 1e10).toString().padStart(10, "0");
  return `EK${n}GB`;
}

async function withPhotos(rows: Order[]): Promise<Order[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p);
  if (!paths.length) return rows;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60 * 24);
  const map = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({ ...r, photo_url: r.image_path ? map.get(r.image_path) ?? null : null }));
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return withPhotos(data ?? []);
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await withPhotos([data]))[0] ?? null;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}
