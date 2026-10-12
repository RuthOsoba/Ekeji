import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { EkejiWordmark } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  head: () => ({
    meta: [
      { title: "Join Ekeji — pre-loved African occasionwear" },
      {
        name: "description",
        content: "Create your Ekeji account to buy and sell pre-loved Aso Ebi and occasionwear.",
      },
      { property: "og:title", content: "Join Ekeji" },
      {
        property: "og:description",
        content: "One Ekeji account lets you both buy and sell occasionwear.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSignup && !agreed) {
      toast.error("Please agree to the terms and privacy policy");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name: firstName, last_name: lastName, postcode },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/onboarding" });
        } else {
          setCheckEmail(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in is unavailable right now");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/home" });
  }

  if (checkEmail) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <EkejiWordmark />
        <h1 className="mt-6 font-display text-3xl text-primary">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We have sent a confirmation link to {email}. Open it to finish setting up your Ekeji
          account, then come back and log in.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/auth" search={{ mode: "signin" }} onClick={() => setCheckEmail(false)}>
            Back to log in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center px-4 py-14">
      <Link to="/" className="mb-8">
        <EkejiWordmark />
      </Link>
      <h1 className="font-display text-3xl text-primary md:text-4xl">
        {isSignup ? "Join Ekeji" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One account, whether you are buying or selling. Every outfit deserves a second outing.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {isSignup && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        )}

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isSignup && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="postcode">UK postcode (optional)</Label>
              <Input
                id="postcode"
                autoComplete="postal-code"
                placeholder="e.g. SE15 4RB"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                I agree to the Ekeji terms of service and privacy policy.
              </Label>
            </div>
          </>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "One moment…" : isSignup ? "Create my account" : "Log in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="eyebrow">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" size="lg" onClick={() => void handleGoogle()}>
        Continue with Google
      </Button>

      <div className="mt-8 space-y-2 text-sm">
        {isSignup ? (
          <p className="text-muted-foreground">
            Already on Ekeji?{" "}
            <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        ) : (
          <>
            <p className="text-muted-foreground">
              New to Ekeji?{" "}
              <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary">
                Create an account
              </Link>
            </p>
            <p>
              <Link to="/forgot-password" className="text-muted-foreground underline">
                Forgot your password?
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
