import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import heroImage from "@/assets/hero-celebration.jpg";
import { AppShell } from "@/components/ekeji/SiteChrome";
import { MarketplaceBrowser } from "@/components/ekeji/MarketplaceBrowser";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ekeji — Shop pre-loved African occasionwear" },
      {
        name: "description",
        content:
          "Ekeji is a UK marketplace for pre-loved Aso Ebi and African occasionwear, with detailed garment measurements for bespoke pieces.",
      },
      { property: "og:title", content: "Ekeji — Shop pre-loved African occasionwear" },
      {
        property: "og:description",
        content:
          "Buy and sell pre-loved Aso Ebi and African occasionwear, beautifully made for life's biggest celebrations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      <section className="relative isolate flex min-h-56 items-center overflow-hidden border-b border-border md:min-h-72">
        <img
          src={heroImage}
          alt="Guests in emerald, burgundy and gold African occasionwear at a celebration"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-[68%_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-primary/20" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
          <div className="max-w-lg">
            <p className="eyebrow">Pre-loved African occasionwear</p>
            <h1 className="mt-3 font-display text-3xl leading-tight text-primary md:text-5xl">
              Every outfit deserves a second outing.
            </h1>
            <div className="mt-5 flex flex-col items-start gap-2">
              <Button asChild>
                <Link to="/sell">Sell your outfit</Link>
              </Button>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline decoration-gold underline-offset-4"
              >
                Learn how it works <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <MarketplaceBrowser />
    </AppShell>
  );
}
