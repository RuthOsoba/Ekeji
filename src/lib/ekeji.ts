import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"] & { photo_urls?: string[] };
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const CATEGORIES = [
  "Dresses",
  "Two-pieces",
  "Gele",
  "Agbada",
  "Boubou",
  "Skirt",
  "Top",
  "Shirt",
  "Trousers",
  "Accessories",
] as const;

export const LANDING_CATEGORIES = CATEGORIES;

export const OCCASIONS = [
  "Wedding guest",
  "Traditional wedding",
  "Owambe",
  "Birthday celebration",
  "Engagement",
  "Graduation",
  "Evening event",
] as const;

/** Basic colours with a swatch value (real garment colour, not a theme token). */
export const BASIC_COLOURS: { name: string; swatch: string }[] = [
  { name: "Black", swatch: "oklch(0.2 0 0)" },
  { name: "White", swatch: "oklch(1 0 0)" },
  { name: "Blue", swatch: "oklch(0.5 0.17 255)" },
  { name: "Red", swatch: "oklch(0.55 0.21 27)" },
  { name: "Yellow", swatch: "oklch(0.87 0.17 95)" },
  { name: "Green", swatch: "oklch(0.55 0.15 150)" },
  { name: "Purple", swatch: "oklch(0.48 0.18 305)" },
  { name: "Pink", swatch: "oklch(0.78 0.12 350)" },
  { name: "Orange", swatch: "oklch(0.7 0.18 50)" },
  { name: "Brown", swatch: "oklch(0.45 0.08 55)" },
  { name: "Grey", swatch: "oklch(0.65 0 0)" },
  { name: "Gold", swatch: "oklch(0.72 0.12 85)" },
  { name: "Silver", swatch: "oklch(0.82 0.01 250)" },
];

export const COLOURS = BASIC_COLOURS.map((c) => c.name);

export const FABRICS = [
  "Lace",
  "Aso Oke",
  "Ankara",
  "Kente",
  "Beaded",
  "Satin",
  "Mikado",
  "Sego",
  "Guinea brocade",
] as const;

export const CONDITION_DETAILS: { name: string; description: string }[] = [
  { name: "Brand new", description: "Never worn, made and kept unused" },
  { name: "Excellent", description: "Worn a few times, pristine condition" },
  { name: "Very good", description: "Worn a few times, very light signs of wear" },
  { name: "Good", description: "Worn a few times, small marks or stains not easily visible" },
];

export const CONDITIONS = CONDITION_DETAILS.map((c) => c.name);

export type Department = "womens" | "mens";
export const DEPARTMENTS: { value: Department | "all"; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "womens", label: "Women's" },
  { value: "mens", label: "Men's" },
];


export const STRETCH_LEVELS = [
  "No stretch",
  "Low stretch",
  "Medium stretch",
  "High stretch",
] as const;

export const ALTERATION_LEVELS = [
  "Easily alterable",
  "May be alterable",
  "Not recommended",
] as const;

export const DELIVERY_OPTIONS = [
  "Evri ParcelShop / Locker",
  "Royal Mail Tracked",
  "Local collection",
] as const;

export const UK_SIZES = ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "S", "M", "L", "XL"] as const;

export interface ListingFilters {
  q: string;
  department: Department | "all";
  categories: string[];
  occasions: string[];
  colours: string[];
  fabrics: string[];
  conditions: string[];
  sizes: string[];
  stretch: string[];
  alteration: string[];
  delivery: string[];
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  bustMin: number | null;
  bustMax: number | null;
  waistMin: number | null;
  waistMax: number | null;
  hipMin: number | null;
  hipMax: number | null;
  lengthMin: number | null;
  lengthMax: number | null;
  heightMin: number | null;
  heightMax: number | null;
  recentOnly: boolean;
}

export const emptyFilters: ListingFilters = {
  q: "",
  department: "all",
  categories: [],
  occasions: [],
  colours: [],
  fabrics: [],
  conditions: [],
  sizes: [],
  stretch: [],
  alteration: [],
  delivery: [],
  location: "",
  minPrice: null,
  maxPrice: null,
  bustMin: null,
  bustMax: null,
  waistMin: null,
  waistMax: null,
  hipMin: null,
  hipMax: null,
  lengthMin: null,
  lengthMax: null,
  heightMin: null,
  heightMax: null,
  recentOnly: false,
};

export function countActiveFilters(f: ListingFilters): number {
  let n = 0;
  const lists: (keyof ListingFilters)[] = [
    "categories",
    "occasions",
    "colours",
    "fabrics",
    "conditions",
    "sizes",
    "stretch",
    "alteration",
    "delivery",
  ];
  for (const key of lists) n += (f[key] as string[]).length;
  const nums: (keyof ListingFilters)[] = [
    "minPrice",
    "maxPrice",
    "bustMin",
    "bustMax",
    "waistMin",
    "waistMax",
    "hipMin",
    "hipMax",
    "lengthMin",
    "lengthMax",
    "heightMin",
    "heightMax",
  ];
  for (const key of nums) if (f[key] !== null) n += 1;
  if (f.department !== "all") n += 1;
  if (f.location.trim()) n += 1;
  if (f.recentOnly) n += 1;
  return n;
}

function within(value: number | null, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true;
  if (value === null) return false;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function applyFilters(listings: Listing[], f: ListingFilters): Listing[] {
  const query = f.q.trim().toLowerCase();
  const location = f.location.trim().toLowerCase();

  return listings.filter((l) => {
    if (query) {
      const haystack = [
        l.title,
        l.description,
        l.colour,
        l.fabric,
        l.category,
        l.occasion,
        l.location,
        l.fabric_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (f.department !== "all" && l.department !== f.department) return false;
    if (f.categories.length && !f.categories.includes(l.category)) return false;
    if (f.occasions.length && !f.occasions.includes(l.occasion)) return false;
    if (f.colours.length && !f.colours.some((c) => l.colour.toLowerCase().includes(c.toLowerCase()))) return false;
    if (f.fabrics.length && !f.fabrics.some((x) => l.fabric.includes(x))) return false;
    if (f.conditions.length && !f.conditions.includes(l.condition)) return false;
    if (f.sizes.length && !(l.uk_size && f.sizes.includes(l.uk_size))) return false;
    if (f.stretch.length && !(l.stretch_level && f.stretch.includes(l.stretch_level))) return false;
    if (
      f.alteration.length &&
      !(l.alteration_potential && f.alteration.includes(l.alteration_potential))
    )
      return false;
    if (f.delivery.length && !f.delivery.some((d) => (l.delivery_options ?? []).includes(d)))
      return false;
    if (location && !(l.location ?? "").toLowerCase().includes(location)) return false;
    if (!within(l.price_pence / 100, f.minPrice, f.maxPrice)) return false;
    if (!within(num(l.bust_cm), f.bustMin, f.bustMax)) return false;
    if (!within(num(l.waist_cm), f.waistMin, f.waistMax)) return false;
    if (!within(num(l.hip_cm), f.hipMin, f.hipMax)) return false;
    if (!within(num(l.length_cm), f.lengthMin, f.lengthMax)) return false;
    if (!within(num(l.wearer_height_cm), f.heightMin, f.heightMax)) return false;
    if (f.recentOnly) {
      const age = Date.now() - new Date(l.created_at).getTime();
      if (age > 14 * 86_400_000) return false;
    }
    return true;
  });
}

export const PHOTO_BUCKET = "listing-photos";

/** Attach time-limited viewing links for seller-uploaded photos. */
async function withPhotos<T extends Listing>(rows: T[]): Promise<T[]> {
  const paths = rows.flatMap((r) => r.image_paths ?? []);
  if (!paths.length) return rows;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60 * 24);
  const map = new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({
    ...r,
    photo_urls: (r.image_paths ?? []).map((p) => map.get(p)).filter((u): u is string => !!u),
  }));
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw error;
  return withPhotos(data ?? []);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [withUrls] = await withPhotos([data]);
  return withUrls ?? null;
}

export async function fetchSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("listing_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id);
}

export async function toggleSaved(userId: string, listingId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("saved_items")
      .insert({ user_id: userId, listing_id: listingId });
    if (error) throw error;
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSellerListings(sellerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .in("status", ["active", "sold"])
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (error) throw error;
  return withPhotos((data ?? []) as Listing[]);
}
