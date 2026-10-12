import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, Share2, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { FitPill } from "@/components/ekeji/FitPill";
import { UnitToggle } from "@/components/ekeji/FiltersPanel";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchListing, fetchListings } from "@/lib/ekeji";
import { gbp, measure, relativeDate, type Unit } from "@/lib/format";
import { fitGuidance, FIT_DISCLAIMER, MEASUREMENT_DISCLAIMER } from "@/lib/fit";
import { listingGallery } from "@/lib/listing-images";
import { useFitProfile, useSaved, useSession } from "@/hooks/useEkejiUser";
import { startConversation } from "@/lib/messages";
import { fetchSellerReviews } from "@/lib/reviews";
import { ReviewCard } from "@/components/ekeji/Reviews";

export const Route = createFileRoute("/listing/$id")({
  head: () => ({
    meta: [
      { title: "Outfit details — Ekeji" },
      {
        name: "description",
        content:
          "Full garment measurements, fabric and tailoring details for a pre-loved African occasionwear piece on Ekeji.",
      },
      { property: "og:title", content: "Outfit details — Ekeji" },
      {
        property: "og:description",
        content: "See the full fit and measurements card before you buy on Ekeji.",
      },
    ],
  }),
  component: ListingDetail,
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary">This outfit is no longer listed</h1>
        <Button asChild className="mt-6">
          <Link to="/explore">Explore other outfits</Link>
        </Button>
      </div>
    </AppShell>
  ),
});

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function ListingDetail() {
  const { id } = Route.useParams();
  const [unit, setUnit] = useState<Unit>("cm");
  const [activeImage, setActiveImage] = useState(0);
  const { isSaved, toggle, signedIn } = useSaved();
  const { user } = useSession();
  const navigate = useNavigate();
  const fitProfile = useFitProfile();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const result = await fetchListing(id);
      if (!result) throw notFound();
      return result;
    },
  });
  const { data: all = [] } = useQuery({ queryKey: ["listings"], queryFn: fetchListings });
  const { data: sellerReviews = [] } = useQuery({
    queryKey: ["reviews", "seller", listing?.seller_id ?? listing?.id],
    queryFn: () => fetchSellerReviews({ sellerId: listing?.seller_id, listingId: listing?.id }),
    enabled: !!listing,
  });

  if (isLoading || !listing) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground md:px-8">
          Loading outfit…
        </div>
      </AppShell>
    );
  }

  type View = { src: string; label: string; zoom: number; pos: string };
  const gallery: View[] = listing.photo_urls?.length
    ? listing.photo_urls.map((src, i) => ({ src, label: `Photo ${i + 1}`, zoom: 1, pos: "center" }))
    : (() => {
        const src = listingGallery(listing.image_key)[0]!;
        return [
          { src, label: "Full look", zoom: 1, pos: "center" },
          { src, label: "Neckline and bodice", zoom: 2.2, pos: "50% 28%" },
          { src, label: "Waist detail", zoom: 2.4, pos: "50% 48%" },
          { src, label: "Fabric close-up", zoom: 3.2, pos: "40% 60%" },
          { src, label: "Hem and length", zoom: 2, pos: "50% 90%" },
        ];
      })();
  const current = gallery[activeImage] ?? gallery[0]!;
  const similar = all.filter((l) => l.id !== listing.id && l.occasion === listing.occasion).slice(0, 3);
  const guidance = fitGuidance(
    {
      bust_cm: listing.bust_cm === null ? null : Number(listing.bust_cm),
      waist_cm: listing.waist_cm === null ? null : Number(listing.waist_cm),
      hip_cm: listing.hip_cm === null ? null : Number(listing.hip_cm),
      stretch_level: listing.stretch_level,
    },
    fitProfile,
  );
  const saved = signedIn && isSaved(listing.id);

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: listing!.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Listing link copied");
      }
    } catch {
      toast.error("Could not share this listing");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden bg-muted">
              <img
                src={current.src}
                alt={`${listing.title} — ${current.label}`}
                width={768}
                height={1024}
                style={{ transform: `scale(${current.zoom})`, transformOrigin: current.pos }}
                className="aspect-[3/4] w-full object-cover transition-transform duration-500"
              />
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {gallery.map((view, index) => (
                <button
                  key={`${view.src}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show ${view.label}`}
                  aria-current={activeImage === index}
                  className={`h-20 w-16 shrink-0 overflow-hidden border ${
                    activeImage === index ? "border-primary" : "border-border"
                  }`}
                >
                  <img
                    src={view.src}
                    alt=""
                    loading="lazy"
                    style={{ transform: `scale(${view.zoom})`, transformOrigin: view.pos }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{current.label}</p>
          </div>

          {/* Summary */}
          <div>
            <p className="eyebrow">
              {listing.occasion} · {relativeDate(listing.created_at)}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight text-primary md:text-4xl">
              {listing.title}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{gbp(listing.price_pence)}</span>
              {listing.original_price_pence && (
                <span className="text-sm text-muted-foreground line-through">
                  {gbp(listing.original_price_pence)} originally
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {listing.condition}
              {listing.uk_size ? ` · ${listing.uk_size}` : ""} · {listing.colour} · {listing.fabric}
            </p>

            {guidance && (
              <div className="mt-5 border border-border bg-card p-4">
                <FitPill label={guidance.label} />
                <p className="mt-2.5 text-sm">{guidance.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{FIT_DISCLAIMER}</p>
              </div>
            )}
            {!guidance && (
              <div className="mt-5 border border-dashed border-gold/50 bg-gold/5 p-4">
                <p className="text-sm">
                  Add your measurements to see fit guidance on every outfit.
                </p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/fit">Find your fit</Link>
                </Button>
              </div>
            )}

            {/* Seller */}
            <div className="mt-6 flex items-center gap-3 border-y border-border py-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-primary">
                {listing.seller_name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                {listing.seller_id ? (
                  <Link to="/profile/$id" params={{ id: listing.seller_id }} className="block truncate text-sm font-semibold hover:text-primary">
                    {listing.seller_name}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold">{listing.seller_name}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                  {Number(listing.seller_rating).toFixed(1)} · {listing.seller_review_count} reviews ·{" "}
                  {listing.seller_items_sold} sold
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {listing.status !== "active" ? (
                <Button size="lg" className="flex-1" disabled>
                  Sold
                </Button>
              ) : signedIn ? (
                <Button asChild size="lg" className="flex-1">
                  <Link to="/checkout/$id" params={{ id: listing.id }}>Buy now</Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="flex-1">
                  <Link to="/auth" search={{ mode: "signin" }}>Log in to buy</Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  if (!user) {
                    navigate({ to: "/auth", search: { mode: "signin" } });
                    return;
                  }
                  if (listing.seller_id === user.id) {
                    toast("This is your own listing");
                    return;
                  }
                  try {
                    const cid = await startConversation(listing.id, user.id);
                    navigate({ to: "/messages/$id", params: { id: cid } });
                  } catch {
                    toast.error("Couldn't open the conversation. Please try again.");
                  }
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                Message seller
              </Button>
            </div>
            <div className="mt-3 flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!signedIn) {
                    void navigate({ to: "/auth", search: { mode: "signin" } });
                    return;
                  }
                  void toggle(listing.id);
                }}
                aria-pressed={saved}
              >
                <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-primary" : ""}`} aria-hidden />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void share()}>
                <Share2 className="mr-2 h-4 w-4" aria-hidden />
                Share
              </Button>
            </div>

            {/* Delivery */}
            <div className="mt-6 space-y-2 border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-gold" aria-hidden />
                Estimated delivery in 3 to 5 days
              </p>
              <p className="text-sm text-muted-foreground">
                Ships from {listing.location ? `${listing.location}, UK` : "the UK"}
              </p>
              <p className="text-sm text-muted-foreground">
                {(listing.delivery_options ?? []).join(" · ")}
              </p>
              <p className="text-xs font-semibold text-success">Tracked delivery only</p>
            </div>
          </div>
        </div>

        {/* Fit & measurements */}
        <section className="mt-14 border border-gold/50 bg-card p-5 shadow-editorial md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-primary md:text-3xl">Fit &amp; measurements</h2>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="eyebrow">Garment measurements</h3>
              <dl className="mt-3">
                <Row label="Standard size" value={listing.uk_size} />
                <Row label="Garment bust" value={measure(listing.bust_cm as number | null, unit)} />
                <Row label="Garment waist" value={measure(listing.waist_cm as number | null, unit)} />
                <Row label="Garment hip" value={measure(listing.hip_cm as number | null, unit)} />
                <Row label="Shoulder width" value={measure(listing.shoulder_cm as number | null, unit)} />
                <Row label="Sleeve length" value={measure(listing.sleeve_cm as number | null, unit)} />
                <Row label="Dress length" value={measure(listing.length_cm as number | null, unit)} />
              </dl>
            </div>
            <div>
              <h3 className="eyebrow">Original wearer &amp; construction</h3>
              <dl className="mt-3">
                <Row
                  label="Original wearer height"
                  value={measure(listing.wearer_height_cm as number | null, unit)}
                />
                <Row label="Stretch level" value={listing.stretch_level} />
                <Row label="Closure" value={listing.closure} />
                <Row label="Structure" value={listing.structure} />
                <Row label="Alteration potential" value={listing.alteration_potential} />
              </dl>
            </div>
          </div>

          {listing.fit_notes && (
            <div className="mt-6 border-l-2 border-gold pl-4">
              <h3 className="eyebrow">Fit notes from the seller</h3>
              <p className="mt-2 text-sm leading-relaxed">{listing.fit_notes}</p>
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">{MEASUREMENT_DISCLAIMER}</p>
        </section>

        {/* Detail sections */}
        <Accordion type="multiple" className="mt-12" defaultValue={["about"]}>
          <AccordionItem value="about">
            <AccordionTrigger className="font-display text-lg">About this outfit</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="fabric">
            <AccordionTrigger className="font-display text-lg">
              Fabric and craftsmanship
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {listing.fabric_notes}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="condition">
            <AccordionTrigger className="font-display text-lg">Condition notes</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {listing.condition} — {listing.condition_notes}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="included">
            <AccordionTrigger className="font-display text-lg">What is included</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {listing.included}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="delivery">
            <AccordionTrigger className="font-display text-lg">
              Delivery and packaging
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>Tracked delivery on every Ekeji order. Buyers pay for delivery at checkout.</p>
              <p>
                Sellers protect embellishments with tissue, use a waterproof inner bag and a strong
                outer mailer or box for boned and beaded pieces.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="reviews">
            <AccordionTrigger className="font-display text-lg">Seller reviews</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <p className="flex items-center gap-1 text-foreground">
                <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
                {Number(listing.seller_rating).toFixed(1)} from {listing.seller_review_count} reviews
              </p>
              {sellerReviews.length === 0 ? (
                <p className="mt-3">No written reviews yet. Reviews appear once an order is complete.</p>
              ) : (
                sellerReviews.slice(0, 5).map((r) => <ReviewCard key={r.id} review={r} />)
              )}
              {listing.seller_id && (
                <Link to="/profile/$id" params={{ id: listing.seller_id }} className="mt-3 inline-block text-primary underline-offset-4 hover:underline">
                  See seller profile
                </Link>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-primary md:text-3xl">Similar listings</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
              {similar.map((item) => (
                <ListingCard key={item.id} listing={item} fitProfile={fitProfile} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
