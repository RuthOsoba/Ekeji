import { supabase } from "@/integrations/supabase/client";
import { fetchListing, type Listing } from "@/lib/ekeji";

export const QUICK_QUESTIONS = [
  "Could you confirm the dress length?",
  "Is there seam allowance for alterations?",
  "When can you dispatch?",
  "Could you share a photo of the back?",
] as const;

export const SAFETY_NOTICE =
  "Keep conversations and payments on Ekeji to protect your order history and reviews.";

export async function startConversation(listingId: string, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export interface ConversationSummary {
  id: string;
  listing: Listing | null;
  buyer_id: string;
  seller_id: string | null;
  last_message_at: string;
  preview: string | null;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (c) => {
      const [listing, last] = await Promise.all([
        fetchListing(c.listing_id),
        supabase
          .from("messages")
          .select("body")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return { ...c, listing, preview: last.data?.body ?? null };
    }),
  );
}

export async function fetchConversation(id: string) {
  const { data, error } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const listing = await fetchListing(data.listing_id);
  return { ...data, listing };
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() });
  if (error) throw error;
}

/** Unread incoming messages, counted per conversation. */
export async function fetchUnreadCounts(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id")
    .is("read_at", null)
    .or(`sender_id.is.null,sender_id.neq.${userId}`);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const m of data ?? []) counts[m.conversation_id] = (counts[m.conversation_id] ?? 0) + 1;
  return counts;
}

export async function markConversationRead(conversationId: string) {
  await supabase.rpc("mark_conversation_read", { _conversation_id: conversationId });
}

export const BROWSER_ALERTS_KEY = "ekeji-browser-alerts";
