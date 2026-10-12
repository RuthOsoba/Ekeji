ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = _conversation_id
                 AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)) THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  UPDATE public.messages SET read_at = now()
  WHERE conversation_id = _conversation_id AND read_at IS NULL
    AND sender_id IS DISTINCT FROM auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.after_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = NEW.conversation_id;
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = c.id;
  IF NEW.sender_id IS NOT NULL AND c.seller_id IS NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, body, created_at)
    VALUES (c.id, NULL, 'Thanks for your message! This is a sample listing, so replies are automatic. In the full app the seller would answer here.', NEW.created_at + interval '1 second');
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages','conversations','notifications'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;