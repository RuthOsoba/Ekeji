CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "buyers start conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)));
CREATE POLICY "parties send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)));
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.set_conversation_seller() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT seller_id INTO NEW.seller_id FROM public.listings WHERE id = NEW.listing_id;
  IF NEW.seller_id = NEW.buyer_id THEN RAISE EXCEPTION 'You cannot message yourself'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER conversations_set_seller BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_conversation_seller();

CREATE OR REPLACE FUNCTION public.after_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations; t text;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = NEW.conversation_id;
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = c.id;
  SELECT title INTO t FROM public.listings WHERE id = c.listing_id;
  IF NEW.sender_id IS NOT NULL AND c.seller_id IS NULL THEN
    -- demo seller: automatic friendly reply
    INSERT INTO public.messages (conversation_id, sender_id, body, created_at)
    VALUES (c.id, NULL, 'Thanks for your message! This is a sample listing, so replies are automatic. In the full app the seller would answer here.', NEW.created_at + interval '1 second');
  ELSIF NEW.sender_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (CASE WHEN NEW.sender_id = c.buyer_id THEN c.seller_id ELSE c.buyer_id END,
            'New message', 'About ' || coalesce(t, 'your listing') || ': ' || left(NEW.body, 80));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.after_message();