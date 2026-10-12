CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('buyer_to_seller','seller_to_buyer')),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  item_accuracy int CHECK (item_accuracy BETWEEN 1 AND 5),
  communication int CHECK (communication BETWEEN 1 AND 5),
  dispatch_speed int CHECK (dispatch_speed BETWEEN 1 AND 5),
  smooth_transaction int CHECK (smooth_transaction BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, direction)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller reviews are public" ON public.reviews FOR SELECT TO anon, authenticated
  USING (direction = 'buyer_to_seller');
CREATE POLICY "Buyer reviews visible to the two parties" ON public.reviews FOR SELECT TO authenticated
  USING (direction = 'seller_to_buyer' AND (auth.uid() = reviewer_id OR auth.uid() = reviewee_id));

CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = NEW.order_id;
  IF o.id IS NULL OR o.stage < 6 THEN RAISE EXCEPTION 'Reviews open once the order is complete'; END IF;
  NEW.listing_id := o.listing_id;
  IF NEW.direction = 'buyer_to_seller' THEN
    IF NEW.reviewer_id <> o.buyer_id THEN RAISE EXCEPTION 'Only the buyer can review the seller'; END IF;
    NEW.reviewee_id := o.seller_id;
  ELSE
    IF o.seller_id IS NULL OR NEW.reviewer_id <> o.seller_id THEN RAISE EXCEPTION 'Only the seller can review the buyer'; END IF;
    NEW.reviewee_id := o.buyer_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER reviews_validate BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review();

CREATE POLICY "Order parties write reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.after_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.direction = 'buyer_to_seller' THEN
    IF NEW.reviewee_id IS NOT NULL THEN
      UPDATE public.listings l SET
        seller_rating = s.avg, seller_review_count = s.cnt
      FROM (SELECT round(avg(rating)::numeric, 1) avg, count(*)::int cnt FROM public.reviews
            WHERE reviewee_id = NEW.reviewee_id AND direction = 'buyer_to_seller') s
      WHERE l.seller_id = NEW.reviewee_id;
      INSERT INTO public.notifications (user_id, title, body, order_id)
      VALUES (NEW.reviewee_id, 'You received a review', NEW.rating || ' stars for your sale.', NEW.order_id);
    ELSE
      UPDATE public.listings SET
        seller_rating = round(((seller_rating * seller_review_count) + NEW.rating) / (seller_review_count + 1), 1),
        seller_review_count = seller_review_count + 1
      WHERE id = NEW.listing_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER reviews_after_insert AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.after_review();