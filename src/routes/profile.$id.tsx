import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Star } from "lucide-react";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { ReviewCard } from "@/components/ekeji/Reviews";
import { Button } from "@/components/ui/button";
import { fetchProfile, fetchSellerListings } from "@/lib/ekeji";
import { averageRating, fetchSellerReviews } from "@/lib/reviews";
import { useFitProfile } from "@/hooks/useEkejiUser";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({
    meta: [
      { title: "Seller profile — Ekeji" },
      { name: "description", content: "Browse this Ekeji member's pre-loved Aso Ebi and occasionwear, ratings and reviews." },
      { property: "og:title", content: "Seller profile — Ekeji" },
      { property: "og:description", content: "Pre-loved African occasionwear, ratings and reviews from verified buyers." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Tab = "active" | "sold" | "reviews";

function ProfilePage() {
  const { id } = Route.useParams();
  const fitProfile = useFitProfile();
  const [tab, setTab] = useState<Tab>("active");
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile", id], queryFn: () => fetchProfile(id) });
  const { data: listings = [] } = useQuery({ queryKey: ["seller-listings", id], queryFn: () => fetchSellerListings(id) });
  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", "seller", id], queryFn: () => fetchSellerReviews({ sellerId: id }) });

  if (isLoading) return <AppShell><p className="px-4 py-20 text-center text-sm text-muted-foreground">Loading profile…</p></AppShell>;
  if (!profile) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-primary">Profile not found</h1>
          <Button asChild className="mt-6"><Link to="/explore">Explore outfits</Link></Button>
        </div>
      </AppShell>
    );
  }

  const active = listings.filter((l) => l.status === "active");
  const sold = listings.filter((l) => l.status === "sold");
  const avg = averageRating(reviews);
  const name = profile.display_name ?? "Ekeji member";
  const shown = tab === "active" ? active : sold;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full bg-secondary font-display text-4xl text-primary">
              {name.slice(0, 1)}
            </div>
          )}
          <div className="flex-1">
            <p className="eyebrow">Ekeji member</p>
            <h1 className="mt-1 font-display text-3xl text-primary md:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
              <span>Joined {new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-center">
            <div>
              <dt className="text-xs text-muted-foreground">Rating</dt>
              <dd className="mt-1 flex items-center justify-center gap-1 font-display text-2xl">
                <Star className="h-4 w-4 fill-gold text-gold" />{avg ?? "–"}
              </dd>
            </div>
            <div><dt className="text-xs text-muted-foreground">Reviews</dt><dd className="mt-1 font-display text-2xl">{reviews.length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Sold</dt><dd className="mt-1 font-display text-2xl">{sold.length}</dd></div>
          </dl>
        </header>

        <div className="mt-8 flex gap-6 border-b border-border" role="tablist">
          {([["active", `Active (${active.length})`], ["sold", `Sold (${sold.length})`], ["reviews", `Reviews (${reviews.length})`]] as const).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn("-mb-px border-b-2 pb-3 text-sm", tab === k ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "reviews" ? (
          <div className="mt-4 max-w-2xl">
            {reviews.length === 0 ? <p className="py-10 text-sm text-muted-foreground">No reviews yet.</p> : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-sm text-muted-foreground">{tab === "active" ? "No outfits for sale right now." : "Nothing sold yet."}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((l) => <ListingCard key={l.id} listing={l} fitProfile={fitProfile} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
