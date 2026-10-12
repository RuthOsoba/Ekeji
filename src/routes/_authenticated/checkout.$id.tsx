import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CreditCard, Loader2, Lock, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useEkejiUser";
import { fetchListing } from "@/lib/ekeji";
import { gbp } from "@/lib/format";
import { listingImage } from "@/lib/listing-images";
import { DELIVERY_PRICES, serviceFee, SERVICE_FEE_COPY } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/checkout/$id")({
  head: () => ({
    meta: [
      { title: "Checkout — Ekeji" },
      { name: "description", content: "Review your Ekeji order, delivery and total before placing it." },
      { property: "og:title", content: "Checkout — Ekeji" },
      { property: "og:description", content: "Secure checkout with tracked delivery on every Ekeji order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { data: listing, isLoading } = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });

  const [method, setMethod] = useState("");
  const [addr, setAddr] = useState({ name: "", line1: "", line2: "", city: "", postcode: "" });
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (listing && !method) setMethod(listing.delivery_options?.[0] ?? "Royal Mail Tracked");
  }, [listing, method]);
  useEffect(() => {
    if (profile)
      setAddr((a) => ({
        ...a,
        name: a.name || [profile.first_name, profile.last_name].filter(Boolean).join(" "),
        postcode: a.postcode || profile.postcode || "",
      }));
  }, [profile]);

  if (isLoading) {
    return (
      <AppShell>
        <p className="mx-auto max-w-5xl px-4 py-20 text-sm text-muted-foreground">Loading checkout…</p>
      </AppShell>
    );
  }

  if (!listing || listing.status !== "active" || listing.seller_id === user?.id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-primary">
            {listing?.seller_id === user?.id ? "This is your own listing" : "This outfit is no longer available"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/explore">Keep exploring</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const options = listing.delivery_options?.length ? listing.delivery_options : ["Royal Mail Tracked"];
  const delivery = DELIVERY_PRICES[method] ?? 449;
  const fee = serviceFee(listing.price_pence);
  const total = listing.price_pence + delivery + fee;
  const cover = listing.photo_urls?.[0] ?? listingImage(listing.image_key);
  const needsAddress = method !== "Local collection";

  async function placeOrder() {
    if (!user || !listing) return;
    if (!addr.name.trim() || (needsAddress && (!addr.line1.trim() || !addr.city.trim() || !addr.postcode.trim()))) {
      toast.error("Please complete your delivery address");
      return;
    }
    setPlacing(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        listing_title: listing.title,
        item_pence: listing.price_pence,
        delivery_method: method,
        delivery_pence: delivery,
        fee_pence: fee,
        total_pence: total,
        address_name: addr.name.trim(),
        address_line1: needsAddress ? addr.line1.trim() : "Local collection",
        address_line2: addr.line2.trim() || null,
        address_city: needsAddress ? addr.city.trim() : listing.location ?? "",
        address_postcode: addr.postcode.trim().toUpperCase() || "—",
      })
      .select("id")
      .single();
    setPlacing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["listings"] });
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    toast.success("Order confirmed");
    navigate({ to: "/orders/$id", params: { id: data.id }, search: { placed: true } });
  }

  const field = (key: keyof typeof addr, label: string, optional = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label}
        {optional && <span className="text-muted-foreground"> (optional)</span>}
      </Label>
      <Input id={key} value={addr[key]} onChange={(e) => setAddr({ ...addr, [key]: e.target.value })} />
    </div>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 font-display text-3xl text-primary md:text-4xl">Complete your order</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-lg">Delivery option</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={method === o}
                    onClick={() => setMethod(o)}
                    className={`flex items-center justify-between border p-4 text-left text-sm ${
                      method === o ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gold" /> {o}
                    </span>
                    <span className="font-semibold">{DELIVERY_PRICES[o] ? gbp(DELIVERY_PRICES[o]!) : "Free"}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-success">Tracked delivery on every Ekeji order.</p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-lg">{needsAddress ? "Delivery address" : "Your details"}</h2>
              {field("name", "Full name")}
              {needsAddress && (
                <>
                  {field("line1", "Address line 1")}
                  {field("line2", "Address line 2", true)}
                  <div className="grid grid-cols-2 gap-4">
                    {field("city", "Town or city")}
                    {field("postcode", "Postcode")}
                  </div>
                </>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg">Payment method</h2>
              <div className="flex items-center gap-3 border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                <CreditCard className="h-5 w-5" />
                Payment is simulated in this preview — no card will be charged.
              </div>
            </section>
          </div>

          <aside className="card-editorial h-fit p-5 lg:sticky lg:top-24">
            <div className="flex gap-4">
              <img src={cover} alt={listing.title} className="h-24 w-18 shrink-0 object-cover" width={72} height={96} />
              <div>
                <p className="font-display text-lg leading-tight">{listing.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[listing.condition, listing.uk_size].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Sold by {listing.seller_name}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Line k="Item" v={gbp(listing.price_pence)} />
              <Line k={`Delivery · ${method}`} v={delivery ? gbp(delivery) : "Free"} />
              <Line k="Ekeji service fee" v={gbp(fee)} />
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{gbp(total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{SERVICE_FEE_COPY}</p>
            <Button size="lg" className="mt-5 w-full" onClick={placeOrder} disabled={placing}>
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Place order
            </Button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
