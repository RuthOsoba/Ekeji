ALTER TABLE public.listings ADD COLUMN department text NOT NULL DEFAULT 'womens';

UPDATE public.listings SET department = 'mens' WHERE category = 'Menswear';

COMMENT ON COLUMN public.listings.department IS 'Which wardrobe the outfit belongs to: womens or mens. Accessories and unisex pieces default to womens.';