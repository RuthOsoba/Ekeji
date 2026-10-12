import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ExternalLink, Package, Printer, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { OrderThumb } from "@/components/ekeji/OrderThumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession } from "@/hooks/useEkejiUser";
import { ReviewCard, ReviewForm } from "@/components/ekeji/Reviews";
import { fetchOrderReviews } from "@/lib/reviews";
import { gbp } from "@/lib/format";
import {
  BUYER_STAGES,
  fetchOrder,
  ISSUE_TYPES,
  PACKAGING_CHECKLIST,
  SELLER_STAGES,
} from "@/lib/orders";

type Courier = "royalmail" | "evri";
function courierFor(method: string): Courier | null {
  if (/royal mail/i.test(method)) return "royalmail";
  if (/evri/i.test(method)) return "evri";
  return null;
}
function validTracking(c: Courier, t: string) {
  return c === "royalmail" ? /^[A-Z]{2}\d{9}GB$/.test(t) : /^[A-Z0-9]{16}$/.test(t);
}
function trackingUrl(c: Courier, t: string) {
  return c === "royalmail"
    ? `https://www.royalmail.com/track-your-item#/tracking-results/${t}`
    : `https://www.evri.com/track/parcel/${t}/details`;
}

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export const Route = createFileRoute("/_authenticated/orders/$id")({
  validateSearch: (s: Record<string, unknown>): { placed?: boolean } =>
    s["placed"] === true || s["placed"] === "true" ? { placed: true } : {},
  head: () => ({
    meta: [
      { title: "Order tracking — Ekeji" },
      { name: "description", content: "Follow your Ekeji order from dispatch to delivery." },
      { property: "og:title", content: "Order tracking — Ekeji" },
      { property: "og:description", content: "Tracked delivery on every Ekeji order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function OrderPage() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      // Ask the courier (simulated for now) for the latest status, then read the order.
      await supabase.rpc("sync_order_tracking", { _order_id: id });
      return fetchOrder(id);
    },
    enabled: !!user,
    refetchInterval: (q) => ((q.state.data?.stage ?? 0) < 5 ? 15000 : false),
  });
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0]);
  const [issueDetails, setIssueDetails] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [trackInput, setTrackInput] = useState("");

  if (isLoading || !user) {
    return (
      <AppShell>
        <p className="mx-auto max-w-4xl px-4 py-20 text-sm text-muted-foreground">Loading order…</p>
      </AppShell>
    );
  }
  if (!order) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-primary">Order not found</h1>
          <Button asChild className="mt-6">
            <Link to="/orders" search={{ tab: "buying" }}>Back to orders</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  const isDemoSeller = order.seller_id === null;
  const labels = isBuyer ? BUYER_STAGES : SELLER_STAGES;
  const stage = order.stage;
  const courier = courierFor(order.delivery_method);
  const isCollection = courier === null;
  const courierName = courier === "royalmail" ? "Royal Mail" : courier === "evri" ? "Evri" : "the courier";
  const trackUrl = order.tracking_number && courier ? trackingUrl(courier, order.tracking_number) : null;

  async function submitDropOff() {
    const t = trackInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!courier || !validTracking(courier, t)) {
      toast.error(courier === "royalmail" ? "Royal Mail numbers look like AB123456789GB" : "Evri numbers are 16 letters and numbers");
      return;
    }
    await update({ stage: 2, tracking_number: t }, "Parcel dropped off — the buyer can now track it");
    setDropOpen(false);
  }

  async function update(patch: OrderUpdate, message: string) {
    setBusy(true);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["order", id] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function submitIssue() {
    await update({ issue_type: issueType, issue_details: issueDetails.trim() || null }, "Issue reported — we'll be in touch");
    setIssueOpen(false);
  }

  const stageDate = (i: number) => {
    if (i === 0) return fmtDate(order.created_at);
    if (i === 2 && !isBuyer && order.drop_off_by) return `By ${fmtDate(order.drop_off_by)}`;
    if ((i === 4 || i === 5) && order.delivered_at) return fmtDate(order.delivered_at);
    return "";
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
        <Link to="/orders" search={{ tab: isBuyer ? "buying" : "selling" }} className="text-sm text-muted-foreground hover:text-primary">
          ← All orders
        </Link>

        {placed && isBuyer && (
          <div className="mt-6 flex items-start gap-3 border border-success/40 bg-success/10 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">Order confirmed</p>
              <p className="text-muted-foreground">We&apos;ve let the seller know. You&apos;ll see updates here as your parcel moves.</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-5">
          <OrderThumb order={order} className="h-32 w-24" />
          <div>
            <p className="eyebrow">{isBuyer ? "Purchase" : "Sale"} · {labels[stage]}</p>
            <h1 className="mt-2 font-display text-2xl text-primary md:text-3xl">{order.listing_title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order {order.id.slice(0, 8).toUpperCase()} · {order.delivery_method}
            </p>
            {order.tracking_number && (
              <p className="mt-1 text-sm">
                {courierName} tracking <span className="font-mono font-semibold">{order.tracking_number}</span>
                {trackUrl && (
                  <a href={trackUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary underline">
                    Track with {courierName} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <section aria-label="Delivery timeline">
              <h2 className="font-display text-lg">Delivery timeline</h2>
              {isBuyer && <p className="text-xs text-success">Tracked delivery on every Ekeji order.</p>}
              <ol className="mt-4">
                {labels.map((label, i) => {
                  const done = i <= stage;
                  const current = i === stage;
                  return (
                    <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < labels.length - 1 && (
                        <span className={`absolute left-[11px] top-6 h-full w-px ${i < stage ? "bg-primary" : "bg-border"}`} />
                      )}
                      <span
                        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                        }`}
                      >
                        {done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div>
                        <p className={`text-sm ${current ? "font-semibold text-primary" : done ? "" : "text-muted-foreground"}`}>{label}</p>
                        {stageDate(i) && <p className="text-xs text-muted-foreground">{stageDate(i)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {stage === 5 && (
              <section className="border border-gold/50 bg-card p-5">
                <p className="font-semibold">
                  {isBuyer
                    ? "Your order has been delivered. You have 48 hours to report a delivery issue before the seller is paid."
                    : "Delivered. Your payout is released once the buyer's 48-hour issue window closes."}
                </p>
                {order.issue_type && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4" /> Issue reported: {order.issue_type}
                    {order.issue_details ? ` — ${order.issue_details}` : ""}
                  </p>
                )}
                {isBuyer && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button disabled={busy} onClick={() => update({ stage: 6 }, "Order complete — enjoy your outing!")}>
                      Everything&apos;s fine — complete order
                    </Button>
                    {!order.issue_type && (
                      <Button variant="outline" onClick={() => setIssueOpen(true)}>Report an issue</Button>
                    )}
                  </div>
                )}
              </section>
            )}

            {stage === 6 && (
              <>
                <section className="border border-success/40 bg-success/10 p-5 text-sm">
                  <p className="font-semibold">{isBuyer ? "Order complete" : "Payout complete"}</p>
                  <p className="mt-1 text-muted-foreground">Reviews are now open for this order.</p>
                </section>
                <OrderReviews orderId={order.id} userId={user.id} isBuyer={isBuyer} hasSeller={order.seller_id !== null} />
              </>
            )}

            {isSeller && stage <= 1 && (
              <section className="card-editorial p-5">
                <h2 className="flex items-center gap-2 font-display text-lg">
                  <Package className="h-5 w-5 text-gold" /> Packaging checklist
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {PACKAGING_CHECKLIST.map((item) => (
                    <li key={item}>
                      <label className="flex items-start gap-3 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={checked.includes(item)}
                          onCheckedChange={(c) =>
                            setChecked((prev) => (c ? [...prev, item] : prev.filter((x) => x !== item)))
                          }
                        />
                        {item}
                      </label>
                    </li>
                  ))}
                </ul>
                {order.drop_off_by && (
                  <p className="mt-4 text-sm text-muted-foreground">Please drop off by {fmtDate(order.drop_off_by)}.</p>
                )}
              </section>
            )}

            {isSeller && stage === 0 && (
              <Button disabled={busy} onClick={() => update({ stage: 1 }, "Postage label ready")}>
                <Printer className="h-4 w-4" /> Print postage label
              </Button>
            )}
            {isSeller && stage === 1 && (
              isCollection ? (
                <Button disabled={busy} onClick={() => update({ stage: 5 }, "Marked as collected")}>
                  <Check className="h-4 w-4" /> Mark as collected
                </Button>
              ) : (
                <Button disabled={busy} onClick={() => setDropOpen(true)}>
                  <Truck className="h-4 w-4" /> Mark as dropped off
                </Button>
              )
            )}
            {isBuyer && isDemoSeller && stage <= 1 && (
              <p className="text-xs text-muted-foreground">
                This is a sample seller, so their steps happen automatically in a few moments.
              </p>
            )}
            {(stage === 2 || stage === 3) && (
              <p className="flex items-start gap-2 border border-border p-4 text-sm text-muted-foreground">
                <Truck className="mt-0.5 h-4 w-4 text-gold" />
                Delivery updates come straight from {courierName} — this page refreshes automatically.
              </p>
            )}
          </div>

          <aside className="space-y-6">
            <section className="card-editorial p-5 text-sm">
              <h2 className="font-display text-lg">Summary</h2>
              <dl className="mt-3 space-y-2">
                <Row k="Item" v={gbp(order.item_pence)} />
                {isBuyer ? (
                  <>
                    <Row k="Delivery" v={order.delivery_pence ? gbp(order.delivery_pence) : "Free"} />
                    <Row k="Service fee" v={gbp(order.fee_pence)} />
                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                      <dt>Total paid</dt>
                      <dd>{gbp(order.total_pence)}</dd>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <dt>Your payout</dt>
                    <dd>{gbp(order.item_pence)}</dd>
                  </div>
                )}
              </dl>
            </section>
            <section className="card-editorial p-5 text-sm">
              <h2 className="font-display text-lg">{isBuyer ? "Delivering to" : "Ship to"}</h2>
              <address className="mt-2 not-italic text-muted-foreground">
                {order.address_name}
                <br />
                {order.address_line1}
                {order.address_line2 && (
                  <>
                    <br />
                    {order.address_line2}
                  </>
                )}
                <br />
                {order.address_city} {order.address_postcode}
              </address>
            </section>
          </aside>
        </div>
      </div>

      <Dialog open={dropOpen} onOpenChange={setDropOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as dropped off</DialogTitle>
            <DialogDescription>
              Enter the {courierName} tracking number from your drop-off receipt. The buyer will use it to follow the parcel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking number</Label>
            <Input
              id="tracking"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder={courier === "royalmail" ? "AB123456789GB" : "H000000000000000"}
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">Keep your drop-off receipt until your payout is complete.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={submitDropOff}>Confirm drop-off</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Report a delivery issue</DialogTitle>
            <DialogDescription>
              Ekeji is currently building enhanced protection. For fit concerns or change-of-mind returns, please contact
              the seller directly through Ekeji messages.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={issueType} onValueChange={setIssueType} className="space-y-2">
            {ISSUE_TYPES.map((t) => (
              <Label key={t} className="flex items-center gap-3 font-normal">
                <RadioGroupItem value={t} /> {t}
              </Label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="issue-details">Tell us what happened (optional)</Label>
            <Textarea id="issue-details" rows={3} value={issueDetails} onChange={(e) => setIssueDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button onClick={submitIssue} disabled={busy}>Submit report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function OrderReviews({ orderId, userId, isBuyer, hasSeller }: { orderId: string; userId: string; isBuyer: boolean; hasSeller: boolean }) {
  const { data: reviews = [] } = useQuery({ queryKey: ["order-reviews", orderId], queryFn: () => fetchOrderReviews(orderId) });
  const mine = reviews.find((r) => r.reviewer_id === userId);
  const aboutMe = reviews.find((r) => r.reviewee_id === userId && r.reviewer_id !== userId);
  const direction = isBuyer ? "buyer_to_seller" : "seller_to_buyer";
  return (
    <div className="space-y-4">
      {mine ? (
        <section className="card-editorial p-5">
          <h2 className="font-display text-lg">Your review</h2>
          <ReviewCard review={mine} />
        </section>
      ) : (
        <ReviewForm orderId={orderId} userId={userId} direction={direction} />
      )}
      {aboutMe && (
        <section className="card-editorial p-5">
          <h2 className="font-display text-lg">{isBuyer ? "Your seller's review of you" : "Buyer's review of you"}</h2>
          <ReviewCard review={aboutMe} />
        </section>
      )}
      {isBuyer && !hasSeller && (
        <p className="text-xs text-muted-foreground">This is a sample listing, so the seller won&apos;t leave a review of you.</p>
      )}
    </div>
  );
}
