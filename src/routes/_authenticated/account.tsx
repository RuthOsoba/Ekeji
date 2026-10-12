import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { ReviewCard } from "@/components/ekeji/Reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useEkejiUser";
import { fetchSellerListings } from "@/lib/ekeji";
import { fetchMyReviews } from "@/lib/reviews";
import { DELIVERY_PRICES } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My Ekeji — your dashboard" },
      { name: "description", content: "Manage your listings, purchases, sales, reviews and settings on Ekeji." },
      { property: "og:title", content: "My Ekeji — your dashboard" },
      { property: "og:description", content: "One account to buy and sell pre-loved African occasionwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const SECTIONS = ["Listings", "Reviews", "Settings", "Payouts", "Delivery"] as const;
type Section = (typeof SECTIONS)[number];

function AccountPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const [section, setSection] = useState<Section>("Listings");
  const { data: listings = [] } = useQuery({ queryKey: ["seller-listings", user?.id], queryFn: () => fetchSellerListings(user!.id), enabled: !!user });
  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", "mine", user?.id], queryFn: () => fetchMyReviews(user!.id), enabled: !!user });

  if (!user) return <AppShell><p className="px-4 py-20 text-center text-sm text-muted-foreground">Loading…</p></AppShell>;
  const name = profile?.display_name ?? "there";

  const quick = [
    { label: "My purchases", el: <Link to="/orders" search={{ tab: "buying" }}>My purchases</Link> },
    { label: "My sales", el: <Link to="/orders" search={{ tab: "selling" }}>My sales</Link> },
    { label: "Saved", el: <Link to="/saved">Saved items</Link> },
    { label: "Messages", el: <Link to="/messages">Messages</Link> },
    { label: "Fit", el: <Link to="/fit">Find your fit</Link> },
    { label: "Public", el: <Link to="/profile/$id" params={{ id: user.id }}>View public profile</Link> },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow">My Ekeji</p>
        <h1 className="mt-1 font-display text-3xl text-primary md:text-4xl">Hello, {name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">One account to shop and sell.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quick.map((q) => (
            <Button key={q.label} asChild variant="outline" className="h-auto justify-start py-3">{q.el}</Button>
          ))}
        </div>

        <div className="mt-10 flex gap-6 overflow-x-auto border-b border-border" role="tablist">
          {SECTIONS.map((s) => (
            <button key={s} role="tab" aria-selected={section === s} onClick={() => setSection(s)}
              className={cn("-mb-px shrink-0 border-b-2 pb-3 text-sm", section === s ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {s === "Listings" ? "My listings" : s === "Payouts" ? "Payout details" : s === "Delivery" ? "Delivery preferences" : s}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {section === "Listings" && (
            listings.length === 0 ? (
              <div className="py-10 text-sm text-muted-foreground">
                You haven&apos;t listed anything yet.
                <Button asChild className="ml-4"><Link to="/sell">Sell an outfit</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
                {listings.map((l) => (
                  <div key={l.id} className="relative">
                    {l.status === "sold" && <span className="absolute left-2 top-2 z-10 bg-ink px-2 py-0.5 text-xs text-background">Sold</span>}
                    <ListingCard listing={l} fitProfile={null} />
                  </div>
                ))}
              </div>
            )
          )}
          {section === "Reviews" && (
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="font-display text-xl">Reviews about you</h2>
                {reviews.filter((r) => r.reviewee_id === user.id).map((r) => (
                  <div key={r.id}>
                    <p className="mt-3 text-xs text-muted-foreground">{r.direction === "buyer_to_seller" ? "As a seller · public" : "As a buyer · private"}</p>
                    <ReviewCard review={r} />
                  </div>
                ))}
                {!reviews.some((r) => r.reviewee_id === user.id) && <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>}
              </div>
              <div>
                <h2 className="font-display text-xl">Reviews you&apos;ve left</h2>
                {reviews.filter((r) => r.reviewer_id === user.id).map((r) => <ReviewCard key={r.id} review={r} />)}
                {!reviews.some((r) => r.reviewer_id === user.id) && <p className="mt-3 text-sm text-muted-foreground">Complete an order to leave a review.</p>}
              </div>
            </div>
          )}
          {section === "Settings" && <SettingsForm userId={user.id} />}
          {section === "Payouts" && (
            <div className="card-editorial max-w-lg p-6 text-sm">
              <h2 className="font-display text-xl">Payout details</h2>
              <p className="mt-2 text-muted-foreground">Payouts are simulated in this preview. When real payments launch, you&apos;ll add your bank details here and be paid once the buyer&apos;s 48-hour window closes.</p>
              <Button className="mt-4" disabled>Add bank account (coming soon)</Button>
            </div>
          )}
          {section === "Delivery" && (
            <div className="card-editorial max-w-lg p-6 text-sm">
              <h2 className="font-display text-xl">Delivery preferences</h2>
              <p className="mt-2 text-muted-foreground">Ekeji orders use tracked delivery. You choose methods for each outfit when you list it.</p>
              <ul className="mt-4 space-y-2">
                {Object.entries(DELIVERY_PRICES).map(([k, p]) => (
                  <li key={k} className="flex justify-between border-b border-border pb-2"><span>{k}</span><span className="text-muted-foreground">£{(Number(p) / 100).toFixed(2)}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SettingsForm({ userId }: { userId: string }) {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [postcode, setPostcode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setLocation(profile.location ?? "");
    setPostcode(profile.postcode ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null, location: location.trim() || null, postcode: postcode.trim() || null,
    }).eq("id", userId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-4">
      <div className="space-y-1.5"><Label htmlFor="dn">Display name</Label><Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} /></div>
      <div className="space-y-1.5"><Label htmlFor="loc">Location (shown on your profile)</Label><Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. South London" maxLength={60} /></div>
      <div className="space-y-1.5"><Label htmlFor="pc">UK postcode (private)</Label><Input id="pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} maxLength={10} /></div>
      <Button type="submit" disabled={busy}>Save settings</Button>
    </form>
  );
}
