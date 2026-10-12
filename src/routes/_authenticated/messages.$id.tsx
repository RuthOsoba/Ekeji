import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useEkejiUser";
import {
  fetchConversation,
  fetchMessages,
  markConversationRead,
  QUICK_QUESTIONS,
  SAFETY_NOTICE,
  sendMessage,
} from "@/lib/messages";
import { gbp } from "@/lib/format";
import { listingImage } from "@/lib/listing-images";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({
    meta: [
      { title: "Conversation — Ekeji" },
      { name: "description", content: "Chat with a buyer or seller about an outfit on Ekeji." },
      { property: "og:title", content: "Conversation — Ekeji" },
      { property: "og:description", content: "Chat with a buyer or seller about an outfit on Ekeji." },
    ],
  }),
  component: ConversationPage,
});

function ConversationPage() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [otherTyping, setOtherTyping] = useState(false);
  const typingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSent = useRef(0);

  const { data: convo, isLoading } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id),
  });
  type Msg = Awaited<ReturnType<typeof fetchMessages>>[number];
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => fetchMessages(id),
  });

  // Typing indicator over a live broadcast channel for this conversation.
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`typing-${id}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === user.id) return;
        setOtherTyping(true);
        clearTimeout(timer);
        timer = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();
    typingChannel.current = channel;
    return () => {
      clearTimeout(timer);
      typingChannel.current = null;
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  // Mark incoming messages as read whenever new ones arrive while viewing.
  const unreadIncoming = messages.some((m) => !m.read_at && m.sender_id !== user?.id);
  useEffect(() => {
    if (!unreadIncoming) return;
    markConversationRead(id).then(() => queryClient.invalidateQueries({ queryKey: ["unread"] }));
  }, [id, unreadIncoming, messages.length, queryClient]);

  useEffect(() => {
    if (messages.length && messages[messages.length - 1]?.sender_id !== user?.id) setOtherTyping(false);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, otherTyping]);

  function notifyTyping() {
    const now = Date.now();
    if (!user || now - lastTypingSent.current < 1500) return;
    lastTypingSent.current = now;
    typingChannel.current?.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  }

  async function send(text: string) {
    if (!user || !text.trim()) return;
    setSending(true);
    const optimistic: Msg = {
      id: `temp-${Date.now()}`,
      conversation_id: id,
      sender_id: user.id,
      body: text.trim(),
      created_at: new Date().toISOString(),
      read_at: null,
    };
    queryClient.setQueryData<Msg[]>(["messages", id], (old = []) => [...old, optimistic]);
    setDraft("");
    try {
      await sendMessage(id, user.id, text);
    } catch {
      queryClient.setQueryData<Msg[]>(["messages", id], (old = []) => old.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      toast.error("Your message couldn't be sent. Please try again.");
    } finally {
      setSending(false);
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }

  const lastMineId = [...messages].reverse().find((m) => m.sender_id === user?.id)?.id;

  if (isLoading) {
    return (
      <AppShell>
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }
  if (!convo) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center">
          <p className="font-display text-2xl">Conversation not found</p>
          <Button asChild className="mt-6">
            <Link to="/messages">Back to messages</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const listing = convo.listing;
  const iAmBuyer = convo.buyer_id === user?.id;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 md:px-8">
        <Link to="/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All messages
        </Link>

        {listing && (
          <Link
            to="/listing/$id"
            params={{ id: listing.id }}
            className="card-editorial flex items-center gap-4 p-3"
          >
            <img
              src={listing.photo_urls?.[0] ?? listingImage(listing.image_key)}
              alt=""
              className="h-20 w-16 rounded-sm object-cover"
            />
            <div className="min-w-0">
              <p className="eyebrow">{iAmBuyer ? `Seller · ${listing.seller_name ?? "Ekeji seller"}` : "Your listing"}</p>
              <p className="truncate font-display text-lg">{listing.title}</p>
              <p className="text-sm text-primary">{gbp(listing.price_pence)}</p>
            </div>
          </Link>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-sm bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          {SAFETY_NOTICE}
        </p>

        <div className="mt-6 flex min-h-[40vh] flex-col gap-3" aria-live="polite">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Say hello — or pick a quick question below.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-md px-4 py-2.5 text-sm leading-relaxed ${
                    mine ? "bg-primary text-primary-foreground" : "border border-border bg-card"
                  }`}
                >
                  {m.body}
                  <span className={`mt-1 block text-[0.6875rem] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-20 mt-6 border-t border-border bg-background pt-4 md:bottom-0 md:pb-4">
          {iAmBuyer && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={sending}
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <label htmlFor="msg" className="sr-only">Message</label>
            <Textarea
              id="msg"
              rows={2}
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              placeholder="Write a message…"
              className="min-h-0 resize-none"
            />
            <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
