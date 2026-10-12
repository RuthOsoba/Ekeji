ALTER TABLE public.listings
ADD COLUMN favourite_count integer NOT NULL DEFAULT 0 CHECK (favourite_count >= 0);

UPDATE public.listings l
SET favourite_count = counts.total
FROM (
  SELECT listing_id, count(*)::integer AS total
  FROM public.saved_items
  GROUP BY listing_id
) counts
WHERE l.id = counts.listing_id;

CREATE OR REPLACE FUNCTION public.sync_listing_favourite_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET favourite_count = favourite_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  END IF;

  UPDATE public.listings
  SET favourite_count = GREATEST(favourite_count - 1, 0)
  WHERE id = OLD.listing_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER sync_listing_favourite_count_after_save
AFTER INSERT OR DELETE ON public.saved_items
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_favourite_count();