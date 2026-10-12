export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export type Unit = "cm" | "in";

export function toUnit(cm: number | null | undefined, unit: Unit): number | null {
  if (cm === null || cm === undefined) return null;
  return unit === "cm" ? Number(cm) : Math.round((Number(cm) / 2.54) * 10) / 10;
}

export function fromUnit(value: number, unit: Unit): number {
  return unit === "cm" ? value : Math.round(value * 2.54 * 10) / 10;
}

export function measure(cm: number | null | undefined, unit: Unit): string {
  const v = toUnit(cm, unit);
  if (v === null) return "—";
  return unit === "cm" ? `${v} cm` : `${v} in`;
}

export function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 30) return `Listed ${days} days ago`;
  const months = Math.round(days / 30);
  return `Listed ${months} month${months > 1 ? "s" : ""} ago`;
}
