import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, ImagePlus, Loader2, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/ekeji/SiteChrome";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/useEkejiUser";
import {
  ALTERATION_LEVELS,
  CATEGORIES,
  COLOURS,
  BASIC_COLOURS,
  CONDITION_DETAILS,
  DELIVERY_OPTIONS,
  DEPARTMENTS,
  FABRICS,
  fetchListings,
  PHOTO_BUCKET,
  STRETCH_LEVELS,
  UK_SIZES,
  type Department,
} from "@/lib/ekeji";
import { fromUnit, gbp, type Unit } from "@/lib/format";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell your outfit — Ekeji" },
      {
        name: "description",
        content:
          "List your pre-loved Aso Ebi or African occasionwear on Ekeji with accurate measurements and tailoring details.",
      },
      { property: "og:title", content: "Sell your outfit — Ekeji" },
      { property: "og:description", content: "Give your once-worn occasionwear a second outing on Ekeji." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

const STEPS = ["Basics", "Price", "Fit & measurements", "Delivery", "Review & publish"] as const;
const CLOSURES = ["Zip", "Lace-up back", "Buttons", "Hook and eye", "Wrap / tie", "Pull-on"] as const;
const WARDROBE = DEPARTMENTS.filter((d): d is { value: Department; label: string } => d.value !== "all");
const NONE = "__none";
const PACKAGE_SIZES = [
  { value: "Small", hint: "Gele, accessories, light pieces" },
  { value: "Medium", hint: "Most dresses and two-piece sets" },
  { value: "Large", hint: "Boned, heavily embellished or full sets" },
] as const;
const DISPATCH = [2, 3, 5] as const;
const MAX_PHOTOS = 10;

const COLOUR_IMAGE: Record<string, string> = {
  "Emerald green": "emerald",
  Burgundy: "burgundy",
  Gold: "gold",
  Lilac: "lilac",
  Navy: "navy",
  "Blush pink": "pink",
  Champagne: "champagne",
  Ivory: "ivory",
};

interface Photo {
  file: File;
  preview: string;
}

interface Draft {
  title: string;
  category: string;
  department: Department;
  colours: string[];
  fabrics: string[];
  condition: string;
  description: string;
  fabricNotes: string;
  conditionNotes: string;
  included: string;
  originalPrice: string;
  price: string;
  acceptsOffers: boolean;
  unit: Unit;
  ukSize: string;
  bust: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeve: string;
  length: string;
  wearerHeight: string;
  stretch: string;
  closure: string;
  structure: string;
  alteration: string;
  fitNotes: string;
  delivery: string;
  packageSize: string;
  dispatchDays: number | null;
  location: string;
  confirmed: boolean;
}

const emptyDraft: Draft = {
  title: "",
  department: "womens",
  category: "",
  colours: [],
  fabrics: [],
  condition: "",
  description: "",
  fabricNotes: "",
  conditionNotes: "",
  included: "",
  originalPrice: "",
  price: "",
  acceptsOffers: false,
  unit: "cm",
  ukSize: "",
  bust: "",
  waist: "",
  hip: "",
  shoulder: "",
  sleeve: "",
  length: "",
  wearerHeight: "",
  stretch: "",
  closure: "",
  structure: "",
  alteration: "",
  fitNotes: "",
  delivery: "",
  packageSize: "",
  dispatchDays: null,
  location: "",
  confirmed: false,
};

function parseNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function stepErrors(step: number, d: Draft, photos: Photo[]): string[] {
  const e: string[] = [];
  if (step === 0) {
    if (!photos.length) e.push("Add at least one photo");
    if (!d.title.trim()) e.push("Add a title");
    if (!d.category) e.push("Choose a category");
    if (!d.colours.length) e.push("Choose at least one colour");
    if (!d.fabrics.length) e.push("Choose at least one fabric type");
    if (!d.condition) e.push("Choose a condition");
  }
  if (step === 1 && !parseNum(d.price)) e.push("Enter a selling price");
  if (step === 2) {
    if (!parseNum(d.bust) && !parseNum(d.waist) && !parseNum(d.hip))
      e.push("Add at least one of bust, waist or hip");
    if (!d.stretch) e.push("Choose a stretch level");
    if (!d.alteration) e.push("Choose alteration potential");
  }
  if (step === 3) {
    if (!d.delivery) e.push("Choose a delivery method");
    if (!d.packageSize) e.push("Choose a package size");
    if (!d.dispatchDays) e.push("Choose a dispatch time");
  }
  if (step === 4 && !d.confirmed) e.push("Confirm your listing is accurate");
  return e;
}

function SellPage() {
  const { user, loading } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { data: listings = [] } = useQuery({ queryKey: ["listings"], queryFn: fetchListings });

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDraft((d) => ({
        ...d,
        unit: d.unit === "cm" && profile.unit_preference === "in" ? "in" : d.unit,
        location: d.location || profile.location || "",
      }));
    }
  }, [profile]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const suggested = useMemo(() => {
    const comps = listings.filter(
      (l) => l.category === draft.category || draft.fabrics.some((f) => l.fabric.includes(f)),
    );
    const pool = comps.length ? comps : listings;
    if (!pool.length) return null;
    const prices = pool.map((l) => l.price_pence).sort((a, b) => a - b);
    const mid = prices[Math.floor(prices.length / 2)]!;
    const round = (p: number) => Math.round(p / 500) * 500;
    return { low: round(mid * 0.8), high: round(mid * 1.2), count: pool.length };
  }, [listings, draft.category, draft.fabrics]);

  const errors = stepErrors(step, draft, photos);

  function next() {
    if (errors.length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(i: number) {
    setShowErrors(false);
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const chosen = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    if (files.length > room) toast.message(`You can add up to ${MAX_PHOTOS} photos.`);
    setPhotos((p) => [...p, ...chosen.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i]!.preview);
      return p.filter((_, idx) => idx !== i);
    });
  }

  async function publish() {
    if (!user) return;
    for (let i = 0; i < STEPS.length; i++) {
      if (stepErrors(i, draft, photos).length) {
        goTo(i);
        setShowErrors(true);
        return;
      }
    }
    setPublishing(true);
    try {
      const paths: string[] = [];
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, photo.file, { contentType: photo.file.type });
        if (error) throw error;
        paths.push(path);
      }
      const cm = (v: string) => {
        const n = parseNum(v);
        return n === null ? null : fromUnit(n, draft.unit);
      };
      const sellerName =
        profile?.display_name ||
        [profile?.first_name, profile?.last_name?.[0] ? `${profile.last_name[0]}.` : ""]
          .filter(Boolean)
          .join(" ") ||
        "Ekeji seller";
      const { data, error } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          seller_name: sellerName,
          seller_location: draft.location || null,
          seller_rating: 5,
          seller_review_count: 0,
          seller_items_sold: 0,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          fabric_notes: draft.fabricNotes.trim() || null,
          condition_notes: draft.conditionNotes.trim() || null,
          included: draft.included.trim() || null,
          price_pence: Math.round(parseNum(draft.price)! * 100),
          original_price_pence: parseNum(draft.originalPrice)
            ? Math.round(parseNum(draft.originalPrice)! * 100)
            : null,
          accepts_offers: draft.acceptsOffers,
          category: draft.category,
          department: draft.department,
          occasion: "Celebration",
          colour: draft.colours.join(", "),
          fabric: draft.fabrics.join(", "),
          condition: draft.condition,
          uk_size: draft.ukSize || null,
          bust_cm: cm(draft.bust),
          waist_cm: cm(draft.waist),
          hip_cm: cm(draft.hip),
          shoulder_cm: cm(draft.shoulder),
          sleeve_cm: cm(draft.sleeve),
          length_cm: cm(draft.length),
          wearer_height_cm: cm(draft.wearerHeight),
          stretch_level: draft.stretch,
          closure: draft.closure || null,
          structure: draft.structure.trim() || null,
          alteration_potential: draft.alteration,
          fit_notes: draft.fitNotes.trim() || null,
          location: draft.location || null,
          delivery_options: draft.delivery ? [draft.delivery] : [],
          package_size: draft.packageSize,
          dispatch_days: draft.dispatchDays,
          image_key: COLOUR_IMAGE[draft.colours[0] ?? ""] ?? "emerald",
          image_paths: paths,
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      setPublishedId(data.id);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't publish your listing. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setDraft({ ...emptyDraft, unit: draft.unit, location: draft.location });
    setPublishedId(null);
    setStep(0);
  }

  async function shareListing() {
    if (!publishedId) return;
    const url = `${window.location.origin}/listing/${publishedId}`;
    try {
      if (navigator.share) await navigator.share({ title: draft.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
          <p className="eyebrow">Selling on Ekeji</p>
          <h1 className="mt-4 font-display text-4xl text-primary md:text-5xl">
            Your outfit&apos;s next outing starts here.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Log in or join Ekeji to list your outfit. One account lets you buy and sell.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Join Ekeji</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ mode: "signin" }}>Log in</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (publishedId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl text-primary md:text-5xl">
            Your outfit is ready for its second outing.
          </h1>
          <p className="mt-4 text-muted-foreground">
            “{draft.title}” is now live on Ekeji. We&apos;ll let you know when a buyer gets in touch.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/listing/$id" params={{ id: publishedId }}>View listing</Link>
            </Button>
            <Button variant="outline" onClick={shareListing}>Share listing</Button>
            <Button variant="ghost" onClick={reset}>List another outfit</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow">Sell an outfit</p>
        <h1 className="mt-3 font-display text-3xl text-primary md:text-4xl">{STEPS[step]}</h1>

        <ProgressBar step={step} onJump={(i) => i < step && goTo(i)} />

        <div className="mt-8 space-y-8">
          {step === 0 && (
            <BasicsStep draft={draft} set={set} photos={photos} addPhotos={addPhotos} removePhoto={removePhoto} />
          )}
          {step === 1 && <PriceStep draft={draft} set={set} suggested={suggested} />}
          {step === 2 && <FitStep draft={draft} set={set} />}
          {step === 3 && <DeliveryStep draft={draft} set={set} />}
          {step === 4 && <ReviewStep draft={draft} set={set} photos={photos} goTo={goTo} />}
        </div>

        {showErrors && errors.length > 0 && (
          <div role="alert" className="mt-6 border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="font-semibold">Before you continue:</p>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="sticky bottom-16 z-10 mt-10 flex items-center justify-between gap-3 border-t border-border bg-background/95 py-4 backdrop-blur md:bottom-0">
          <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0 || publishing}>
            Back
          </Button>
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={() => (errors.length ? setShowErrors(true) : publish())} disabled={publishing}>
              {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish listing
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

type SetFn = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

function ProgressBar({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="mt-6 grid grid-cols-5 gap-2" aria-label="Listing progress">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onJump(i)}
            disabled={i >= step}
            aria-current={i === step ? "step" : undefined}
            className="group w-full text-left disabled:cursor-default"
          >
            <span className={`block h-1 w-full ${i <= step ? "bg-primary" : "bg-border"}`} />
            <span
              className={`mt-2 hidden text-xs md:block ${i === step ? "font-semibold text-primary" : "text-muted-foreground"} ${i < step ? "group-hover:text-primary" : ""}`}
            >
              {i < step && <Check className="mr-1 inline h-3 w-3" />}
              {label}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Dropdown({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  clearLabel,
  hint,
}: {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  clearLabel?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
        <SelectTrigger id={id} className="w-full bg-card">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clearLabel && <SelectItem value={NONE}>{clearLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MultiSelect({
  id,
  label,
  options,
  values,
  onChange,
  placeholder = "Select…",
  hint,
  swatches,
}: {
  id: string;
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
  swatches?: Record<string, string>;
}) {
  const sw = (o: string) =>
    swatches?.[o] ? (
      <span aria-hidden className="h-4 w-4 shrink-0 border border-border" style={{ background: swatches[o] }} />
    ) : null;
  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((x) => x !== o) : [...values, o]);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger
          id={id}
          className="flex w-full items-center justify-between gap-2 border border-input bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 data-[state=open]:border-primary"
        >
          <span className={values.length ? "" : "text-muted-foreground"}>
            {values.length ? (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {values.map((v) => (
                  <span key={v} className="inline-flex items-center gap-1.5">{sw(v)}{v}</span>
                ))}
              </span>
            ) : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
          {options.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2.5 px-2 py-2 text-sm hover:bg-muted"
            >
              <Checkbox checked={values.includes(o)} onCheckedChange={() => toggle(o)} />
              {sw(o)}
              {o}
            </label>
          ))}
        </PopoverContent>
      </Popover>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BasicsStep({
  draft,
  set,
  photos,
  addPhotos,
  removePhoto,
}: {
  draft: Draft;
  set: SetFn;
  photos: Photo[];
  addPhotos: (f: FileList | null) => void;
  removePhoto: (i: number) => void;
}) {
  return (
    <>
      <Section title="Photos" hint={`Up to ${MAX_PHOTOS}. Include the front, back, close-ups of embellishment and any flaws.`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative aspect-[3/4] overflow-hidden bg-muted">
              <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-card text-xs text-muted-foreground hover:border-primary">
              <ImagePlus className="h-5 w-5" />
              Add photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </Section>

      <Field id="title" label="Title">
        <Input
          id="title"
          value={draft.title}
          maxLength={80}
          placeholder="e.g. Emerald corset lace Aso Ebi gown"
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Dropdown
          id="department"
          label="Wardrobe"
          options={WARDROBE.map((w) => w.label)}
          value={WARDROBE.find((w) => w.value === draft.department)?.label ?? ""}
          onChange={(label) => {
            const match = WARDROBE.find((w) => w.label === label);
            if (match) set("department", match.value);
          }}
        />
        <Dropdown id="category" label="Category" options={CATEGORIES} value={draft.category} onChange={(v) => set("category", v)} />
        <MultiSelect
          id="colour"
          label="Colours"
          options={COLOURS}
          values={draft.colours}
          onChange={(v) => set("colours", v)}
          swatches={Object.fromEntries(BASIC_COLOURS.map((c) => [c.name, c.swatch]))}
          hint="Pick every main colour."
        />
        <MultiSelect id="fabric" label="Fabric types" options={FABRICS} values={draft.fabrics} onChange={(v) => set("fabrics", v)} />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="condition">Condition</Label>
          <Select value={draft.condition} onValueChange={(v) => set("condition", v)}>
            <SelectTrigger id="condition" className="h-auto min-h-9 w-full bg-card text-left">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_DETAILS.map((c) => (
                <SelectItem key={c.name} value={c.name} textValue={c.name}>
                  <span className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.description}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Field id="description" label="Description">
        <Textarea
          id="description"
          rows={4}
          value={draft.description}
          placeholder="Tell buyers about the outfit, the event you wore it to and how it felt."
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="fabricNotes" label="Fabric and craftsmanship (optional)">
          <Textarea id="fabricNotes" rows={3} value={draft.fabricNotes} onChange={(e) => set("fabricNotes", e.target.value)} />
        </Field>
        <Field id="conditionNotes" label="Condition notes (optional)">
          <Textarea
            id="conditionNotes"
            rows={3}
            value={draft.conditionNotes}
            placeholder="Any loose beads, marks or alterations?"
            onChange={(e) => set("conditionNotes", e.target.value)}
          />
        </Field>
      </div>
      <Field id="included" label="What is included (optional)">
        <Input
          id="included"
          value={draft.included}
          placeholder="e.g. Dress and matching gele"
          onChange={(e) => set("included", e.target.value)}
        />
      </Field>
    </>
  );
}

function PriceStep({
  draft,
  set,
  suggested,
}: {
  draft: Draft;
  set: SetFn;
  suggested: { low: number; high: number; count: number } | null;
}) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="originalPrice" label="Original price paid (optional)">
          <PoundInput id="originalPrice" value={draft.originalPrice} onChange={(v) => set("originalPrice", v)} />
        </Field>
        <Field id="price" label="Selling price">
          <PoundInput id="price" value={draft.price} onChange={(v) => set("price", v)} />
        </Field>
      </div>
      {suggested && (
        <div className="card-editorial p-5">
          <p className="eyebrow">Suggested price</p>
          <p className="mt-2 font-display text-2xl text-primary">
            {gbp(suggested.low)} – {gbp(suggested.high)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on {suggested.count} comparable outfit{suggested.count === 1 ? "" : "s"} on Ekeji
            {draft.category ? ` in ${draft.category}` : ""}.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => set("price", String(Math.round((suggested.low + suggested.high) / 200)))}
          >
            Use {gbp(Math.round((suggested.low + suggested.high) / 200) * 100)}
          </Button>
        </div>
      )}
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={draft.acceptsOffers} onCheckedChange={(c) => set("acceptsOffers", c === true)} />
        I am willing to consider offers
      </label>
    </>
  );
}

function PoundInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
      <Input
        id={id}
        inputMode="decimal"
        type="number"
        min={0}
        step="1"
        className="pl-7"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FitStep({ draft, set }: { draft: Draft; set: SetFn }) {
  const u = draft.unit;
  const m = (key: "bust" | "waist" | "hip" | "shoulder" | "sleeve" | "length" | "wearerHeight", label: string) => (
    <Field id={key} label={label}>
      <div className="relative">
        <Input
          id={key}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          className="pr-10"
          value={draft[key]}
          onChange={(e) => set(key, e.target.value)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{u}</span>
      </div>
    </Field>
  );

  function switchUnit(next: Unit) {
    if (next === u) return;
    const conv = (v: string) => {
      const n = parseNum(v);
      if (n === null) return v;
      const cm = fromUnit(n, u);
      return String(next === "cm" ? cm : Math.round((cm / 2.54) * 10) / 10);
    };
    (["bust", "waist", "hip", "shoulder", "sleeve", "length", "wearerHeight"] as const).forEach((k) =>
      set(k, conv(draft[k])),
    );
    set("unit", next);
  }

  return (
    <>
      <p className="border-l-2 border-gold bg-card p-4 text-sm">
        Custom-made outfits can vary widely. Accurate measurements help your outfit find its next perfect outing.
      </p>
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <h2 className="font-display text-lg">Garment measurements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Measure the garment laid flat, not the person. Double flat widths for bust, waist and hip.
          </p>
        </div>
        <Dropdown
          id="unit"
          label="Units"
          options={["Centimetres", "Inches"]}
          value={u === "cm" ? "Centimetres" : "Inches"}
          onChange={(label) => switchUnit(label === "Inches" ? "in" : "cm")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {m("bust", "Bust")}
        {m("waist", "Waist")}
        {m("hip", "Hip")}
        {m("shoulder", "Shoulder width")}
        {m("sleeve", "Sleeve length")}
        {m("length", "Dress length")}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Dropdown
          id="ukSize"
          label="Standard UK size (optional)"
          options={UK_SIZES}
          value={draft.ukSize}
          onChange={(v) => set("ukSize", v)}
          clearLabel="Not sure — leave blank"
          placeholder="Select a size"
        />
        <Dropdown id="stretch" label="Stretch level" options={STRETCH_LEVELS} value={draft.stretch} onChange={(v) => set("stretch", v)} />
        <Dropdown
          id="closure"
          label="Closure type (optional)"
          options={CLOSURES}
          value={draft.closure}
          onChange={(v) => set("closure", v)}
          clearLabel="Not sure"
          placeholder="Select a closure"
        />
        <Dropdown
          id="alteration"
          label="Alteration potential"
          options={ALTERATION_LEVELS}
          value={draft.alteration}
          onChange={(v) => set("alteration", v)}
        />
      </div>
      <Section title="Original wearer (optional)" hint="Body measurement, separate from the garment.">
        <div className="max-w-xs">{m("wearerHeight", "Original wearer height")}</div>
      </Section>
      <Field id="structure" label="Structure and tailoring details" hint="Corset, boning, cups, lining, seam allowance…">
        <Textarea id="structure" rows={3} value={draft.structure} onChange={(e) => set("structure", e.target.value)} />
      </Field>
      <Field id="fitNotes" label="Fit notes for buyers (optional)">
        <Textarea
          id="fitNotes"
          rows={3}
          value={draft.fitNotes}
          placeholder="e.g. Fits snugly on the waist; best for someone 5'6 and above in heels."
          onChange={(e) => set("fitNotes", e.target.value)}
        />
      </Field>
    </>
  );
}

function DeliveryStep({ draft, set }: { draft: Draft; set: SetFn }) {
  return (
    <>
      <p className="border-l-2 border-gold bg-card p-4 text-sm">
        Ekeji orders use tracked delivery. Buyers pay for delivery at checkout.
      </p>
      <Dropdown
        id="delivery"
        label="Delivery method"
        options={DELIVERY_OPTIONS}
        value={draft.delivery}
        onChange={(v) => set("delivery", v)}
        placeholder="Choose how you'll send it"
        hint="Pick the single method you can offer on this listing."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Dropdown
          id="packageSize"
          label="Package size"
          options={PACKAGE_SIZES.map((p) => p.value)}
          value={draft.packageSize}
          onChange={(v) => set("packageSize", v)}
          hint="Small: gele and accessories · Medium: most dresses and sets · Large: boned or heavily embellished pieces"
        />
        <Dropdown
          id="dispatch"
          label="Dispatch time"
          options={DISPATCH.map((d) => `Within ${d} days`)}
          value={draft.dispatchDays ? `Within ${draft.dispatchDays} days` : ""}
          onChange={(v) => set("dispatchDays", Number(v.replace(/\D/g, "")))}
        />
      </div>
      <Field id="location" label="Ships from" hint="Town or city only, e.g. Peckham, London.">
        <Input id="location" value={draft.location} onChange={(e) => set("location", e.target.value)} />
      </Field>
    </>
  );
}

function ReviewStep({
  draft,
  set,
  photos,
  goTo,
}: {
  draft: Draft;
  set: SetFn;
  photos: Photo[];
  goTo: (i: number) => void;
}) {
  const u = draft.unit;
  const val = (v: string) => (v ? `${v} ${u}` : "—");
  return (
    <>
      <div className="card-editorial overflow-hidden md:grid md:grid-cols-[220px_1fr]">
        {photos[0] && <img src={photos[0].preview} alt="Cover" className="aspect-[3/4] w-full object-cover" />}
        <div className="p-5">
          <p className="eyebrow">{draft.category}</p>
          <h2 className="mt-2 font-display text-2xl">{draft.title}</h2>
          <p className="mt-2 text-xl text-primary">
            {parseNum(draft.price) ? gbp(Math.round(parseNum(draft.price)! * 100)) : "—"}
            {parseNum(draft.originalPrice) && (
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {gbp(Math.round(parseNum(draft.originalPrice)! * 100))}
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {[draft.condition, draft.ukSize, draft.colours.join(", "), draft.fabrics.join(", ")].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{photos.length} photo{photos.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <ReviewBlock title="Basics" onEdit={() => goTo(0)}>
        <Row k="Description" v={draft.description || "—"} />
        <Row k="What is included" v={draft.included || "—"} />
        <Row k="Condition notes" v={draft.conditionNotes || "—"} />
      </ReviewBlock>
      <ReviewBlock title="Price" onEdit={() => goTo(1)}>
        <Row k="Selling price" v={draft.price ? `£${draft.price}` : "—"} />
        <Row k="Original price" v={draft.originalPrice ? `£${draft.originalPrice}` : "—"} />
        <Row k="Open to offers" v={draft.acceptsOffers ? "Yes" : "No"} />
      </ReviewBlock>
      <ReviewBlock title="Fit & measurements" onEdit={() => goTo(2)}>
        <Row k="Bust / waist / hip" v={`${val(draft.bust)} / ${val(draft.waist)} / ${val(draft.hip)}`} />
        <Row k="Shoulder / sleeve / length" v={`${val(draft.shoulder)} / ${val(draft.sleeve)} / ${val(draft.length)}`} />
        <Row k="Original wearer height" v={val(draft.wearerHeight)} />
        <Row k="Stretch" v={draft.stretch || "—"} />
        <Row k="Closure" v={draft.closure || "—"} />
        <Row k="Alteration potential" v={draft.alteration || "—"} />
      </ReviewBlock>
      <ReviewBlock title="Delivery" onEdit={() => goTo(3)}>
        <Row k="Method" v={draft.delivery || "—"} />
        <Row k="Package size" v={draft.packageSize || "—"} />
        <Row k="Dispatch" v={draft.dispatchDays ? `Within ${draft.dispatchDays} days` : "—"} />
        <Row k="Ships from" v={draft.location || "—"} />
      </ReviewBlock>

      <label className="flex items-start gap-3 text-sm">
        <Checkbox className="mt-0.5" checked={draft.confirmed} onCheckedChange={(c) => set("confirmed", c === true)} />
        I confirm that my photos, measurements, condition notes and description are accurate.
      </label>
    </>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">{children}</dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
