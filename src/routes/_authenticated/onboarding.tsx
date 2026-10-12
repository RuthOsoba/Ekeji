import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EkejiWordmark } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useEkejiUser";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const options = [
  { value: "shop" as const, label: "I want to shop", body: "Browse occasionwear with full measurements." },
  { value: "sell" as const, label: "I want to sell", body: "Give your once-worn outfits another outing." },
  { value: "both" as const, label: "Both", body: "Buy and sell from the same Ekeji account." },
];

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<"shop" | "sell" | "both" | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!user || !choice) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ intent: choice, onboarded: true })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    navigate({ to: "/home" });
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-xl content-center px-4 py-14">
      <EkejiWordmark />
      <h1 className="mt-6 font-display text-3xl text-primary md:text-4xl">
        What brings you to Ekeji?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This only personalises what you see first. Every Ekeji account can both buy and sell.
      </p>

      <div className="mt-8 space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setChoice(option.value)}
            aria-pressed={choice === option.value}
            className={`w-full border p-5 text-left transition-colors ${
              choice === option.value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="font-display text-xl">{option.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{option.body}</span>
          </button>
        ))}
      </div>

      <Button size="lg" className="mt-8" disabled={!choice || busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
