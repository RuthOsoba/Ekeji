import { listingImage } from "@/lib/listing-images";
import type { Order } from "@/lib/orders";

export function OrderThumb({ order, className = "h-20 w-16" }: { order: Order; className?: string }) {
  return (
    <img
      src={order.photo_url ?? listingImage(order.image_key)}
      alt={order.listing_title}
      className={`${className} shrink-0 object-cover`}
      loading="lazy"
    />
  );
}
