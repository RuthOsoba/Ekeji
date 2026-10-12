import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, fetchListings } from "@/lib/ekeji";
import { useFitProfile, useProfile, useSaved } from "@/hooks/useEkejiUser";
import { FIT_DISCLAIMER } from "@/lib/fit";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your Ekeji home" },
      {
        name: "description",
        content: "Recently listed and trending pre-loved African occasionwear, picked for you.",
      },
      { property: "og:title", content: "Your Ekeji home" },
      { property: "og:description", content: "Recently listed and trending occasionwear on Ekeji." },
    ],
  }),
  component: HomePage,
});

const editorial = [
  { title: "Wedding guest looks under £150", search: "wedding" },
  { title: "Emerald green for your next owambe", search: "emerald" },
  { title: "Ready-to-wear looks for October celebrations", search: "gown" },
  { title: "Corset gowns with alteration potential", search: "corset" },
];

function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: listings = [] } = useQuery({ queryKey: ["listings"], queryFn: fetchListings });
  const { data: profile } = useProfile();
  const { isSaved, toggle } = useSaved();
  const fitProfile = useFitProfile();

  const recent = listings.slice(0, 6);
  const trending = listings.filter((l) => l.trending).slice(0, 6);
  const firstName = profile?.first_name ?? profile?.display_name ?? "there";
  const intent = profile?.intent;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl text-primary md:text-4xl">
          Hello {firstName}, what are you celebrating next?
        </h1>

        <form
          className="mt-6 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/explore", search: query.trim() ? { q: query.trim() } : {} });
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              aria-label="Search outfits"
              placeholder="Search dresses, fabrics, colours, events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {intent === "sell" && (
          <div className="mt-6 border border-gold/50 bg-gold/5 p-5">
            <h2 className="font-display text-xl">Ready to list your first outfit?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Accurate measurements help your outfit find its next perfect outing.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/sell">Sell your outfit</Link>
            </Button>
          </div>
        )}

        {!fitProfile && (
          <div className="mt-6 border border-border bg-card p-5">
            <h2 className="font-display text-xl">Add your measurements</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              See fit guidance on every listing. {FIT_DISCLAIMER}
            </p>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/fit">Find your fit</Link>
            </Button>
          </div>
        )}

        <div className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                to="/explore"
                search={{ q: category }}
                className="shrink-0 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs transition-colors hover:border-primary"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-primary md:text-3xl">Recently listed</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {recent.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                fitProfile={fitProfile}
                saved={isSaved(listing.id)}
                onToggleSave={(id) => void toggle(id)}
              />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary md:text-3xl">Trending now</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {trending.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                fitProfile={fitProfile}
                saved={isSaved(listing.id)}
                onToggleSave={(id) => void toggle(id)}
              />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary md:text-3xl">Edits to browse</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {editorial.map((edit) => (
              <Link
                key={edit.title}
                to="/explore"
                search={{ q: edit.search }}
                className="card-editorial flex items-center justify-between gap-4 p-6 transition-colors hover:border-primary"
              >
                <span className="font-display text-lg">{edit.title}</span>
                <span className="eyebrow shrink-0">View</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
