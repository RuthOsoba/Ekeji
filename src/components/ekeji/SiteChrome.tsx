import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, Search, Sparkles, User } from "lucide-react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useEkejiUser";
import { fetchUnreadCounts } from "@/lib/messages";
import { CountBadge, NotificationBell } from "@/components/ekeji/NotificationBell";

export function useUnreadCounts() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["unread", user?.id],
    queryFn: () => fetchUnreadCounts(user!.id),
    enabled: !!user,
  });
}

export function EkejiWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-brand text-2xl text-primary ${className}`}>
      Ekeji
    </span>
  );
}

const desktopLinks = [
  { to: "/explore", label: "Explore" },
  { to: "/sell", label: "Sell" },
  { to: "/saved", label: "Saved" },
  { to: "/fit", label: "Find your fit" },
] as const;

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: unread = {} } = useUnreadCounts();
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link to={user ? "/home" : "/"} className="shrink-0">
            <EkejiWordmark />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {desktopLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-foreground/80 transition-colors hover:text-primary"
                activeProps={{ className: "text-sm text-primary font-semibold" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/account">My Ekeji</Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Messages${unreadTotal ? `, ${unreadTotal} unread` : ""}`}>
                <Link to="/messages">
                  <MessageCircle className="h-5 w-5" />
                  <CountBadge count={unreadTotal} />
                </Link>
              </Button>
              <NotificationBell />
              <Button asChild variant="ghost" size="sm">
                <Link to="/orders" search={{ tab: "buying" }}>Orders</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Log in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Join Ekeji
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const mobileNav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/sell", label: "Sell", icon: Sparkles },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/account", label: "Profile", icon: User },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/98 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {mobileNav.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to}
              className="flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[0.6875rem] text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 md:px-8">
        <EkejiWordmark />
        <p className="max-w-md text-sm text-muted-foreground">
          Every outfit deserves a second outing. Ekeji is a UK marketplace for pre-loved Aso Ebi and
          African occasionwear.
        </p>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}

export function ProfileIcon() {
  return <User className="h-5 w-5" aria-hidden />;
}
