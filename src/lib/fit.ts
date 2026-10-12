import type { Unit } from "./format";

export type FitLabel =
  | "Likely fit"
  | "May need alteration"
  | "Tailor review recommended"
  | "Unlikely fit";

export interface FitProfile {
  bust_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  height_cm: number | null;
  preferred_fit: "snug" | "fitted" | "relaxed";
  unit: Unit;
}

export interface GarmentFit {
  bust_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  length_cm?: number | null;
  stretch_level?: string | null;
}

const EASE: Record<FitProfile["preferred_fit"], number> = {
  snug: 2,
  fitted: 5,
  relaxed: 9,
};

const STRETCH_ALLOWANCE: Record<string, number> = {
  "No stretch": 0,
  "Low stretch": 2,
  "Medium stretch": 4,
  "High stretch": 7,
};

const RANK: Record<FitLabel, number> = {
  "Likely fit": 0,
  "May need alteration": 1,
  "Tailor review recommended": 2,
  "Unlikely fit": 3,
};

interface AreaResult {
  area: string;
  label: FitLabel;
  note: string;
}

function assessArea(
  area: string,
  garment: number | null,
  body: number | null,
  ease: number,
  stretch: number,
): AreaResult | null {
  if (garment === null || body === null) return null;
  const diff = Number(garment) - Number(body) + stretch;

  if (diff >= ease - 2 && diff <= ease + 12) {
    return { area, label: "Likely fit", note: `likely to fit through the ${area}` };
  }
  if (diff >= -1) {
    return {
      area,
      label: "May need alteration",
      note: `the ${area} will sit close to the body and may need a small alteration`,
    };
  }
  if (diff >= -5) {
    return {
      area,
      label: "Tailor review recommended",
      note: `the ${area} is smaller than your measurement, so a tailor should review it`,
    };
  }
  return {
    area,
    label: "Unlikely fit",
    note: `the ${area} is much smaller than your measurement`,
  };
}

export interface FitGuidance {
  label: FitLabel;
  message: string;
}

export function fitGuidance(
  garment: GarmentFit,
  profile: FitProfile | null,
): FitGuidance | null {
  if (!profile) return null;
  const ease = EASE[profile.preferred_fit] ?? 5;
  const stretch = STRETCH_ALLOWANCE[garment.stretch_level ?? "No stretch"] ?? 0;

  const results = [
    assessArea("bust", garment.bust_cm, profile.bust_cm, ease, stretch),
    assessArea("waist", garment.waist_cm, profile.waist_cm, ease, stretch),
    assessArea("hip", garment.hip_cm, profile.hip_cm, ease, stretch),
  ].filter((r): r is AreaResult => r !== null);

  if (results.length === 0) return null;

  const worst = results.reduce((a, b) => (RANK[b.label] > RANK[a.label] ? b : a));
  const good = results.filter((r) => r.label === "Likely fit");

  let message: string;
  if (worst.label === "Likely fit") {
    message = `Based on your measurements, this piece is likely to fit through the ${results
      .map((r) => r.area)
      .join(", ")}.`;
  } else if (good.length > 0) {
    message = `Based on your measurements, this piece is likely to fit through the ${good
      .map((r) => r.area)
      .join(" and ")}. However, ${worst.note}.`;
  } else {
    message = `Based on your measurements, ${worst.note}.`;
  }

  return { label: worst.label, message };
}

export const FIT_DISCLAIMER =
  "Fit guidance is an estimate only and does not guarantee fit.";

export const MEASUREMENT_DISCLAIMER =
  "Measurements are provided by the seller. Compare them carefully with a garment you already own for the best fit.";
