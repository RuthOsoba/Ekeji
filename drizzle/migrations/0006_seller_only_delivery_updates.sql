CREATE OR REPLACE FUNCTION public.guard_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF coalesce(current_setting('ekeji.system', true), '') = 'on' OR uid IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.buyer_id <> OLD.buyer_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.total_pence <> OLD.total_pence OR NEW.item_pence <> OLD.item_pence THEN
    RAISE EXCEPTION 'Order details cannot be changed';
  END IF;
  IF uid = OLD.seller_id THEN
    IF NEW.issue_type IS DISTINCT FROM OLD.issue_type OR NEW.issue_details IS DISTINCT FROM OLD.issue_details
       OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at THEN
      RAISE EXCEPTION 'Only the buyer can report an issue';
    END IF;
    IF NEW.stage <> OLD.stage AND NOT (
      (OLD.stage = 0 AND NEW.stage = 1) OR
      (OLD.stage = 1 AND NEW.stage = 2 AND OLD.delivery_method <> 'Local collection' AND coalesce(NEW.tracking_number,'') <> '') OR
      (OLD.stage = 1 AND NEW.stage = 5 AND OLD.delivery_method = 'Local collection')
    ) THEN
      RAISE EXCEPTION 'Delivery updates after drop-off come from the courier';
    END IF;
    IF NEW.stage = 5 AND OLD.stage <> 5 THEN NEW.delivered_at := now(); END IF;
    IF NEW.tracking_number IS DISTINCT FROM OLD.tracking_number AND OLD.stage >= 2 THEN
      RAISE EXCEPTION 'Tracking number is locked after drop-off';
    END IF;
    RETURN NEW;
  ELSIF uid = OLD.buyer_id THEN
    IF NEW.tracking_number IS DISTINCT FROM OLD.tracking_number OR NEW.delivered_at IS DISTINCT FROM OLD.delivered_at THEN
      RAISE EXCEPTION 'Only the seller and courier update delivery';
    END IF;
    IF NEW.stage <> OLD.stage AND NOT (OLD.stage = 5 AND NEW.stage = 6) THEN
      RAISE EXCEPTION 'Only the seller and courier update delivery';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Not allowed';
END $$;

CREATE TRIGGER on_order_guard_update BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_update();

CREATE OR REPLACE FUNCTION public.sync_order_tracking(_order_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o public.orders; trk text;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id;
  IF o.id IS NULL OR (auth.uid() <> o.buyer_id AND auth.uid() IS DISTINCT FROM o.seller_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  PERFORM set_config('ekeji.system', 'on', true);
  IF o.seller_id IS NULL AND o.stage = 0 AND o.created_at < now() - interval '20 seconds' THEN
    UPDATE public.orders SET stage = 1 WHERE id = o.id;
  ELSIF o.seller_id IS NULL AND o.stage = 1 AND o.updated_at < now() - interval '20 seconds' THEN
    IF o.delivery_method = 'Local collection' THEN
      UPDATE public.orders SET stage = 5, delivered_at = now() WHERE id = o.id;
    ELSE
      IF o.delivery_method ILIKE 'Royal Mail%' THEN
        trk := chr(65 + floor(random()*26)::int) || chr(65 + floor(random()*26)::int) || lpad(floor(random()*1e9)::bigint::text, 9, '0') || 'GB';
      ELSE
        trk := 'H' || lpad(floor(random()*1e15)::bigint::text, 15, '0');
      END IF;
      UPDATE public.orders SET stage = 2, tracking_number = trk WHERE id = o.id;
    END IF;
  ELSIF o.stage = 2 AND o.updated_at < now() - interval '2 minutes' THEN
    UPDATE public.orders SET stage = 3 WHERE id = o.id;
  ELSIF o.stage = 3 AND o.updated_at < now() - interval '3 minutes' THEN
    UPDATE public.orders SET stage = 5, delivered_at = now() WHERE id = o.id;
  END IF;
  PERFORM set_config('ekeji.system', 'off', true);
  SELECT stage INTO o.stage FROM public.orders WHERE id = _order_id;
  RETURN o.stage;
END $$;

REVOKE EXECUTE ON FUNCTION public.sync_order_tracking(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sync_order_tracking(uuid) TO authenticated;