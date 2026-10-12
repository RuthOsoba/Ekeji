import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useEkejiUser";
import { BROWSER_ALERTS_KEY } from "@/lib/messages";

function browserAlert(title: string, body: string, onClick: () => void) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (!document.hidden || Notification.permission !== "granted") return;
  if (localStorage.getItem(BROWSER_ALERTS_KEY) !== "on") return;
  const n = new Notification(title, { body, icon: "/favicon.ico" });
  n.onclick = () => {
    window.focus();
    onClick();
    n.close();
  };
}

/** One live connection per signed-in user: messages, conversations and notifications. */
export function RealtimeProvider() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`user-live-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as { conversation_id: string; sender_id: string | null; body: string };
        queryClient.invalidateQueries({ queryKey: ["messages", m.conversation_id] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unread"] });
        if (m.sender_id === uid) return;
        const viewing = window.location.pathname === `/messages/${m.conversation_id}`;
        if (viewing && !document.hidden) return;
        const open = () => navigate({ to: "/messages/$id", params: { id: m.conversation_id } });
        const preview = m.body.length > 90 ? `${m.body.slice(0, 90)}…` : m.body;
        toast("New message", { description: preview, action: { label: "Open", onClick: open } });
        browserAlert("New message on Ekeji", preview, open);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as { conversation_id: string };
        queryClient.invalidateQueries({ queryKey: ["messages", m.conversation_id] });
        queryClient.invalidateQueries({ queryKey: ["unread"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          if (payload.eventType !== "INSERT") return;
          const n = payload.new as { title: string; body: string | null; order_id: string | null };
          const open = n.order_id
            ? () => navigate({ to: "/orders/$id", params: { id: n.order_id! } })
            : undefined;
          if (n.order_id) {
            queryClient.invalidateQueries({ queryKey: ["order", n.order_id] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          }
          toast(n.title, {
            description: n.body ?? undefined,
            action: open ? { label: "View", onClick: open } : undefined,
          });
          browserAlert(n.title, n.body ?? "", open ?? (() => {}));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient, navigate]);

  return null;
}
