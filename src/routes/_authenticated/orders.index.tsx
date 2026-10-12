import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { OrderThumb } from "@/components/ekeji/OrderThumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useEkejiUser";
import { gbp } from "@/lib/format";
import { BUYER_STAGES, fetchNotifications, fetchOrders, SELLER_STAGES, type Order } from "@/lib/orders";

export const Route = createFileRoute("/_authenticated/orders/")({
  validateSearch: (s: Record<string, unknown>): { tab?: "buying" | "selling" } =>
    s["tab"] === "selling" ? { tab: "selling" } : {},
  head: () => ({
    meta: [
      { title: "Your orders — Ekeji" },
      { name: "description", content: "Track your Ekeji purchases and sales with tracked delivery updates." },
      { property: "og:title", content: "Your orders — Ekeji" },
      { property: "og:description", content: "Purchases and sales on Ekeji, all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { tab = "buying" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders, enabled: !!user });
  const { data: notes = [] } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, enabled: !!user });

  const buying = orders.filter((o) => o.buyer_id === user?.id);
  const selling = orders.filter((o) => o.seller_id === user?.id);
  const unread = notes.filter((n) => !n.read);

  async function markRead() {
    await supabase.from("notifications").update({ read: true }).in("id", unread.map((n) => n.id));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow">Orders</p>
        <h1 className="mt-3 font-display text-3xl text-primary md:text-4xl">Your orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tracked delivery on every Ekeji order.</p>

        {unread.length > 0 && (
          <section className="mt-6 border border-gold/50 bg-card p-4" aria-label="Updates">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="h-4 w-4 text-gold" /> {unread.length} new update{unread.length > 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={markRead}>Mark as read</Button>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {unread.slice(0, 5).map((n) => (
                <li key={n.id}>
                  {n.order_id ? (
                    <Link to="/orders/$id" params={{ id: n.order_id }} className="hover:text-primary">
                      <span className="font-medium">{n.title}</span> — <span className="text-muted-foreground">{n.body}</span>
                    </Link>
                  ) : (
                    <span>{n.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as "buying" | "selling" } })} className="mt-8">
          <TabsList>
            <TabsTrigger value="buying">Buying ({buying.length})</TabsTrigger>
            <TabsTrigger value="selling">Selling ({selling.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="buying" className="mt-6">
            <OrderList orders={buying} role="buyer" loading={isLoading} />
          </TabsContent>
          <TabsContent value="selling" className="mt-6">
            <OrderList orders={selling} role="seller" loading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function OrderList({ orders, role, loading }: { orders: Order[]; role: "buyer" | "seller"; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  if (!orders.length) {
    return (
      <div className="border border-dashed border-border p-10 text-center">
        <p className="font-display text-xl">{role === "buyer" ? "No purchases yet" : "No sales yet"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "buyer" ? "Find an outfit for your next celebration." : "List an outfit to give it a second outing."}
        </p>
        <Button asChild className="mt-5">
          {role === "buyer" ? <Link to="/explore">Explore outfits</Link> : <Link to="/sell">Sell an outfit</Link>}
        </Button>
      </div>
    );
  }
  const labels = role === "buyer" ? BUYER_STAGES : SELLER_STAGES;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {orders.map((o) => (
        <li key={o.id}>
          <Link to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-4 py-4 hover:bg-card">
            <OrderThumb order={o} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg">{o.listing_title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                {gbp(role === "buyer" ? o.total_pence : o.item_pence)}
              </p>
            </div>
            <span
              className={`shrink-0 border px-2.5 py-1 text-xs ${
                o.stage === 6 ? "border-success text-success" : "border-primary/40 text-primary"
              }`}
            >
              {labels[o.stage]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
