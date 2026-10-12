import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews";

export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(cls, n <= Math.round(value) ? "fill-gold text-gold" : "text-border")} aria-hidden />
      ))}
    </span>
  );
}

function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <Star className={cn("h-6 w-6", n <= value ? "fill-gold text-gold" : "text-border")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <Stars value={review.rating} />
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      {review.body && <p className="mt-2 text-sm leading-relaxed">&ldquo;{review.body}&rdquo;</p>}
      <p className="mt-1 text-xs text-muted-foreground">— {review.reviewer?.display_name ?? "Ekeji member"}, verified purchase</p>
    </article>
  );
}

type Direction = "buyer_to_seller" | "seller_to_buyer";

export function ReviewForm({ orderId, userId, direction }: { orderId: string; userId: string; direction: Direction }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const forSeller = direction === "buyer_to_seller";
  const ready = rating > 0 && a > 0 && b > 0 && (!forSeller || c > 0);

  async function submit() {
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      order_id: orderId,
      listing_id: orderId, // replaced server-side from the order
      reviewer_id: userId,
      direction,
      rating,
      body: body.trim() || null,
      ...(forSeller
        ? { item_accuracy: a, communication: b, dispatch_speed: c }
        : { communication: a, smooth_transaction: b }),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thank you — your review is live");
    queryClient.invalidateQueries({ queryKey: ["order-reviews", orderId] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
    queryClient.invalidateQueries({ queryKey: ["listing"] });
  }

  return (
    <section className="card-editorial space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl text-primary">{forSeller ? "Review your seller" : "Review your buyer"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {forSeller
            ? "Your review appears on the seller's profile and listings."
            : "Buyer reviews stay private at this stage and are only shown in order details."}
        </p>
      </div>
      <StarInput label="Overall" value={rating} onChange={setRating} />
      {forSeller ? (
        <>
          <StarInput label="Item accuracy" value={a} onChange={setA} />
          <StarInput label="Communication" value={b} onChange={setB} />
          <StarInput label="Dispatch speed" value={c} onChange={setC} />
        </>
      ) : (
        <>
          <StarInput label="Communication" value={a} onChange={setA} />
          <StarInput label="Smooth transaction" value={b} onChange={setB} />
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="review-body">Written review (optional)</Label>
        <Textarea id="review-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} />
      </div>
      <Button disabled={!ready || busy} onClick={submit}>Submit review</Button>
    </section>
  );
}
