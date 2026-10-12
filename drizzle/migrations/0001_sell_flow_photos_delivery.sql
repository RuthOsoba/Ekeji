ALTER TABLE public.listings
  ADD COLUMN image_paths text[] NOT NULL DEFAULT '{}',
  ADD COLUMN accepts_offers boolean NOT NULL DEFAULT false,
  ADD COLUMN package_size text,
  ADD COLUMN dispatch_days int;

CREATE POLICY "Listing photos readable by all" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'listing-photos');
CREATE POLICY "Users upload own listing photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own listing photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);