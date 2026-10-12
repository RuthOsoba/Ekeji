import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import { AppShell, useUnreadCounts } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { fetchConversations, SAFETY_NOTICE } from "@/lib/messages";
import { gbp, relativeDate } from "@/lib/format";
import { listingImage } from "@/lib/listing-images";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — Ekeji" },
      { name: "description", content: "Your conversations with buyers and sellers on Ekeji." },
      { property: "og:title", content: "Messages — Ekeji" },
      { property: "og:description", content: "Your conversations with buyers and sellers on Ekeji." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });
  const { data: unread = {} } = useUnreadCounts();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <p className="eyebrow">Inbox</p>
        <h1 className="mt-2 font-display text-4xl">Messages</h1>
        <p className="mt-3 text-sm text-muted-foreground">{SAFETY_NOTICE}</p>

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.length ? (
            <div className="card-editorial p-10 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-gold" aria-hidden />
              <p className="mt-4 font-display text-2xl">No conversations yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask a seller about fit, fabric or dispatch from any outfit page.
              </p>
              <Button asChild className="mt-6">
                <Link to="/explore">Explore outfits</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {data.map((c) => { const n = unread[c.id] ?? 0; return (
                <li key={c.id}>
                  <Link
                    to="/messages/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-4 py-4 transition-colors hover:bg-secondary/40"
                  >
                    <img
                      src={c.listing?.photo_urls?.[0] ?? listingImage(c.listing?.image_key)}
                      alt=""
                      className="h-16 w-14 shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={`truncate ${n ? "font-semibold" : "font-medium"}`}>{c.listing?.title ?? "Listing"}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {relativeDate(c.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-primary">
                        {c.listing ? gbp(c.listing.price_pence) : ""}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className={`truncate text-sm ${n ? "text-foreground" : "text-muted-foreground"}`}>
                          {c.preview ?? "No messages yet"}
                        </p>
                        {n > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-foreground">
                            {n}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ); })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
