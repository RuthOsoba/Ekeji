import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications } from "@/lib/orders";
import { BROWSER_ALERTS_KEY } from "@/lib/messages";
import { relativeDate } from "@/lib/format";

export function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold leading-none text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data: notes = [] } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const unread = notes.filter((n) => !n.read);
  const [alerts, setAlerts] = useState<"on" | "off" | "unsupported">("off");

  useEffect(() => {
    if (!("Notification" in window)) setAlerts("unsupported");
    else setAlerts(localStorage.getItem(BROWSER_ALERTS_KEY) === "on" && Notification.permission === "granted" ? "on" : "off");
  }, []);

  async function markAll() {
    if (!unread.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", unread.map((n) => n.id));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function toggleAlerts() {
    if (alerts === "on") {
      localStorage.setItem(BROWSER_ALERTS_KEY, "off");
      setAlerts("off");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem(BROWSER_ALERTS_KEY, "on");
      setAlerts("on");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}>
          <Bell className="h-5 w-5" />
          <CountBadge count={unread.length} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-lg">Notifications</p>
          <button type="button" onClick={markAll} disabled={!unread.length} className="text-xs text-primary disabled:text-muted-foreground">
            Mark all as read
          </button>
        </div>
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {notes.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</li>}
          {notes.map((n) => {
            const inner = (
              <div className="flex gap-3 px-4 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} aria-hidden />
                <div className="min-w-0">
                  <p className={`text-sm ${n.read ? "" : "font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[0.6875rem] text-muted-foreground">{relativeDate(n.created_at)}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id} className="hover:bg-secondary/40">
                {n.order_id ? <Link to="/orders/$id" params={{ id: n.order_id }}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
        {alerts !== "unsupported" && (
          <div className="border-t border-border px-4 py-3">
            <button type="button" onClick={toggleAlerts} className="text-xs text-primary">
              {alerts === "on" ? "Turn off browser alerts" : "Get browser alerts when Ekeji is in the background"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
