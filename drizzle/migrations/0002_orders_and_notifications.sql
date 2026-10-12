CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_title text NOT NULL,
  image_key text NOT NULL DEFAULT 'emerald',
  image_path text,
  item_pence int NOT NULL,
  delivery_method text NOT NULL,
  delivery_pence int NOT NULL,
  fee_pence int NOT NULL,
  total_pence int NOT NULL,
  address_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  address_city text NOT NULL,
  address_postcode text NOT NULL,
  stage int NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 6),
  tracking_number text,
  drop_off_by date,
  delivered_at timestamptz,
  issue_type text,
  issue_details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read their orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers place orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id AND stage = 0);
CREATE POLICY "Parties update their orders" ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.listings;
BEGIN
  SELECT * INTO l FROM public.listings WHERE id = NEW.listing_id FOR UPDATE;
  IF l.id IS NULL OR l.status <> 'active' THEN
    RAISE EXCEPTION 'This outfit is no longer available';
  END IF;
  IF l.seller_id = NEW.buyer_id THEN
    RAISE EXCEPTION 'You cannot buy your own listing';
  END IF;
  NEW.seller_id := l.seller_id;
  NEW.item_pence := l.price_pence;
  NEW.listing_title := l.title;
  NEW.image_key := l.image_key;
  NEW.image_path := l.image_paths[1];
  NEW.drop_off_by := (now() + make_interval(days => COALESCE(l.dispatch_days, 3)))::date;
  UPDATE public.listings SET status = 'sold' WHERE id = l.id;
  RETURN NEW;
END $$;

CREATE TRIGGER on_order_before_insert BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order();

CREATE OR REPLACE FUNCTION public.notify_order_parties()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.seller_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, order_id)
      VALUES (NEW.seller_id, 'You made a sale', NEW.listing_title || ' has been bought. Please dispatch by ' || to_char(NEW.drop_off_by, 'DD Mon') || '.', NEW.id);
    END IF;
  ELSIF NEW.stage <> OLD.stage THEN
    NEW.updated_at := now();
    IF NEW.stage = 2 THEN
      INSERT INTO public.notifications (user_id, title, body, order_id)
      VALUES (NEW.buyer_id, 'Your parcel is on its way', NEW.listing_title || ' has been dropped off. Tracking ' || COALESCE(NEW.tracking_number, '') || '.', NEW.id);
    ELSIF NEW.stage = 5 THEN
      INSERT INTO public.notifications (user_id, title, body, order_id)
      VALUES (NEW.buyer_id, 'Your order has been delivered', 'You have 48 hours to report a delivery issue.', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_order_after_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_parties();
CREATE TRIGGER on_order_before_update BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_parties();