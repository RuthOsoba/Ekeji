import emerald from "@/assets/listing-emerald.jpg";
import burgundy from "@/assets/listing-burgundy.jpg";
import gold from "@/assets/listing-gold.jpg";
import lilac from "@/assets/listing-lilac.jpg";
import navy from "@/assets/listing-navy.jpg";
import pink from "@/assets/listing-pink.jpg";
import champagne from "@/assets/listing-champagne.jpg";
import ivory from "@/assets/listing-ivory.jpg";

export const listingImages: Record<string, string> = {
  emerald,
  burgundy,
  gold,
  lilac,
  navy,
  pink,
  champagne,
  ivory,
};

export function listingImage(key: string | null | undefined): string {
  return (key && listingImages[key]) || emerald;
}

/** Gallery for the detail page: the listing photo plus complementary shots. */
export function listingGallery(key: string | null | undefined): string[] {
  const keys = Object.keys(listingImages);
  const main = key && listingImages[key] ? key : "emerald";
  const others = keys.filter((k) => k !== main).slice(0, 4);
  return [main, ...others].map((k) => listingImages[k]!);
}
