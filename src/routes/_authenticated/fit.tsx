import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { UnitToggle } from "@/components/ekeji/FiltersPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useEkejiUser";
import { fromUnit, toUnit, type Unit } from "@/lib/format";
import { FIT_DISCLAIMER } from "@/lib/fit";

export const Route = createFileRoute("/_authenticated/fit")({
  head: () => ({
    meta: [
      { title: "Find your fit — Ekeji" },
      {
        name: "description",
        content:
          "Save your measurements to see fit guidance on every pre-loved occasionwear listing on Ekeji.",
      },
      { property: "og:title", content: "Find your fit — Ekeji" },
      {
        property: "og:description",
        content: "Fit guidance for bespoke occasionwear, based on your own measurements.",
      },
    ],
  }),
  component: FitFinder,
});

const fits = [
  { value: "snug" as const, label: "Snug" },
  { value: "fitted" as const, label: "Fitted" },
  { value: "relaxed" as const, label: "Relaxed" },
];

function FitFinder() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [unit, setUnit] = useState<Unit>("cm");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [height, setHeight] = useState("");
  const [preferred, setPreferred] = useState<"snug" | "fitted" | "relaxed">("fitted");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profile || loaded) return;
    const u: Unit = profile.unit_preference === "in" ? "in" : "cm";
    setUnit(u);
    const show = (value: number | string | null) =>
      value === null ? "" : String(toUnit(Number(value), u) ?? "");
    setBust(show(profile.fit_bust_cm));
    setWaist(show(profile.fit_waist_cm));
    setHip(show(profile.fit_hip_cm));
    setHeight(show(profile.fit_height_cm));
    if (profile.preferred_fit) setPreferred(profile.preferred_fit as typeof preferred);
    setLoaded(true);
  }, [profile, loaded]);

  function convert(value: string): number | null {
    if (value.trim() === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return fromUnit(parsed, unit);
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        fit_bust_cm: convert(bust),
        fit_waist_cm: convert(waist),
        fit_hip_cm: convert(hip),
        fit_height_cm: convert(height),
        preferred_fit: preferred,
        unit_preference: unit,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Your fit profile is saved");
  }

  const fields: { id: string; label: string; value: string; set: (v: string) => void }[] = [
    { id: "bust", label: "Bust", value: bust, set: setBust },
    { id: "waist", label: "Waist", value: waist, set: setWaist },
    { id: "hip", label: "Hip", value: hip, set: setHip },
    { id: "height", label: "Height", value: height, set: setHeight },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-8">
        <p className="eyebrow">Fit finder</p>
        <h1 className="mt-3 font-display text-3xl text-primary md:text-4xl">Find your fit</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Bespoke occasionwear is cut to one person&apos;s body. Save your measurements and Ekeji
          will show fit guidance on every listing that has garment measurements.
        </p>

        <div className="mt-8 border border-gold/50 bg-card p-5 shadow-soft md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl">Your measurements</h2>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id}>
                  {field.label} ({unit})
                </Label>
                <Input
                  id={field.id}
                  type="number"
                  inputMode="decimal"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                />
              </div>
            ))}
          </div>

          <fieldset className="mt-6">
            <legend className="eyebrow">Preferred fit</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {fits.map((fit) => (
                <button
                  key={fit.value}
                  type="button"
                  onClick={() => setPreferred(fit.value)}
                  aria-pressed={preferred === fit.value}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    preferred === fit.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {fit.label}
                </button>
              ))}
            </div>
          </fieldset>

          <Button className="mt-7 w-full" size="lg" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save my fit profile"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{FIT_DISCLAIMER}</p>
        </div>

        <Button asChild variant="outline" className="mt-8">
          <Link to="/explore">See outfits with fit guidance</Link>
        </Button>
      </div>
    </AppShell>
  );
}
