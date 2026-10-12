-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  display_name text,
  postcode text,
  location text,
  avatar_url text,
  intent text CHECK (intent IN ('shop','sell','both')),
  onboarded boolean NOT NULL DEFAULT false,
  unit_preference text NOT NULL DEFAULT 'cm' CHECK (unit_preference IN ('cm','in')),
  fit_bust_cm numeric,
  fit_waist_cm numeric,
  fit_hip_cm numeric,
  fit_height_cm numeric,
  preferred_fit text CHECK (preferred_fit IN ('snug','fitted','relaxed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, display_name, postcode)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NULLIF(TRIM(CONCAT(NEW.raw_user_meta_data ->> 'first_name', ' ', NEW.raw_user_meta_data ->> 'last_name')), ''), split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'postcode'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LISTINGS
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_name text NOT NULL DEFAULT 'Ekeji seller',
  seller_location text,
  seller_rating numeric NOT NULL DEFAULT 5,
  seller_review_count int NOT NULL DEFAULT 0,
  seller_items_sold int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  fabric_notes text,
  condition_notes text,
  included text,
  price_pence int NOT NULL,
  original_price_pence int,
  category text NOT NULL,
  occasion text NOT NULL,
  colour text NOT NULL,
  fabric text NOT NULL,
  condition text NOT NULL,
  uk_size text,
  bust_cm numeric,
  waist_cm numeric,
  hip_cm numeric,
  shoulder_cm numeric,
  sleeve_cm numeric,
  length_cm numeric,
  wearer_height_cm numeric,
  stretch_level text,
  closure text,
  structure text,
  alteration_potential text,
  fit_notes text,
  location text,
  delivery_options text[] NOT NULL DEFAULT '{}',
  image_key text NOT NULL DEFAULT 'emerald',
  trending boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','draft')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are publicly readable" ON public.listings FOR SELECT USING (status <> 'draft' OR auth.uid() = seller_id);
CREATE POLICY "Sellers insert own listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Sellers delete own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- SAVED ITEMS
CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved items" ON public.saved_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users save items" ON public.saved_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave items" ON public.saved_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DEMO LISTINGS
INSERT INTO public.listings (seller_name, seller_location, seller_rating, seller_review_count, seller_items_sold, title, description, fabric_notes, condition_notes, included, price_pence, original_price_pence, category, occasion, colour, fabric, condition, uk_size, bust_cm, waist_cm, hip_cm, shoulder_cm, sleeve_cm, length_cm, wearer_height_cm, stretch_level, closure, structure, alteration_potential, fit_notes, location, delivery_options, image_key, trending) VALUES
('Adaeze O.','London','4.9',38,24,'Emerald green corset lace Aso Ebi gown','Made by a Lagos atelier for a traditional wedding in Surrey. Worn once, photographed beautifully in daylight.','Hand-beaded French lace over structured satin lining, with fully boned corset bodice.','Excellent condition. Two beads replaced along the left hip, invisible when worn.','Dress only',14500,42000,'Dresses','Traditional wedding','Emerald green','Lace','Excellent','UK 10','88','72','96','37','58','152','168','Low stretch','Lace-up back with concealed zip','Corset bodice, full boning, sewn-in cups, satin lining, 2.5cm seam allowance','Easily alterable','Runs true to size through the bust. The lace-up back gives about an inch either way.','London','{Evri ParcelShop / Locker,Royal Mail Tracked,Local collection}','emerald',true),
('Bisi A.','Manchester','4.8',21,14,'Burgundy Aso Oke Iro and Buba set','A classic hand-woven Aso Oke set tailored for an owambe in Manchester. Rich burgundy with gold stripe detail.','Hand-woven Aso Oke with metallic gold thread, cotton-lined buba.','New without tags. Steamed and stored in a garment bag since the event.','Full set',19500,58000,'Iro & Buba','Owambe','Burgundy','Aso Oke','New without tags','UK 12','94','78','102','39','46','108','165','No stretch','Wrap iro with hook-and-eye buba','Unstructured buba, lined bodice, generous 4cm seam allowance','Easily alterable','The iro wraps generously, so it suits UK 10 to UK 14. Buba is a relaxed fit.','Manchester','{Royal Mail Tracked,Local collection}','burgundy',true),
('Folake M.','Birmingham','5.0',12,9,'Gold embellished wedding guest dress','Floor-length gold column dress with hand-applied crystal work at the shoulder. Worn to one evening reception.','Stretch mikado with crystal and bugle-bead embellishment on the shoulder and cuff.','Excellent condition, no missing crystals. Dry cleaned after wear.','Dress only',11000,29000,'Dresses','Evening event','Gold','Mikado','Excellent','UK 8','84','68','92','36','60','148','170','Medium stretch','Concealed back zip','Lightly boned side seams, full lining, 2cm seam allowance','May be alterable','Fitted through the waist and hip. Best for a snug, sculpted fit.','Birmingham','{Evri ParcelShop / Locker,Royal Mail Tracked}','gold',false),
('Chioma N.','Croydon','4.7',44,31,'Lilac Ankara mermaid gown','Bespoke Ankara mermaid gown with a dramatic fishtail, made for a birthday celebration.','Premium wax-print Ankara cotton with taffeta fishtail underlay.','Very good condition. Slight fading at the inner hem, not visible when worn.','Dress only',9500,24000,'Dresses','Birthday celebration','Lilac','Ankara','Very good','UK 14','98','82','108','40','12','154','172','No stretch','Back zip with hook','Structured bodice, cups, cotton lining, 3cm seam allowance','Easily alterable','Snug through the hip because of the mermaid shape. Tailor can let out the side seams.','Croydon','{Royal Mail Tracked,Local collection}','lilac',true),
('Tunde K.','Leeds','4.9',17,11,'Navy blue agbada set','Three-piece navy agbada with gold machine embroidery at the neckline. Worn once to a traditional engagement.','Cashmere-feel guinea brocade with dense gold embroidery.','Excellent condition, professionally pressed.','Full set',16500,45000,'Menswear','Engagement','Navy','Guinea brocade','Excellent','L','112','96','114','48','62','142','180','No stretch','Open-front agbada, drawstring trouser','Unstructured flowing cut, lined yoke, generous seam allowance','Easily alterable','Generous through the chest. The trouser drawstring covers a 34 to 38 inch waist.','Leeds','{Royal Mail Tracked,Local collection}','navy',false),
('Yewande S.','Essex','4.6',9,6,'Pink gele and ipele set','Coordinated blush pink gele and ipele in crisp Sego, tied once and never re-used.','Crisp Sego with a subtle shimmer, holds shape beautifully.','New without tags, still in original wrap.','Gele and ipele only',4500,12000,'Gele & Ipele','Wedding guest','Blush pink','Sego','New without tags',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'No stretch','Tie','Unstructured, holds a firm gele shape','Not recommended','One size. Gele length 200cm, ipele 180cm.','Essex','{Evri ParcelShop / Locker,Royal Mail Tracked}','pink',false),
('Adaeze O.','London','4.9',38,24,'Champagne two-piece Aso Ebi set','Corset top and fitted skirt in champagne satin, made as Aso Ebi for a Lagos wedding in London.','Duchess satin with organza overlay on the sleeve.','Excellent condition. Worn for one evening.','Full set',13000,36000,'Two-piece sets','Wedding guest','Champagne','Satin','Excellent','UK 10','86','70','94','36','54','104','167','Low stretch','Corset hook-and-eye back','Corset top, full boning, cups, lined skirt, 2.5cm seam allowance','Easily alterable','The corset back adjusts by about two inches. Skirt is fitted through the hip.','London','{Evri ParcelShop / Locker,Royal Mail Tracked,Local collection}','champagne',true),
('Bisi A.','Manchester','4.8',21,14,'Ivory Aso Oke wedding guest gown','Structured ivory Aso Oke gown with gold weave, worn to a graduation celebration.','Hand-woven ivory Aso Oke with gold metallic weave, fully lined.','Good condition with light wear at the hem, easily repaired.','Dress only',8500,26000,'Aso Oke','Graduation','Ivory','Aso Oke','Good','UK 16','104','88','112','41','24','150','174','No stretch','Side zip','Structured bodice, boning at the front panel, lining, 3cm seam allowance','May be alterable','Firm through the waist. Not much give in the fabric, so size up if in doubt.','Manchester','{Royal Mail Tracked}','ivory',false);