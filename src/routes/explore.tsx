import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { MarketplaceBrowser } from "@/components/ekeji/MarketplaceBrowser";

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Explore outfits — Ekeji" },
      {
        name: "description",
        content:
          "Search pre-loved African occasionwear by fabric, colour and exact garment measurements in centimetres or inches.",
      },
      { property: "og:title", content: "Explore outfits — Ekeji" },
      {
        property: "og:description",
        content: "Filter pre-loved Aso Ebi and occasionwear by garment measurements, fabric and colour.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { q } = Route.useSearch();
  return (
    <AppShell>
      <header className="bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <p className="eyebrow">Browse the marketplace</p>
          <h1 className="mt-2 font-display text-3xl text-primary md:text-4xl">Explore outfits</h1>
        </div>
      </header>
      <MarketplaceBrowser initialQuery={q ?? ""} />
    </AppShell>
  );
}
