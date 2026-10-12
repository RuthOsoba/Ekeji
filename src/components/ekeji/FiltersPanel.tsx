import { Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ALTERATION_LEVELS,
  CATEGORIES,
  COLOURS,
  CONDITIONS,
  DELIVERY_OPTIONS,
  FABRICS,
  STRETCH_LEVELS,
  UK_SIZES,
  DEPARTMENTS,
  countActiveFilters,
  emptyFilters,
  type ListingFilters,
} from "@/lib/ekeji";
import { fromUnit, toUnit, type Unit } from "@/lib/format";

interface Props {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
}

type ListKey =
  | "categories"
  | "colours"
  | "fabrics"
  | "conditions"
  | "sizes"
  | "stretch"
  | "alteration"
  | "delivery";

export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div
      role="group"
      aria-label="Measurement unit"
      className="inline-flex overflow-hidden rounded-full border border-border"
    >
      {(["cm", "in"] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            unit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {u === "cm" ? "Centimetres" : "Inches"}
        </button>
      ))}
    </div>
  );
}

function ChipGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="eyebrow">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FiltersPanel({ filters, onChange, unit, onUnitChange }: Props) {
  const active = countActiveFilters(filters);

  function toggleList(key: ListKey, value: string) {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  function setNumber(key: keyof ListingFilters, raw: string, isMeasurement: boolean) {
    if (raw === "") {
      onChange({ ...filters, [key]: null });
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange({ ...filters, [key]: isMeasurement ? fromUnit(parsed, unit) : parsed });
  }

  function measurementValue(key: keyof ListingFilters): string {
    const v = filters[key] as number | null;
    const converted = toUnit(v, unit);
    return converted === null ? "" : String(converted);
  }

  const measurementRows: { label: string; min: keyof ListingFilters; max: keyof ListingFilters }[] = [
    { label: "Garment bust", min: "bustMin", max: "bustMax" },
    { label: "Garment waist", min: "waistMin", max: "waistMax" },
    { label: "Garment hip", min: "hipMin", max: "hipMax" },
    { label: "Dress length", min: "lengthMin", max: "lengthMax" },
    { label: "Original wearer height", min: "heightMin", max: "heightMax" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{active === 0 ? "No filters" : `${active} filters applied`}</p>
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...emptyFilters, q: filters.q })}>
          Clear all
        </Button>
      </div>

      <section aria-label="Who is it for">
        <p className="eyebrow mb-2.5">Wardrobe</p>
        <div
          role="group"
          aria-label="Filter by wardrobe"
          className="inline-flex overflow-hidden rounded-full border border-border"
        >
          {DEPARTMENTS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange({ ...filters, department: d.value })}
              aria-pressed={filters.department === d.value}
              className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                filters.department === d.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-gold/40 bg-card p-4 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Ruler className="h-4 w-4 text-gold" aria-hidden />
            Measurements
          </h3>
          <UnitToggle unit={unit} onChange={onUnitChange} />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Bespoke outfits vary widely. Filter by the garment&apos;s own measurements to find pieces
          made close to your shape.
        </p>
        <div className="space-y-3">
          {measurementRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1.2fr)_auto_auto]"
            >
              <Label className="min-w-0 text-sm font-normal">{row.label}</Label>
              <Input
                type="number"
                inputMode="decimal"
                aria-label={`${row.label} minimum in ${unit}`}
                placeholder={`Min ${unit}`}
                value={measurementValue(row.min)}
                onChange={(e) => setNumber(row.min, e.target.value, true)}
                className="w-24"
              />
              <Input
                type="number"
                inputMode="decimal"
                aria-label={`${row.label} maximum in ${unit}`}
                placeholder={`Max ${unit}`}
                value={measurementValue(row.max)}
                onChange={(e) => setNumber(row.max, e.target.value, true)}
                className="w-24"
              />
            </div>
          ))}
        </div>
      </section>

      <fieldset className="space-y-2.5">
        <legend className="eyebrow">Price (GBP)</legend>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            aria-label="Minimum price in pounds"
            placeholder="Min £"
            value={filters.minPrice ?? ""}
            onChange={(e) => setNumber("minPrice", e.target.value, false)}
            className="w-28"
          />
          <Input
            type="number"
            aria-label="Maximum price in pounds"
            placeholder="Max £"
            value={filters.maxPrice ?? ""}
            onChange={(e) => setNumber("maxPrice", e.target.value, false)}
            className="w-28"
          />
        </div>
      </fieldset>

      <ChipGroup
        title="Category"
        options={CATEGORIES}
        selected={filters.categories}
        onToggle={(v) => toggleList("categories", v)}
      />
      <ChipGroup
        title="Colour"
        options={COLOURS}
        selected={filters.colours}
        onToggle={(v) => toggleList("colours", v)}
      />
      <ChipGroup
        title="Fabric"
        options={FABRICS}
        selected={filters.fabrics}
        onToggle={(v) => toggleList("fabrics", v)}
      />
      <ChipGroup
        title="UK size"
        options={UK_SIZES}
        selected={filters.sizes}
        onToggle={(v) => toggleList("sizes", v)}
      />
      <ChipGroup
        title="Stretch level"
        options={STRETCH_LEVELS}
        selected={filters.stretch}
        onToggle={(v) => toggleList("stretch", v)}
      />
      <ChipGroup
        title="Condition"
        options={CONDITIONS}
        selected={filters.conditions}
        onToggle={(v) => toggleList("conditions", v)}
      />
      <ChipGroup
        title="Alteration potential"
        options={ALTERATION_LEVELS}
        selected={filters.alteration}
        onToggle={(v) => toggleList("alteration", v)}
      />
      <ChipGroup
        title="Delivery"
        options={DELIVERY_OPTIONS}
        selected={filters.delivery}
        onToggle={(v) => toggleList("delivery", v)}
      />

      <div className="space-y-2.5">
        <Label htmlFor="filter-location" className="eyebrow">
          Location
        </Label>
        <Input
          id="filter-location"
          placeholder="e.g. London"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
        <Label htmlFor="filter-recent" className="text-sm font-normal">
          Listed in the last 14 days
        </Label>
        <Switch
          id="filter-recent"
          checked={filters.recentOnly}
          onCheckedChange={(checked) => onChange({ ...filters, recentOnly: checked })}
        />
      </div>
    </div>
  );
}
