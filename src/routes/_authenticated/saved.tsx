import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { Button } from "@/components/ui/button";
import { fetchListings } from "@/lib/ekeji";
import { useFitProfile, useSaved } from "@/hooks/useEkejiUser";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved outfits — Ekeji" },
      { name: "description", content: "The occasionwear you have saved on Ekeji." },
      { property: "og:title", content: "Saved outfits — Ekeji" },
      { property: "og:description", content: "Keep track of the outfits you love on Ekeji." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { data: listings = [] } = useQuery({ queryKey: ["listings"], queryFn: fetchListings });
  const { savedIds, isSaved, toggle } = useSaved();
  const fitProfile = useFitProfile();

  const saved = listings.filter((l) => savedIds.includes(l.id));

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <h1 className="font-display text-3xl text-primary md:text-4xl">Saved outfits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {saved.length === 0
            ? "Nothing saved yet."
            : `${saved.length} outfit${saved.length === 1 ? "" : "s"} waiting for you.`}
        </p>

        {saved.length === 0 ? (
          <div className="mt-10 border border-border bg-card p-8 text-center">
            <h2 className="font-display text-xl">Start a collection</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the heart on any outfit to keep it here while you decide.
            </p>
            <Button asChild className="mt-5">
              <Link to="/explore">Explore outfits</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {saved.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                fitProfile={fitProfile}
                saved={isSaved(listing.id)}
                onToggleSave={(id) => void toggle(id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
