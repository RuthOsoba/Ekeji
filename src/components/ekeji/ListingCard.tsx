import { Link, useNavigate } from "@tanstack/react-router";
import { useSaved } from "@/hooks/useEkejiUser";
import { Heart } from "lucide-react";

import { gbp } from "@/lib/format";
import { fitGuidance, type FitProfile } from "@/lib/fit";
import { listingImage } from "@/lib/listing-images";
import type { Listing } from "@/lib/ekeji";
import { FitPill } from "./FitPill";

interface Props {
  listing: Listing;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  fitProfile?: FitProfile | null;
}

export function ListingCard({ listing, saved, onToggleSave, fitProfile }: Props) {
  const navigate = useNavigate();
  const { isSaved, toggle, signedIn } = useSaved();
  const isSavedNow = saved ?? (signedIn && isSaved(listing.id));
  function handleClick() {
    if (onToggleSave) return onToggleSave(listing.id);
    if (!signedIn) {
      void navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    void toggle(listing.id);
  }
  const guidance = fitGuidance(
    {
      bust_cm: listing.bust_cm === null ? null : Number(listing.bust_cm),
      waist_cm: listing.waist_cm === null ? null : Number(listing.waist_cm),
      hip_cm: listing.hip_cm === null ? null : Number(listing.hip_cm),
      stretch_level: listing.stretch_level,
    },
    fitProfile ?? null,
  );

  return (
    <article className="group relative">
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block overflow-hidden bg-muted"
      >
        <img
          src={listing.photo_urls?.[0] ?? listingImage(listing.image_key)}
          alt={listing.title}
          loading="lazy"
          width={768}
          height={1024}
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </Link>

      <button
        type="button"
        onClick={handleClick}
        aria-label={isSavedNow ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
        aria-pressed={isSavedNow}
        className="absolute right-3 top-3 flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-input bg-card/90 px-2.5 text-primary transition hover:bg-card"
      >
        <Heart className={`h-4 w-4 ${isSavedNow ? "fill-primary" : ""}`} aria-hidden />
        <span className="text-xs font-semibold tabular-nums">{listing.favourite_count}</span>
      </button>

      <div className="mt-3 space-y-1.5">
        {guidance && <FitPill label={guidance.label} />}
        <h3 className="font-display text-base leading-snug">
          <Link to="/listing/$id" params={{ id: listing.id }} className="hover:text-primary">
            {listing.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">
          {listing.uk_size ? `${listing.uk_size} · ` : ""}
          {listing.condition} · {listing.location}
        </p>
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{gbp(listing.price_pence)}</span>
          {listing.original_price_pence && (
            <span className="text-xs text-muted-foreground line-through">
              {gbp(listing.original_price_pence)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
