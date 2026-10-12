import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EkejiWordmark } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Ekeji" },
      { name: "description", content: "Set a new password for your Ekeji account." },
      { property: "og:title", content: "Choose a new password — Ekeji" },
      { property: "og:description", content: "Set a new password and get back to browsing." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your password has been updated");
    navigate({ to: "/home" });
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center px-4 py-14">
      <Link to="/" className="mb-8">
        <EkejiWordmark />
      </Link>
      <h1 className="font-display text-3xl text-primary">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Open this page from the reset link in your email, then set your new password.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
