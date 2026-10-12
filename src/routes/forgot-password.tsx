import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EkejiWordmark } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your Ekeji password" },
      { name: "description", content: "Request a password reset link for your Ekeji account." },
      { property: "og:title", content: "Reset your Ekeji password" },
      { property: "og:description", content: "We will email you a secure reset link." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center px-4 py-14">
      <Link to="/" className="mb-8">
        <EkejiWordmark />
      </Link>
      <h1 className="font-display text-3xl text-primary">Forgot your password?</h1>
      {sent ? (
        <p className="mt-4 text-sm text-muted-foreground">
          If an Ekeji account uses {email}, a reset link is on its way. The link opens a page where
          you can choose a new password.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we will send you a secure link to choose a new password.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
      <Link
        to="/auth"
        search={{ mode: "signin" }}
        className="mt-8 text-sm text-muted-foreground underline"
      >
        Back to log in
      </Link>
    </div>
  );
}
