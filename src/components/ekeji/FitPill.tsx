import type { FitLabel } from "@/lib/fit";

const styles: Record<FitLabel, string> = {
  "Likely fit": "bg-success/12 text-success border-success/30",
  "May need alteration": "bg-gold/15 text-gold-foreground border-gold/40",
  "Tailor review recommended": "bg-secondary text-secondary-foreground border-border",
  "Unlikely fit": "bg-destructive/10 text-destructive border-destructive/30",
};

export function FitPill({ label, className = "" }: { label: FitLabel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide ${styles[label]} ${className}`}
    >
      {label}
    </span>
  );
}
