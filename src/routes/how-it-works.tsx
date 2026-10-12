import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import buyBrowseImage from "@/assets/how-buy-browse.jpg";
import buyPurchaseImage from "@/assets/how-buy-purchase.jpg";
import buyRewearImage from "@/assets/how-buy-rewear.jpg";
import sellDetailImage from "@/assets/how-sell-detail.jpg";
import sellListImage from "@/assets/how-sell-list.jpg";
import sellShipImage from "@/assets/how-sell-ship.jpg";
import { AppShell } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Ekeji works — Buy and sell Aso Ebi" },
      {
        name: "description",
        content: "Discover how Ekeji helps beautifully made Aso Ebi find another celebration through exact measurements and tracked delivery.",
      },
      { property: "og:title", content: "How Ekeji works — Buy and sell Aso Ebi" },
      {
        property: "og:description",
        content: "Three simple steps to buy or sell pre-loved African occasionwear on Ekeji.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

const buySteps = [
  {
    title: "Find the right piece",
    body: "Browse by exact garment measurements, fabric and fit details—not a size label alone.",
    image: buyBrowseImage,
    alt: "A woman browsing a rail of richly detailed African occasionwear",
  },
  {
    title: "Purchase with confidence",
    body: "Review the seller’s photographs and tailoring notes, then choose tracked delivery.",
    image: buyPurchaseImage,
    alt: "A woman purchasing an embroidered outfit on her phone",
  },
  {
    title: "Receive, review and rewear",
    body: "Follow the parcel to your door, leave a review and give the outfit its next celebration.",
    image: buyRewearImage,
    alt: "A woman wearing burgundy and gold Aso Ebi at a celebration",
  },
];

const sellSteps = [
  {
    title: "Describe every detail",
    body: "Share the story, fabric, condition and exact garment measurements a buyer needs.",
    image: sellDetailImage,
    alt: "A woman measuring an emerald lace gown",
  },
  {
    title: "Set your price and list",
    body: "Add clear photographs, set a fair price and publish the outfit to the marketplace.",
    image: sellListImage,
    alt: "A woman photographing a gold embroidered gown for a listing",
  },
  {
    title: "Pack carefully and send",
    body: "Protect the craftsmanship, use tracked postage and help the buyer follow its journey.",
    image: sellShipImage,
    alt: "A woman carefully packing an embellished outfit for delivery",
  },
];

function HowItWorksPage() {
  return (
    <AppShell>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center md:px-8 md:py-24">
          <p className="eyebrow">From one celebration to the next</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight text-primary md:text-6xl">
            Beautifully made. Ready to be worn again.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Ekeji is a home for pre-loved Aso Ebi and African occasionwear—pieces made with care,
            memory and craftsmanship that deserve more than one outing.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[0.7fr_1.3fr] md:px-8 md:py-20">
        <div>
          <p className="eyebrow">The name</p>
          <h2 className="mt-3 font-brand text-4xl text-primary">Ekeji</h2>
        </div>
        <div className="space-y-4 text-base leading-relaxed text-foreground/80 md:text-lg">
          <p>
            Ekeji is built around a simple belief: meaningful Aso Ebi should keep gathering stories.
            An outfit worn once can become someone else’s perfect look for a wedding, birthday or owambe.
          </p>
          <p>
            Because many pieces are bespoke, we put exact garment measurements, fabric and tailoring
            details at the centre—making it easier to understand fit before buying.
          </p>
        </div>
      </section>

      <Journey title="Buy" intro="Your next outfit may already be waiting." steps={buySteps} />
      <Journey title="Sell" intro="Someone’s next celebration may be in your wardrobe." steps={sellSteps} alternate />

      <section className="bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between md:px-8">
          <h2 className="max-w-xl font-display text-3xl text-primary-foreground md:text-4xl">
            Choose the outfit’s next chapter.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/explore">Browse outfits</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/sell">Sell your outfit</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Journey({
  title,
  intro,
  steps,
  alternate = false,
}: {
  title: string;
  intro: string;
  steps: typeof buySteps;
  alternate?: boolean;
}) {
  return (
    <section className={alternate ? "border-y border-border bg-secondary/30" : "border-t border-border"}>
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="eyebrow">Your pathway</p>
            <h2 className="mt-2 font-display text-4xl text-primary md:text-5xl">{title}</h2>
          </div>
          <p className="max-w-sm text-right text-sm text-muted-foreground">{intro}</p>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title}>
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={step.image}
                  alt={step.alt}
                  width={1200}
                  height={1504}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 motion-safe:hover:scale-[1.02]"
                />
              </div>
              <div className="mt-4 flex gap-4">
                <span className="eyebrow pt-1">0{index + 1}</span>
                <div>
                  <h3 className="font-display text-xl text-primary">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <Button asChild variant="link" className="mt-8 px-0 text-primary">
          <Link to={title === "Buy" ? "/explore" : "/sell"}>
            {title === "Buy" ? "Browse outfits" : "Start selling"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}